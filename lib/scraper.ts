import * as cheerio from "cheerio";

const MAX_TEXT_LENGTH = 12000;

const USER_AGENT =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

type ScrapeOk = { ok: true; text: string; title: string };
type ScrapeFail = { ok: false; error: string };

/**
 * Sections that contain meaningful profile content on LinkedIn
 * and similar profile sites. We search for these markers in the
 * full body text and extract the content around them.
 */
const PROFILE_SECTIONS = [
  "Experience",
  "Education",
  "Skills",
  "Licenses & Certifications",
  "Certifications",
  "Volunteer",
  "About",
  "Summary",
  "Projects",
  "Publications",
  "Honors",
  "Courses",
];

/**
 * For LinkedIn and similar JS-heavy profile sites, the useful content
 * is buried deep in the page past login walls and boilerplate.
 * This function finds known section headers and extracts text around them.
 */
function extractProfileSections(fullText: string): string {
  const chunks: string[] = [];

  for (const section of PROFILE_SECTIONS) {
    const idx = fullText.indexOf(section);
    if (idx === -1) continue;
    // Grab up to 1500 chars starting from the section header
    const chunk = fullText.slice(idx, idx + 1500).trim();
    if (chunk.length > 20) {
      chunks.push(chunk);
    }
  }

  return chunks.join("\n\n");
}

/**
 * Extract JSON-LD structured data from the page (before stripping scripts).
 * LinkedIn embeds post content and sometimes profile data here.
 */
function extractJsonLd($: cheerio.CheerioAPI): string {
  const parts: string[] = [];
  $('script[type="application/ld+json"]').each((_i, el) => {
    try {
      const raw = $(el).html();
      if (!raw) return;
      const data = JSON.parse(raw);
      const graph = data["@graph"] ?? [data];
      for (const item of graph) {
        if (item.text) parts.push(String(item.text).slice(0, 500));
        if (item.description) parts.push(String(item.description).slice(0, 500));
        if (item.name) parts.push(`Name: ${item.name}`);
        if (item.jobTitle) parts.push(`Job title: ${item.jobTitle}`);
        if (item.worksFor?.name) parts.push(`Works for: ${item.worksFor.name}`);
      }
    } catch {
      // malformed JSON-LD — skip
    }
  });
  return parts.join("\n").slice(0, 3000);
}

/**
 * Extract useful content from meta/OG tags. Many JS-heavy sites
 * (YouTube, Strava, etc.) have empty bodies but rich meta tags
 * that are server-rendered.
 */
function extractMetaTags($: cheerio.CheerioAPI): string {
  const parts: string[] = [];
  const seen = new Set<string>();

  $("meta").each((_i, el) => {
    const name =
      $(el).attr("name") || $(el).attr("property") || "";
    const content = $(el).attr("content") || "";
    if (!content || content.length < 5) return;

    const isUseful =
      name.includes("description") ||
      name.includes("title") ||
      name === "keywords" ||
      name.startsWith("og:") ||
      name.startsWith("twitter:");

    if (isUseful && !seen.has(content)) {
      seen.add(content);
      parts.push(`${name}: ${content}`);
    }
  });

  return parts.join("\n").slice(0, 2000);
}

export async function scrapeUrl(url: string): Promise<ScrapeOk | ScrapeFail> {
  try {
    const res = await fetch(url, {
      headers: {
        "User-Agent": USER_AGENT,
        Accept: "text/html,application/xhtml+xml",
        "Accept-Language": "en-US,en;q=0.9",
      },
      redirect: "follow",
      signal: AbortSignal.timeout(10_000),
    });

    if (!res.ok) {
      if (res.status === 403 || res.status === 401) {
        return {
          ok: false,
          error: `Access denied (${res.status}). This site may require authentication.`,
        };
      }
      return { ok: false, error: `HTTP ${res.status}: ${res.statusText}` };
    }

    const contentType = res.headers.get("content-type") ?? "";
    if (
      !contentType.includes("text/html") &&
      !contentType.includes("application/xhtml")
    ) {
      return { ok: false, error: `Unexpected content type: ${contentType}` };
    }

    const html = await res.text();
    const $ = cheerio.load(html);

    const title = $("title").first().text().trim();

    // Extract structured data BEFORE stripping scripts
    const jsonLdText = extractJsonLd($);
    const metaText = extractMetaTags($);

    // Strip non-content elements
    $("script, style, nav, footer, header, noscript, iframe, svg").remove();

    const fullBodyText = $("body").text().replace(/\s+/g, " ").trim();

    // Try smart section extraction first (for LinkedIn-style pages)
    const sectionText = extractProfileSections(fullBodyText);

    // Assemble text using the richest available source
    const parts: string[] = [];
    if (sectionText.length > 200) {
      parts.push(sectionText);
    }
    if (jsonLdText.length > 100) {
      parts.push(jsonLdText);
    }
    if (metaText.length > 50) {
      parts.push(metaText);
    }
    // Add raw body if we don't have much structured content
    if (parts.join("").length < 500 && fullBodyText.length > 200) {
      parts.push(fullBodyText.slice(0, 6000));
    }

    let text = parts.filter(Boolean).join("\n\n---\n\n").slice(0, MAX_TEXT_LENGTH);

    if (text.length < 50) {
      return {
        ok: false,
        error:
          "Page returned very little text content. It may require JavaScript or authentication.",
      };
    }

    return { ok: true, text, title };
  } catch (err) {
    if (err instanceof DOMException && err.name === "TimeoutError") {
      return { ok: false, error: "Request timed out after 10 seconds." };
    }
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, error: `Fetch failed: ${msg}` };
  }
}
