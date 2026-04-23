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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4 py-8">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-violet-700 mb-2">
            Set up your profile
          </h1>
          <p className="text-sm text-muted-foreground">
            This is how other Karma Exchange members will see you.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="space-y-4 bg-white p-6 rounded-xl shadow-sm border"
        >
          <div>
            <label className="text-sm font-medium mb-1 block">
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
            <label className="text-sm font-medium mb-1 block">City</label>
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
            <label className="text-sm font-medium mb-1 block">Birth year</label>
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
            <label className="text-sm font-medium mb-1 block">
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
            <label className="text-sm font-medium mb-1 block">Short bio</label>
            <Textarea
              placeholder="A sentence or two about yourself..."
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              disabled={loading}
              rows={3}
              maxLength={500}
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

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
