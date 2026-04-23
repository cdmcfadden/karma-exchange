"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Send, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  role: "user" | "assistant";
  content: string;
  isError?: boolean;
}

interface RequestChatProps {
  /** Called on every keystroke with the current composed request text. Drives sidebars. */
  onRequestTextChange: (text: string) => void;
}

const STARTER = `What do you need help with today?

Share as much or as little context as you want — I'll help turn it into a great match request.`;

export function RequestChat({ onRequestTextChange }: RequestChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: STARTER },
  ]);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // As user types OR sends, update the "current request text" that feeds the sidebars.
  useEffect(() => {
    const composed = [
      ...messages.filter((m) => m.role === "user").map((m) => m.content),
      input,
    ]
      .filter(Boolean)
      .join(" ")
      .trim();
    onRequestTextChange(composed);
  }, [input, messages, onRequestTextChange]);

  async function send() {
    if (!input.trim() || streaming) return;
    const userMsg: Message = { role: "user", content: input.trim() };
    const next = [...messages, userMsg];
    setMessages(next);
    setInput("");
    setStreaming(true);
    setMessages((p) => [...p, { role: "assistant", content: "" }]);

    try {
      const res = await fetch("/api/request/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (!res.ok || !res.body) throw new Error("Request failed");

      const reader = res.body.getReader();
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
            const evt = JSON.parse(line.slice(6));
            if (evt.type === "text") {
              setMessages((prev) => {
                const copy = [...prev];
                copy[copy.length - 1] = {
                  role: "assistant",
                  content: copy[copy.length - 1].content + evt.value,
                };
                return copy;
              });
            } else if (evt.type === "error") {
              console.error("Request chat error:", evt.value);
              setMessages((prev) => [
                ...prev,
                { role: "assistant", content: `⚠️ ${evt.value}`, isError: true },
              ]);
            } else if (evt.type === "request_finalized") {
              console.log("Request finalized:", evt.request_id);
            }
          } catch {
            // malformed SSE line — skip
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
          isError: true,
        };
        return copy;
      });
    } finally {
      setStreaming(false);
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto karma-scroll px-4 md:px-6 py-6">
        <div className="max-w-2xl mx-auto space-y-4">
          {messages.map((m, i) => (
            <div
              key={i}
              className={cn("flex", m.role === "user" ? "justify-end" : "justify-start")}
            >
              <div
                className={cn(
                  "max-w-[85%] rounded-2xl px-4 py-3 text-[15px] leading-relaxed",
                  m.isError
                    ? "border border-[var(--err)]"
                    : m.role === "user"
                    ? "brass-gradient text-[var(--void)]"
                    : "glass-card",
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

      <div className="px-4 md:px-6 py-4" style={{ borderTop: "1px solid rgba(232,212,168,0.08)", background: "rgba(5,3,8,0.5)" }}>
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
            placeholder="Describe what you need help with…"
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
      </div>
    </div>
  );
}
