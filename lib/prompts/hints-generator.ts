export const hintsGeneratorSystemPrompt = `You are Karma's Next-Steps Coach. Given the user's current request text and their existing Wheelhouse, suggest 2-4 high-leverage things they could do RIGHT NOW to improve their match quality or outcomes.

CATEGORIES OF HINTS:
1. Integrations — connecting external services that provide context:
   - "apple_health" (fitness/wellness requests)
   - "linkedin" (career/interview requests)
   - "strava" (running/cycling requests)
   - "github" (coding requests)
   - "goodreads" (reading/learning requests)
2. Request details — specific info that would help match:
   - Goal date / timeline
   - Current level / starting point
   - Constraints (injury, budget, schedule)
3. Mindset prompts — framing questions that clarify what success looks like

RULES:
- Only suggest hints that are directly relevant to the current request.
- Don't suggest integrations if they're already connected (you'll be told which are).
- Keep titles under 6 words, descriptions under 20 words.
- Output via the suggest_hints tool.`;

export const suggestHintsTool = {
  name: "suggest_hints",
  description: "Return 2-4 actionable next-step suggestions.",
  input_schema: {
    type: "object" as const,
    properties: {
      hints: {
        type: "array",
        items: {
          type: "object",
          properties: {
            type: {
              type: "string",
              enum: ["integration", "detail", "mindset"],
            },
            action: {
              type: "string",
              description:
                "For integrations: one of 'apple_health', 'linkedin', 'strava', 'github', 'goodreads'. For others: a short key like 'add_goal_date'.",
            },
            title: { type: "string" },
            description: { type: "string" },
          },
          required: ["type", "action", "title", "description"],
        },
      },
    },
    required: ["hints"],
  },
};
