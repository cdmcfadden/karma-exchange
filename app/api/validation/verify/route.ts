import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";
import { anthropic, CLAUDE_FAST_MODEL } from "@/lib/claude";
import { embed } from "@/lib/embeddings";
import { scrapeUrl } from "@/lib/scraper";
import {
  skillVerifierSystemPrompt,
  verifySkillsTool,
} from "@/lib/prompts/skill-verifier";
import { VALIDATION_SITES } from "@/lib/validation-sites";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user)
    return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { validation_id } = (await req.json()) as {
    validation_id?: string;
  };
  if (!validation_id) {
    return NextResponse.json(
      { error: "validation_id is required" },
      { status: 400 },
    );
  }

  const service = createServiceClient();

  const { data: validation } = await service
    .from("skill_validations")
    .select("*")
    .eq("id", validation_id)
    .eq("user_id", user.id)
    .single();

  if (!validation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Set status to verifying immediately
  await service
    .from("skill_validations")
    .update({ status: "verifying", error_message: null })
    .eq("id", validation_id);

  // Fire background verification (don't await — return 202 immediately)
  const userId = user.id;
  const valId = validation_id;
  const siteId = validation.site_id;
  const url = validation.url;

  void runVerification(service, userId, valId, siteId, url);

  return NextResponse.json({ status: "verifying" }, { status: 202 });
}

async function runVerification(
  service: ReturnType<typeof createServiceClient>,
  userId: string,
  validationId: string,
  siteId: string,
  url: string,
) {
  try {
    // 1. Scrape
    const scrapeResult = await scrapeUrl(url);
    if (!scrapeResult.ok) {
      await service
        .from("skill_validations")
        .update({
          status: "inaccessible",
          error_message: scrapeResult.error,
        })
        .eq("id", validationId);
      return;
    }

    // 2. Load user's skills matching this site's categories
    const site = VALIDATION_SITES.find((s) => s.id === siteId);
    const categories = site?.categories ?? [];

    const { data: skills } = await service
      .from("wheelhouse_skills")
      .select("skill_name, category, level, evidence_text")
      .eq("user_id", userId);

    const relevantSkills = (skills ?? []).filter(
      (s) =>
        categories.includes(s.category) ||
        site?.keywords?.some((k) =>
          s.skill_name.toLowerCase().includes(k.toLowerCase()),
        ),
    );

    // Always call Claude — even with 0 relevant skills, it can discover new ones.
    // 3. Call Claude Haiku for analysis
    const allSkillNames = (skills ?? []).map((s) => s.skill_name.toLowerCase());

    const userMessage = JSON.stringify({
      site_name: site?.name ?? siteId,
      page_title: scrapeResult.title,
      page_text: scrapeResult.text,
      claimed_skills: relevantSkills.map((s) => ({
        skill_name: s.skill_name,
        category: s.category,
        level: s.level,
        evidence_text: s.evidence_text,
      })),
      all_existing_skill_names: allSkillNames,
    });

    const response = await anthropic.messages.create({
      model: CLAUDE_FAST_MODEL,
      max_tokens: 2048,
      system: skillVerifierSystemPrompt,
      tools: [verifySkillsTool],
      tool_choice: { type: "tool", name: "verify_skills" },
      messages: [{ role: "user", content: userMessage }],
    });

    const toolUse = response.content.find((c) => c.type === "tool_use");
    if (!toolUse || toolUse.type !== "tool_use") {
      await service
        .from("skill_validations")
        .update({ status: "failed", error_message: "AI did not return structured results." })
        .eq("id", validationId);
      return;
    }

    const results = toolUse.input as {
      page_summary: string;
      assessments: Array<{
        skill_name: string;
        verdict: string;
        confidence: number;
        evidence_quote: string;
        level_assessment: string;
      }>;
      discovered_skills?: Array<{
        skill_name: string;
        category: string;
        level: string;
        evidence_text: string;
      }>;
    };

    // 4. Ingest discovered skills into wheelhouse
    const discovered = results.discovered_skills ?? [];
    let ingestedCount = 0;
    for (const ds of discovered) {
      // Skip if user already has a skill with this name
      if (allSkillNames.includes(ds.skill_name.toLowerCase())) continue;
      try {
        const text = `${ds.skill_name} (${ds.category}) - ${ds.evidence_text}`;
        const skillEmbedding = await embed(text);
        await service.from("wheelhouse_skills").insert({
          user_id: userId,
          category: ds.category,
          skill_name: ds.skill_name,
          level: ds.level,
          evidence_text: `[Discovered from ${site?.name ?? siteId}] ${ds.evidence_text}`,
          embedding: skillEmbedding as unknown as string,
        });
        ingestedCount++;
        console.log(`[verify] ingested skill: ${ds.skill_name} (${ds.category})`);
      } catch (err) {
        console.error(`[verify] failed to ingest skill ${ds.skill_name}:`, err);
      }
    }
    if (ingestedCount > 0) {
      console.log(`[verify] ingested ${ingestedCount} new skills from ${site?.name ?? siteId}`);
    }

    // Determine overall status
    const verdicts = results.assessments.map((a) => a.verdict);
    const hasDiscoveries = ingestedCount > 0 || (results.discovered_skills?.length ?? 0) > 0;
    let status: "verified" | "partial" | "failed" = "failed";
    if (hasDiscoveries && verdicts.length === 0) {
      // No skills to verify but we found new ones — success
      status = "verified";
    } else if (verdicts.some((v) => v === "supported") || hasDiscoveries) {
      status = verdicts.every((v) => v === "supported") ? "verified" : "partial";
    } else if (verdicts.some((v) => v === "partial")) {
      status = "partial";
    }

    await service
      .from("skill_validations")
      .update({
        status,
        results,
        verified_at: new Date().toISOString(),
      })
      .eq("id", validationId);
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[validation/verify] background error:", err);
    await service
      .from("skill_validations")
      .update({ status: "failed", error_message: msg })
      .eq("id", validationId);
  }
}
