"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { IconBell, IconCheck } from "./karma-icons";
import { Check, X, MessageSquare } from "lucide-react";

interface PendingSession {
  id: string;
  receiver_id: string;
  session_type: string;
  karma_cost: number;
  status: string;
  created_at: string;
  receiver_name?: string;
}

export function PendingRequests({ userId }: { userId: string }) {
  const router = useRouter();
  const [sessions, setSessions] = useState<PendingSession[]>([]);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const supabase = createClient();

    void (async () => {
      // Fetch pending + recently accepted sessions where I'm the helper
      const { data } = await supabase
        .from("sessions")
        .select("id, receiver_id, session_type, karma_cost, status, created_at")
        .eq("helper_id", userId)
        .in("status", ["pending", "accepted"])
        .order("created_at", { ascending: false })
        .limit(20);

      if (data) {
        const enriched = await enrichWithNames(supabase, data as PendingSession[]);
        setSessions(enriched);
      }
    })();

    const channel = supabase
      .channel(`pending:${userId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "sessions",
          filter: `helper_id=eq.${userId}`,
        },
        async (payload) => {
          const s = payload.new as PendingSession;
          const enriched = await enrichWithNames(supabase, [s]);
          setSessions((prev) =>
            prev.some((p) => p.id === s.id)
              ? prev
              : [enriched[0], ...prev],
          );
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "sessions",
          filter: `helper_id=eq.${userId}`,
        },
        (payload) => {
          const updated = payload.new as PendingSession;
          setSessions((prev) =>
            prev.map((s) => (s.id === updated.id ? { ...s, ...updated } : s)),
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [userId]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  async function enrichWithNames(
    supabase: ReturnType<typeof createClient>,
    items: PendingSession[],
  ): Promise<PendingSession[]> {
    const ids = [...new Set(items.map((s) => s.receiver_id))];
    if (ids.length === 0) return items;
    const { data: users } = await supabase
      .from("users")
      .select("id, display_name")
      .in("id", ids);
    const nameMap = new Map(
      (users ?? []).map((u) => [u.id, u.display_name]),
    );
    return items.map((s) => ({
      ...s,
      receiver_name: nameMap.get(s.receiver_id) ?? "Someone",
    }));
  }

  async function handleAccept(sessionId: string) {
    const res = await fetch("/api/session/accept", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      setSessions((prev) =>
        prev.map((s) =>
          s.id === sessionId ? { ...s, status: "accepted" } : s,
        ),
      );
    }
  }

  async function handleDecline(sessionId: string) {
    const res = await fetch("/api/session/cancel", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ sessionId }),
    });
    if (res.ok) {
      setSessions((prev) => prev.filter((s) => s.id !== sessionId));
    }
  }

  const pendingCount = sessions.filter((s) => s.status === "pending").length;

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={() => setOpen((p) => !p)}
        className="relative transition"
        style={{ color: "var(--text-dim)" }}
        title="Match requests"
      >
        <IconBell size={18} />
        {pendingCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center">
            {pendingCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-8 w-72 glass-card shadow-lg shadow-black/40 z-50 overflow-hidden">
          <div className="px-3 py-2" style={{ borderBottom: "1px solid rgba(232,212,168,0.08)", background: "rgba(0,0,0,0.3)" }}>
            <p className="font-mono text-xs" style={{ color: "var(--brass)", letterSpacing: "0.15em" }}>
              Match Requests
            </p>
          </div>
          <div className="max-h-64 overflow-y-auto">
            {sessions.length === 0 ? (
              <p className="p-4 text-xs text-center" style={{ color: "var(--text-faint)" }}>
                No requests yet.
              </p>
            ) : (
              sessions.map((s) => (
                <div
                  key={s.id}
                  className="px-3 py-2.5 hover:bg-[rgba(232,212,168,0.04)]"
                  style={{ borderBottom: "1px solid rgba(232,212,168,0.06)" }}
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <p className="text-sm font-medium truncate">
                      {s.receiver_name}
                    </p>
                    <span
                      className="text-[10px] px-1.5 py-0.5 font-medium shrink-0 font-mono"
                      style={{
                        color: s.status === "pending" ? "var(--warn)" : "var(--ok)",
                        letterSpacing: "0.1em",
                      }}
                    >
                      {s.status === "pending" ? "Pending" : "Accepted"}
                    </span>
                  </div>
                  <p className="text-[11px] text-muted-foreground mb-2">
                    {s.session_type} session · {s.karma_cost} karma
                  </p>
                  <div className="flex gap-1.5">
                    {s.status === "pending" && (
                      <>
                        <button
                          onClick={() => void handleAccept(s.id)}
                          className="flex items-center gap-1 text-[11px] text-emerald-700 hover:text-emerald-900 font-medium"
                        >
                          <Check className="w-3 h-3" /> Accept
                        </button>
                        <button
                          onClick={() => void handleDecline(s.id)}
                          className="flex items-center gap-1 text-[11px] text-red-600 hover:text-red-800 font-medium"
                        >
                          <X className="w-3 h-3" /> Decline
                        </button>
                      </>
                    )}
                    {s.status === "accepted" && (
                      <button
                        onClick={() => {
                          setOpen(false);
                          router.push(`/app/session/${s.id}`);
                        }}
                        className="flex items-center gap-1 text-[11px] text-violet-700 hover:text-violet-900 font-medium"
                      >
                        <MessageSquare className="w-3 h-3" /> Message
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
