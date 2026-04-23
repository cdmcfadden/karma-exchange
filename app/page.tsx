"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function LandingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // Normalize to E.164 — minimal: prepend +1 for 10-digit US numbers.
    let normalized = phone.trim().replace(/[^\d+]/g, "");
    if (!normalized.startsWith("+")) {
      normalized = normalized.length === 10 ? `+1${normalized}` : `+${normalized}`;
    }

    const supabase = createClient();
    const { error: otpError } = await supabase.auth.signInWithOtp({
      phone: normalized,
    });

    if (otpError) {
      setError(otpError.message);
      setLoading(false);
      return;
    }

    router.push(`/onboarding/phone?phone=${encodeURIComponent(normalized)}`);
  }

  return (
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-10 text-center">
          <h1 className="text-5xl font-bold tracking-tight text-violet-700 mb-3">Karma</h1>
          <p className="text-lg text-muted-foreground">
            Give what you know. Get what you need.
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            Everyone's a teacher. Everyone's a student.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <label className="text-sm font-medium mb-2 block">Phone number</label>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
            />
            <p className="text-xs text-muted-foreground mt-2">
              We'll text you a 6-digit code. No password needed.
            </p>
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading || !phone}>
            {loading ? "Sending code…" : "Get started"}
          </Button>
        </form>

        <p className="text-xs text-muted-foreground text-center mt-6">
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
