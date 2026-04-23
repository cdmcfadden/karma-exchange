"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { KarmaLogo } from "@/components/karma-primitives";
import { IconConstellation } from "@/components/karma-icons";

export default function LandingPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

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
    <main
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative",
        overflow: "hidden",
        padding: "16px",
      }}
    >
      <div className="nebula-bg" style={{ opacity: 0.5 }} />
      <div className="starfield" style={{ opacity: 0.6 }} />

      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 20 }}>
            <KarmaLogo size={36} />
          </div>
          <div style={{ display: "flex", justifyContent: "center", marginBottom: 12 }}>
            <IconConstellation size={20} stroke="var(--brass)" />
          </div>
          <p
            className="font-display"
            style={{ fontSize: 20, fontStyle: "italic", color: "var(--sand)", margin: 0 }}
          >
            Give what you know. Get what you need.
          </p>
          <p style={{ fontSize: 13, color: "var(--text-faint)", marginTop: 8 }}>
            Everyone&apos;s a teacher. Everyone&apos;s a student.
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="glass-card"
          style={{ padding: 28 }}
        >
          <div style={{ marginBottom: 16 }}>
            <label
              className="font-mono"
              style={{
                fontSize: 10,
                letterSpacing: "0.2em",
                color: "var(--brass)",
                display: "block",
                marginBottom: 10,
              }}
            >
              PHONE NUMBER
            </label>
            <Input
              type="tel"
              autoComplete="tel"
              placeholder="(555) 123-4567"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
              disabled={loading}
              style={{ textAlign: "center", fontSize: 18 }}
            />
            <p style={{ fontSize: 11, color: "var(--text-faint)", marginTop: 8, textAlign: "center" }}>
              We&apos;ll text you a 6-digit code. No password needed.
            </p>
          </div>

          {error && (
            <p style={{ fontSize: 13, color: "var(--err)", marginBottom: 12 }}>
              {error}
            </p>
          )}

          <Button
            type="submit"
            className="w-full"
            size="lg"
            disabled={loading || !phone}
          >
            {loading ? "Sending code…" : "Enter the exchange"}
          </Button>
        </form>

        <p style={{ fontSize: 10, color: "var(--text-faint)", textAlign: "center", marginTop: 24 }}>
          By continuing, you agree to our Terms and Privacy Policy.
        </p>
      </div>
    </main>
  );
}
