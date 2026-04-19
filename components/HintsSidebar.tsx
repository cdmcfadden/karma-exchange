"use client";

import { useEffect, useState } from "react";
import { Lightbulb, Link2, Target, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

interface Hint {
  type: "integration" | "detail" | "mindset";
  action: string;
  title: string;
  description: string;
}

const ICONS = {
  integration: Link2,
  detail: Target,
  mindset: Brain,
};

export function HintsSidebar({ requestText }: { requestText: string }) {
  const [hints, setHints] = useState<Hint[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!requestText || requestText.trim().length < 20) {
      setHints([]);
      return;
    }

    const abortController = new AbortController();

    const fetchHints = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/hints", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: requestText }),
          signal: abortController.signal,
        });
        if (!res.ok) return;
        const data = (await res.json()) as { hints: Hint[] };
        setHints(data.hints);
      } catch (err: unknown) {
        if ((err as Error).name !== "AbortError") console.error(err);
      } finally {
        setLoading(false);
      }
    };

    const timeout = setTimeout(() => void fetchHints(), 800);
    return () => {
      clearTimeout(timeout);
      abortController.abort();
    };
  }, [requestText]);

  return (
    <div className="h-full flex flex-col">
      <div className="px-4 py-3 border-b bg-white sticky top-0 z-10">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-sm">Next steps</h3>
          {loading && (
            <div className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse ml-auto" />
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto karma-scroll p-3 space-y-2">
        {hints.length === 0 && !loading && (
          <p className="text-sm text-muted-foreground italic p-3">
            Keep describing your request and we'll suggest ways to sharpen it.
          </p>
        )}

        {hints.map((h, i) => {
          const Icon = ICONS[h.type];
          return (
            <div
              key={i}
              className={cn(
                "rounded-lg border border-amber-100 bg-amber-50/50 p-3",
                "animate-in fade-in slide-in-from-right-2",
              )}
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start gap-2">
                <Icon className="w-4 h-4 text-amber-700 mt-0.5 shrink-0" />
                <div>
                  <p className="font-medium text-sm">{h.title}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">{h.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
