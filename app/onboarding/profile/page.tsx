"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

export default function ProfileSetupPage() {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [city, setCity] = useState("");
  const [birthYear, setBirthYear] = useState("");
  const [availability, setAvailability] = useState("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user || !user.phone) {
      setError("Not signed in.");
      setLoading(false);
      return;
    }

    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const parsedYear = birthYear ? parseInt(birthYear, 10) : null;

    const { error: insertError } = await supabase.from("users").insert({
      id: user.id,
      display_name: displayName.trim(),
      phone: `+${user.phone}`,
      timezone,
      city: city.trim() || null,
      birth_year:
        parsedYear && parsedYear > 1900 && parsedYear < 2020
          ? parsedYear
          : null,
      availability: availability.trim() || null,
      bio: bio.trim() || null,
    });

    if (insertError) {
      setError(insertError.message);
      setLoading(false);
      return;
    }

    await fetch("/api/karma/welcome-grant", { method: "POST" });
    router.push("/onboarding/wheelhouse");
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: "32px 16px" }}>
      <div className="nebula-bg" style={{ opacity: 0.4 }} />
      <div className="starfield" style={{ opacity: 0.5 }} />
      <div style={{ width: "100%", maxWidth: 440, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 className="font-display" style={{ fontSize: 32, color: "var(--brass-bright)", fontStyle: "italic", margin: 0 }}>
            Set up your profile
          </h1>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 8 }}>
            This is how other Karma Exchange members will see you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card"
          style={{ padding: 28 }}
        >
          <div>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
              Display name *
            </label>
            <Input
              type="text"
              placeholder="e.g., Chris M."
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              disabled={loading}
              autoFocus
              maxLength={40}
            />
          </div>

          <div>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>City</label>
            <Input
              type="text"
              placeholder="e.g., Seattle, WA"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              disabled={loading}
              maxLength={100}
            />
          </div>

          <div>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>Birth year</label>
            <Input
              type="number"
              placeholder="e.g., 1990"
              value={birthYear}
              onChange={(e) => setBirthYear(e.target.value)}
              disabled={loading}
              min={1920}
              max={2010}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Used to show your age to potential matches. Optional.
            </p>
          </div>

          <div>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>
              General availability
            </label>
            <Input
              type="text"
              placeholder="e.g., weekday evenings, weekend mornings"
              value={availability}
              onChange={(e) => setAvailability(e.target.value)}
              disabled={loading}
              maxLength={200}
            />
          </div>

          <div>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.15em", color: "var(--text-dim)", display: "block", marginBottom: 6 }}>Short bio</label>
            <Textarea
              placeholder="A sentence or two about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--err)" }}>{error}</p>}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || displayName.trim().length < 2}
          >
            {loading ? "Creating profile…" : "Continue"}
          </Button>
        </form>
      </div>
    </main>
  );
}
