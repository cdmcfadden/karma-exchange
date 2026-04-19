import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const MODEL = "text-embedding-3-small"; // 1536 dims, cheap, fast.

/**
 * Embed a single text into a 1536-dimensional vector for pgvector cosine search.
 */
export async function embed(text: string): Promise<number[]> {
  const clean = text.trim().slice(0, 8000);
  if (!clean) return new Array(1536).fill(0);

  const response = await openai.embeddings.create({
    model: MODEL,
    input: clean,
  });
  return response.data[0].embedding;
}

/**
 * Embed multiple texts in a single API call. More efficient for batch skill indexing.
 */
export async function embedBatch(texts: string[]): Promise<number[][]> {
  const cleaned = texts.map((t) => t.trim().slice(0, 8000)).filter(Boolean);
  if (cleaned.length === 0) return [];

  const response = await openai.embeddings.create({
    model: MODEL,
    input: cleaned,
  });
  return response.data.map((d) => d.embedding);
}
