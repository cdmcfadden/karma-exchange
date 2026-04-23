"use client";

import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

const STARTER_PROMPT = `Hi! I'm going to help you build your Karma Wheelhouse — an honest map of what you can genuinely teach others. We'll also note what you'd like to learn.

Let's start simple: what's something you're often asked for help with, or something you've become really good at over time?`;

export function WheelhouseChat({ userId }: { userId: string }) {
  const router = useRouter();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: STARTER_PROMPT },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const [skillCount, setSkillCount] = useState(0);
  const [completing, setCompleting] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function send() {
    if (!input.trim() || streaming) return;

    const userMessage: Message = { role: "user", content: input.trim() };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    setInput("");
    setStreaming(true);

    // Prepare assistant placeholder
    setMessages((prev) => [...prev, { role: "assistant", content: "" }]);

    try {
      const response = await fetch("/api/wheelhouse/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });

      if (!response.ok || !response.body) throw new Error("Request failed");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n\n");
        buffer = lines.pop() ?? "";

        for (const line of lines) {
          if (!line.startsWith("data: ")) continue;
          try {
            const event = JSON.parse(line.slice(6));
            if (event.type === "text") {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + event.value,
                };
                return copy;
              });
            } else if (event.type === "skill_added") {
              setSkillCount((c) => c + 1);
            } else if (event.type === "tool_called") {
              console.log("[wheelhouse] tool_called:", event.name);
            } else if (event.type === "error") {
              console.error("Stream error:", event);
              const detail =
                event.stage && event.tool
                  ? `Couldn't save ${event.tool} (${event.stage}): ${event.value}`
                  : `Stream error: ${event.value}`;
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ ${detail}`, isError: true },
              ]);
            }
          } catch {
            // ignore malformed events
          }
        }
      }
    } catch (err) {
      console.error(err);
      setMessages((prev) => {
        const copy = [...prev];
        copy[copy.length - 1] = {
          role: "assistant",
          content: "Sorry, something went wrong. Try again?",
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  async function completeWheelhouse() {
    setCompleting(true);
    const res = await fetch("/api/wheelhouse/complete", { method: "POST" });
    if (res.ok) {
      router.push("/app");
    } else {
      const { error } = await res.json();
      alert(error ?? "Could not complete wheelhouse");
      setCompleting(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto karma-scroll px-4 md:px-8 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn(
                "flex",
                m.role === "user" ? "justify-end" : "justify-start",
              )}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  m.isError
                    ? "bg-red-50 text-red-900 border border-red-200"
                    : m.role === "user"
                    ? "bg-violet-600 text-white"
                    : "bg-slate-100 text-slate-900",
                )}
              >
                {m.content || (streaming && i === messages.length - 1 ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : null)}
              </div>
            </div>
          ))}
          <div ref={bottomRef} />
        </div>
      </div>

      <div className="border-t bg-white px-4 md:px-8 py-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex gap-2">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  void send();
                }
              }}
              placeholder="Tell me more…"
              disabled={streaming}
              className="flex-1"
              rows={2}
            />
            <Button
              onClick={send}
              disabled={streaming || !input.trim()}
              size="icon"
              className="self-end h-11 w-11"
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>

          {skillCount >= 2 && (
            <div className="mt-3 flex items-center justify-between gap-4">
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                {skillCount} skill{skillCount === 1 ? "" : "s"} captured
              </p>
              <Button
                variant="outline"
                onClick={completeWheelhouse}
                disabled={completing}
              >
                {completing ? "Completing…" : "I'm ready — let's match!"}
              </Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
