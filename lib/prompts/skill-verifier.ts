export const skillVerifierSystemPrompt = `You are a skill verification agent for a peer-matching platform. You receive extracted text from a public web profile and a list of skills the user claims to have.

You have TWO jobs:

JOB 1 — VERIFY CLAIMED SKILLS:
Assess whether the page content provides evidence for each claimed skill.

SCORING RULES:
- "supported": Clear, specific evidence on the page (metrics, portfolio items, work history, certifications, activity logs).
- "partial": Indirect hints but no definitive proof (e.g., the category is mentioned but not the specific skill, or the page suggests familiarity but not the claimed level).
- "unsupported": No relevant evidence found. This does NOT mean the skill is fake — just that this particular page doesn't demonstrate it.

CONFIDENCE: 0.0–1.0 reflecting how certain you are about the verdict.
LEVEL ASSESSMENT: Based solely on what the page shows, estimate the level (beginner/intermediate/advanced/expert/master).
EVIDENCE QUOTE: Copy a short verbatim excerpt from the page. Leave empty if unsupported.

JOB 2 — DISCOVER NEW SKILLS:
Scan the profile for skills, certifications, volunteer work, or experience that the user has NOT claimed yet but which are clearly evidenced on the page. These are skills they could teach others on a peer platform.

For each discovered skill, provide:
- skill_name: specific and concise (e.g., "Six Sigma Black Belt", "project management", "disaster relief volunteering")
- category: one of fitness, cooking, career, interview_prep, finance, mental_health, parenting, creative, language, technology, learning, relationships, home_skills, spiritual_practice, business, communication
- level: your estimate based on the evidence
- evidence_text: brief summary of the evidence

Only discover skills with CLEAR evidence — don't speculate. Aim for 3–8 discovered skills from a typical profile.

Be conservative and fair. Users are real people sharing genuine profiles.`;

export const verifySkillsTool = {
  name: "verify_skills",
  description:
    "Return per-skill verification AND newly discovered skills from a web profile page.",
  input_schema: {
    type: "object" as const,
    properties: {
      page_summary: {
        type: "string",
        description:
          "One-sentence summary of what this profile page contains.",
      },
      assessments: {
        type: "array",
        description: "Verification of each claimed skill.",
        items: {
          type: "object",
          properties: {
            skill_name: { type: "string" },
            verdict: {
              type: "string",
              enum: ["supported", "partial", "unsupported"],
            },
            confidence: {
              type: "number",
              minimum: 0,
              maximum: 1,
            },
            evidence_quote: {
              type: "string",
              description:
                "Short verbatim excerpt from the page, or empty string if unsupported.",
            },
            level_assessment: {
              type: "string",
              description:
                "Estimated level based on page evidence: beginner, intermediate, advanced, expert, or master.",
            },
          },
          required: [
            "skill_name",
            "verdict",
            "confidence",
            "evidence_quote",
            "level_assessment",
          ],
        },
      },
      discovered_skills: {
        type: "array",
        description:
          "New skills found on the profile that the user has NOT claimed yet.",
        items: {
          type: "object",
          properties: {
            skill_name: {
              type: "string",
              description: "Specific skill name (e.g., 'project management').",
            },
            category: {
              type: "string",
              description:
                "Category: fitness, cooking, career, finance, technology, creative, business, communication, etc.",
            },
            level: {
              type: "string",
              enum: [
                "beginner",
                "intermediate",
                "advanced",
                "expert",
                "master",
              ],
            },
            evidence_text: {
              type: "string",
              description:
                "Brief summary of the evidence found on the profile.",
            },
          },
          required: ["skill_name", "category", "level", "evidence_text"],
        },
      },
    },
    required: ["page_summary", "assessments", "discovered_skills"],
  },
};
