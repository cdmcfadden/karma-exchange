"use client";

import { useState } from "react";
import {
  ExternalLink,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Lock,
  ChevronDown,
  ChevronUp,
  Link2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import type { ValidationSite } from "@/lib/validation-sites";
import { VerificationResults } from "./VerificationResults";

export interface SkillValidation {
  id: string;
  site_id: string;
  url: string;
  status: string;
  results: {
    page_summary: string;
    assessments: Array<{
      skill_name: string;
      verdict: "supported" | "partial" | "unsupported";
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
  } | null;
  error_message: string | null;
}

interface Props {
  site: ValidationSite;
  matchedSkills: string[];
  validation: SkillValidation | null;
}

const STATUS_CONFIG: Record<
  string,
  { label: string; color: string; icon: typeof CheckCircle2 }
> = {
  linked: { label: "Linked", color: "text-slate-500", icon: Link2 },
  verifying: { label: "In process...", color: "text-amber-600", icon: Loader2 },
  verified: { label: "Completed", color: "text-emerald-600", icon: CheckCircle2 },
  partial: { label: "Completed", color: "text-emerald-600", icon: CheckCircle2 },
  failed: { label: "Failed", color: "text-red-600", icon: XCircle },
  inaccessible: { label: "Inaccessible", color: "text-red-500", icon: Lock },
};

export function SiteCard({ site, matchedSkills, validation }: Props) {
  const [urlInput, setUrlInput] = useState("");
  const [saving, setSaving] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const status = validation?.status ?? null;
  const cfg = status ? STATUS_CONFIG[status] ?? STATUS_CONFIG.failed : null;
  const hasResults =
    validation?.results &&
    ((validation.results.assessments?.length ?? 0) > 0 ||
      (validation.results.discovered_skills?.length ?? 0) > 0);
  const isTerminal = status && !["linked", "verifying"].includes(status);

  async function handleLink() {
    const url = urlInput.trim();
    if (!url) return;
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/validation/link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ site_id: site.id, url }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg ?? "Failed to save link");
      } else {
        setUrlInput("");
      }
    } catch {
      setError("Network error");
    } finally {
      setSaving(false);
    }
  }

  async function handleVerify() {
    if (!validation) return;
    setError(null);
    try {
      const res = await fetch("/api/validation/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ validation_id: validation.id }),
      });
      if (!res.ok) {
        const { error: msg } = await res.json();
        setError(msg ?? "Failed to start verification");
      }
    } catch {
      setError("Network error");
    }
  }

  return (
    <div className="rounded-lg border border-border p-3 bg-white">
      {/* Header row */}
      <div className="flex items-start justify-between gap-2 mb-1">
        <div className="min-w-0">
          <div className="flex items-center gap-1.5">
            <p className="font-medium text-sm leading-tight">{site.name}</p>
            <a
              href={site.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-muted-foreground hover:text-violet-600"
            >
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
          <p className="text-xs text-muted-foreground leading-snug mt-0.5">
            {site.description}
          </p>
        </div>
        {cfg && (
          <span
            className={cn(
              "flex items-center gap-1 text-[11px] font-medium whitespace-nowrap shrink-0",
              cfg.color,
            )}
          >
            <cfg.icon
              className={cn(
                "w-3.5 h-3.5",
                status === "verifying" && "animate-spin",
              )}
            />
            {cfg.label}
          </span>
        )}
      </div>

      {/* Matched skills */}
      {matchedSkills.length > 0 && (
        <p className="text-[11px] text-violet-600 mb-2">
          Relevant for: {matchedSkills.slice(0, 3).join(", ")}
          {matchedSkills.length > 3 && ` +${matchedSkills.length - 3}`}
        </p>
      )}

      {/* Auth required hint (shown before any link attempt) */}
      {!validation && site.auth_required && (
        <p className="text-[11px] text-amber-600 mb-2 flex items-center gap-1">
          <Lock className="w-3 h-3" />
          Requires authentication — scraping may be limited.
        </p>
      )}

      {/* URL input — shown when no validation exists */}
      {!validation && (
        <div className="flex gap-1.5 mt-2">
          <Input
            type="url"
            placeholder={`https://${site.url.replace("https://", "").replace("www.", "")}/your-profile`}
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            className="text-xs h-8"
            disabled={saving}
          />
          <Button
            size="sm"
            variant="outline"
            className="h-8 text-xs shrink-0"
            onClick={handleLink}
            disabled={saving || !urlInput.trim()}
          >
            {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : "Link"}
          </Button>
        </div>
      )}

      {/* Linked URL display + actions */}
      {validation && (
        <div className="mt-2">
          <p className="text-xs text-muted-foreground truncate mb-1.5">
            {validation.url}
          </p>

          <div className="flex gap-1.5">
            {status !== "verifying" && (
              <Button
                size="sm"
                variant="outline"
                className="h-7 text-xs"
                onClick={handleVerify}
              >
                {status === "linked" ? "Verify" : "Re-verify"}
              </Button>
            )}
            {isTerminal && hasResults && (
              <Button
                size="sm"
                variant="ghost"
                className="h-7 text-xs"
                onClick={() => setExpanded(!expanded)}
              >
                {expanded ? (
                  <>
                    Hide <ChevronUp className="w-3 h-3 ml-0.5" />
                  </>
                ) : (
                  <>
                    Results <ChevronDown className="w-3 h-3 ml-0.5" />
                  </>
                )}
              </Button>
            )}
          </div>

          {/* Inaccessible hint */}
          {status === "inaccessible" && (
            <p className="text-[11px] text-muted-foreground mt-1.5 flex items-center gap-1">
              <Lock className="w-3 h-3" />
              This site may require credentials. MCP connection coming soon.
            </p>
          )}

          {/* Error message */}
          {validation.error_message && status !== "inaccessible" && (
            <p className="text-[11px] text-red-600 mt-1">
              {validation.error_message}
            </p>
          )}
        </div>
      )}

      {/* Expanded results */}
      {expanded && validation?.results && (
        <VerificationResults
          pageSummary={validation.results.page_summary}
          assessments={validation.results.assessments}
          discoveredSkills={validation.results.discovered_skills}
        />
      )}

      {error && (
        <p className="text-[11px] text-red-600 mt-1">{error}</p>
      )}
    </div>
  );
}
