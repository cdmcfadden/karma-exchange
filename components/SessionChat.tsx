"use client";

import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: string;
  sender_id: string;
  content: string;
  created_at: string;
}

interface SessionChatProps {
  sessionId: string;
  currentUserId: string;
  partnerName: string;
}

export function SessionChat({
  sessionId,
  currentUserId,
  partnerName,
}: SessionChatProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loading, setLoading] = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    setLoading(true);

    // Fetch existing messages
    void (async () => {
      const res = await fetch(
        `/api/session/message?sessionId=${sessionId}`,
      );
      if (res.ok) {
        const data = await res.json();
        setMessages(data.messages ?? []);
      }
      setLoading(false);
    })();

    // Realtime subscription
    const supabase = createClient();
    const channel = supabase
      .channel(`session-chat:${sessionId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "session_messages",
          filter: `session_id=eq.${sessionId}`,
        },
        (payload) => {
          const incoming = payload.new as Message;
          setMessages((prev) =>
            prev.some((m) => m.id === incoming.id)
              ? prev
              : [...prev, incoming],
          );
        },
      )
      .subscribe();

    return () => {
      void supabase.removeChannel(channel);
    };
  }, [sessionId]);

  async function send() {
    if (!input.trim() || sending) return;
    const content = input.trim();
    setInput("");
    setSending(true);

    try {
      const res = await fetch("/api/session/message", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sessionId, content }),
      });
      if (!res.ok) {
        const data = await res.json();
        console.error("Send failed:", data.error);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto karma-scroll px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-3">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader2 className="w-5 h-5 animate-spin text-muted-foreground" />
            </div>
          )}
          {!loading && messages.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-8">
              Start your conversation with {partnerName}.
            </p>
          )}
          {messages.map((m) => {
            const isMine = m.sender_id === currentUserId;
            return (
              <div
                key={m.id}
                className={cn(
                  "flex",
                  isMine ? "justify-end" : "justify-start",
                )}
              >
                <div
                  className={cn(
                    "max-w-[80%] rounded-2xl px-4 py-2.5 text-[15px] leading-relaxed",
                    isMine
                      ? "brass-gradient text-[var(--void)]"
                      : "glass-card",
                  )}
                >
                  {m.content}
                  <p
                    className={cn(
                      "text-[10px] mt-1",
                      isMine ? "text-[var(--brass-shadow)]" : "text-[var(--text-faint)]",
                    )}
                  >
                    {new Date(m.created_at).toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </p>
                </div>
              </div>
            );
          })}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="px-4 md:px-6 py-3" style={{ borderTop: "1px solid rgba(232,212,168,0.08)", background: "rgba(5,3,8,0.5)" }}>
        <div className="max-w-2xl mx-auto flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void send();
              }
            }}
            placeholder={`Message ${partnerName}…`}
            disabled={sending}
            className="flex-1"
            rows={1}
          />
          <Button
            onClick={send}
            disabled={sending || !input.trim()}
            size="icon"
            className="self-end h-10 w-10"
          >
            <Send className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
