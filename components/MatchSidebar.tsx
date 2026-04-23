"use client";

import { useEffect, useState } from "react";
import { Users, Sparkles, Bug, ChevronDown, ChevronUp } from "lucide-react";
import { cn, LEVEL_STYLES } from "@/lib/utils";
import type { SkillLevel } from "@/lib/utils";
import type { MatchCandidate } from "@/lib/matching";

interface MatchSidebarProps {
  requestText: string;
  onSelectMatch?: (match: MatchCandidate) => void;
}

interface CandidateSkill {
  user_id: string;
  skill_name: string;
  category: string;
  level: string;
  has_embedding: boolean;
}

interface MatchDebug {
  total_users: number;
  completed_wheelhouse: number;
  with_embeddings: number;
  candidate_skills?: CandidateSkill[];
}

export function MatchSidebar({ requestText, onSelectMatch }: MatchSidebarProps) {
  const [matches, setMatches] = useState<MatchCandidate[]>([]);
  const [loading, setLoading] = useState(false);
  const [debug, setDebug] = useState<MatchDebug | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showDebug, setShowDebug] = useState(false);

  useEffect(() => {
    if (!requestText || requestText.trim().length < 8) {
      setMatches([]);
      setDebug(null);
      setError(null);
      return;
    }

    const abortController = new AbortController();

    const fetchMatches = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/match", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: requestText }),
          signal: abortController.signal,
        });
        const data = await res.json();
        if (!res.ok) {
          setError(data.error ?? `HTTP ${res.status}`);
        }
        setMatches(data.matches ?? []);
        setDebug(data.debug ?? null);
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") {
          console.error(err);
          setError((err as Error).message);
        }
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => void fetchMatches(), 600);
    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [requestText]);

  const emptyMessage =
    requestText.length < 8
      ? "Start typing your request to see matches…"
      : debug && debug.total_users === 0
      ? "You're the first user! Invite someone to test matching."
      : debug && debug.completed_wheelhouse === 0
      ? "No other users have completed their wheelhouse yet."
      : debug && debug.with_embeddings === 0
      ? "Other users haven't added skills with enough detail for matching."
      : "No strong matches for this request — try different wording.";

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-violet-600" />
          <h3 className="font-semibold text-sm">Recommended matches</h3>
          {loading && (
            <div className="w-1.5 h-1.5 rounded-full bg-violet-500 animate-pulse ml-auto" />
          )}
          {!loading && (
            <button
              onClick={() => setShowDebug((p) => !p)}
              className="ml-auto text-muted-foreground hover:text-violet-600 transition"
              title="Toggle debug panel"
            >
              <Bug className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto karma-scroll p-3 space-y-2">
        {/* Debug panel */}
        {showDebug && (
          <div className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-xs space-y-2">
            <button
              onClick={() => setShowDebug(false)}
              className="flex items-center gap-1 font-semibold text-amber-800 w-full"
            >
              <Bug className="w-3 h-3" />
              Debug Info
              <ChevronUp className="w-3 h-3 ml-auto" />
            </button>

            <div className="space-y-1 text-amber-900">
              <p>
                <span className="font-medium">Request text:</span>{" "}
                {requestText.length < 8
                  ? "(too short)"
                  : `"${requestText.slice(0, 80)}${requestText.length > 80 ? "…" : ""}"`}
              </p>
              <p>
                <span className="font-medium">Text length:</span>{" "}
                {requestText.length} chars
              </p>

              {error && (
                <p className="text-red-700">
                  <span className="font-medium">Error:</span> {error}
                </p>
              )}

              {debug && (
                <>
                  <div className="border-t border-amber-200 pt-1 mt-1" />
                  <p>
                    <span className="font-medium">Other users:</span>{" "}
                    {debug.total_users}
                  </p>
                  <p>
                    <span className="font-medium">Completed wheelhouse:</span>{" "}
                    <span
                      className={
                        debug.completed_wheelhouse === 0
                          ? "text-red-700 font-semibold"
                          : ""
                      }
                    >
                      {debug.completed_wheelhouse}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Skills with embeddings:</span>{" "}
                    <span
                      className={
                        debug.with_embeddings === 0
                          ? "text-red-700 font-semibold"
                          : ""
                      }
                    >
                      {debug.with_embeddings}
                    </span>
                  </p>
                  <p>
                    <span className="font-medium">Matches returned:</span>{" "}
                    {matches.length}
                  </p>

                  {debug.candidate_skills &&
                    debug.candidate_skills.length > 0 && (
                      <>
                        <div className="border-t border-amber-200 pt-1 mt-1" />
                        <p className="font-medium">Candidate skills in system:</p>
                        {debug.candidate_skills.map((s, i) => (
                          <p key={i} className="pl-2">
                            • {s.skill_name}{" "}
                            <span className="text-amber-700">
                              ({s.category}, {s.level})
                            </span>{" "}
                            {s.has_embedding ? (
                              <span className="text-emerald-700">✓ embedded</span>
                            ) : (
                              <span className="text-red-700 font-semibold">
                                ✗ no embedding
                              </span>
                            )}
                          </p>
                        ))}
                      </>
                    )}
                </>
              )}

              {!debug && !loading && requestText.length >= 8 && (
                <p className="text-amber-700 italic">
                  No debug data returned — check server logs.
                </p>
              )}
            </div>
          </div>
        )}

        {/* Empty state */}
        {matches.length === 0 && !loading && (
          <div className="p-6 text-center">
            <Sparkles className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
            <p className="text-sm text-muted-foreground">{emptyMessage}</p>
            {error && (
              <p className="text-xs text-red-600 mt-2">{error}</p>
            )}
          </div>
        )}

        {/* Match cards */}
        {matches.map((m, i) => (
          <button
            key={m.user_id}
            onClick={() => onSelectMatch?.(m)}
            className={cn(
              "w-full text-left rounded-lg border border-border p-3 bg-white hover:border-violet-400 hover:shadow-sm transition-all cursor-pointer",
              "animate-in fade-in slide-in-from-left-2",
            )}
            style={{ animationDelay: `${i * 50}ms` }}
          >
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-violet-100 flex items-center justify-center shrink-0">
                {m.avatar_url ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={m.avatar_url}
                    alt=""
                    className="w-full h-full rounded-full object-cover"
                  />
                ) : (
                  <span className="font-semibold text-violet-700">
                    {m.display_name.slice(0, 1).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-medium text-sm truncate">{m.display_name}</p>
                  <span className="text-xs text-violet-600 font-semibold shrink-0">
                    {Math.round(m.final_score * 100)}%
                  </span>
                </div>
                <div className="flex items-center gap-1.5 mt-0.5">
                  <span className="text-xs text-muted-foreground capitalize truncate">
                    {m.top_skill_name}
                  </span>
                  <span
                    className={cn(
                      "text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0",
                      LEVEL_STYLES[m.top_skill_level as SkillLevel].color,
                    )}
                  >
                    {LEVEL_STYLES[m.top_skill_level as SkillLevel].label}
                  </span>
                </div>
                {m.why_match && (
                  <p className="text-xs text-slate-600 mt-2 line-clamp-3 italic">
                    &ldquo;{m.why_match}&rdquo;
                  </p>
                )}
              </div>
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
