"use client";

import { useState } from "react";
import { RequestChat } from "@/components/RequestChat";
import { MatchSidebar } from "@/components/MatchSidebar";
import { HintsSidebar } from "@/components/HintsSidebar";
import { ProfileModal } from "@/components/ProfileModal";
import type { MatchCandidate } from "@/lib/matching";

export default function AppHome() {
  const [requestText, setRequestText] = useState("");
  const [selectedMatch, setSelectedMatch] = useState<MatchCandidate | null>(
    null,
  );

  return (
    <div className="h-full flex overflow-hidden">
      {/* Left: Suggested Pacers */}
      <aside className="hidden md:block w-72 lg:w-80 overflow-hidden" style={{ borderRight: "1px solid rgba(232,212,168,0.08)", background: "rgba(232,212,168,0.02)" }}>
        <MatchSidebar
          requestText={requestText}
          onSelectMatch={setSelectedMatch}
        />
      </aside>

      {/* Center: Claude chat */}
      <div className="flex-1 flex flex-col min-w-0">
        <RequestChat onRequestTextChange={setRequestText} />
      </div>

      {/* Right: hints */}
      <aside className="hidden lg:block w-72 overflow-hidden" style={{ borderLeft: "1px solid rgba(232,212,168,0.08)", background: "rgba(155,123,184,0.02)" }}>
        <HintsSidebar requestText={requestText} />
      </aside>

      {/* Profile modal */}
      <ProfileModal
        userId={selectedMatch?.user_id ?? null}
        matchContext={
          selectedMatch
            ? {
                why_match: selectedMatch.why_match,
                top_skill_name: selectedMatch.top_skill_name,
                top_skill_level: selectedMatch.top_skill_level,
              }
            : undefined
        }
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
