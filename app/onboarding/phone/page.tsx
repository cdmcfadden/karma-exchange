"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PhoneVerifyPage() {
  return (
    <Suspense>
      <PhoneVerifyContent />
    </Suspense>
  );
}

function PhoneVerifyContent() {
  const router = useRouter();
  const params = useSearchParams();
  const phone = params.get("phone") ?? "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleVerify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const supabase = createClient();
    const { error: verifyError } = await supabase.auth.verifyOtp({
      phone,
      token: code,
      type: "sms",
    });

    if (verifyError) {
      setError(verifyError.message);
      setLoading(false);
      return;
    }

    // Check if user exists in our public.users table; if not, profile onboarding
    const { data: user } = await supabase.auth.getUser();
    if (!user.user) {
      setError("Verified but no user session — try again.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("users")
      .select("id, wheelhouse_completed_at")
      .eq("id", user.user.id)
      .maybeSingle();

    if (!profile) {
      router.push("/onboarding/profile");
    } else if (!profile.wheelhouse_completed_at) {
      router.push("/onboarding/wheelhouse");
    } else {
      router.push("/app");
    }
  }

  return (
    <main style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden", padding: 16 }}>
      <div className="nebula-bg" style={{ opacity: 0.4 }} />
      <div className="starfield" style={{ opacity: 0.5 }} />
      <div style={{ width: "100%", maxWidth: 420, position: "relative", zIndex: 1 }}>
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <h1 className="font-display" style={{ fontSize: 32, color: "var(--brass-bright)", fontStyle: "italic", margin: 0 }}>Check your texts</h1>
          <p style={{ fontSize: 13, color: "var(--text-dim)", marginTop: 8 }}>
            We sent a 6-digit code to <strong style={{ color: "var(--brass)" }}>{phone}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="glass-card" style={{ padding: 28 }}>
          <div style={{ marginBottom: 16 }}>
            <label className="font-mono" style={{ fontSize: 10, letterSpacing: "0.2em", color: "var(--brass)", display: "block", marginBottom: 10 }}>VERIFICATION CODE</label>
            <Input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              placeholder="123456"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              required
              disabled={loading}
              autoFocus
              style={{ textAlign: "center", fontSize: 28, letterSpacing: "0.3em" }}
            />
          </div>

          {error && <p style={{ fontSize: 13, color: "var(--err)", marginBottom: 12 }}>{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/")}
            style={{ width: "100%", marginTop: 12, fontSize: 12, color: "var(--text-faint)", background: "none", border: "none", cursor: "pointer", padding: 8 }}
          >
            Use a different number
          </button>
        </form>
      </div>
    </main>
  );
}
