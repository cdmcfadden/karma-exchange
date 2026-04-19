import { NextResponse } from "next/server";
import { createClient, createServiceClient } from "@/lib/supabase/server";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Unauthenticated" }, { status: 401 });

  const { site_id, url } = (await req.json()) as { site_id?: string; url?: string };

  if (!site_id || !url) {
    return NextResponse.json({ error: "site_id and url are required" }, { status: 400 });
  }

  if (!url.startsWith("https://")) {
    return NextResponse.json({ error: "URL must start with https://" }, { status: 400 });
  }

  const service = createServiceClient();

  const { data, error } = await service
    .from("skill_validations")
    .upsert(
      {
        user_id: user.id,
        site_id,
        url,
        status: "linked",
        results: null,
        error_message: null,
        verified_at: null,
      },
      { onConflict: "user_id,site_id" },
    )
    .select()
    .single();

  if (error) {
    console.error("[validation/link] upsert failed:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ validation: data });
}
