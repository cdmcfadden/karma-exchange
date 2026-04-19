import Anthropic from "@anthropic-ai/sdk";

if (!process.env.ANTHROPIC_API_KEY) {
  // Avoid throwing at import time during build; check at call-site.
  console.warn("ANTHROPIC_API_KEY is not set");
}

export const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY!,
});

// Model IDs — latest as of knowledge cutoff; adjust as needed.
export const CLAUDE_MODEL = "claude-sonnet-4-6";
export const CLAUDE_FAST_MODEL = "claude-haiku-4-5-20251001";
