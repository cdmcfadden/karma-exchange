"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

export default function PhoneVerifyPage() {
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
    <main className="min-h-screen flex items-center justify-center bg-gradient-to-br from-violet-50 via-white to-rose-50 px-4">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-violet-700 mb-2">Check your texts</h1>
          <p className="text-sm text-muted-foreground">
            We sent a 6-digit code to <strong>{phone}</strong>
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-4 bg-white p-6 rounded-xl shadow-sm border">
          <div>
            <label className="text-sm font-medium mb-2 block">Verification code</label>
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
              className="text-center text-2xl tracking-widest"
            />
          </div>

          {error && <p className="text-sm text-destructive">{error}</p>}

          <Button type="submit" className="w-full" size="lg" disabled={loading || code.length < 6}>
            {loading ? "Verifying…" : "Verify"}
          </Button>

          <button
            type="button"
            onClick={() => router.push("/")}
            className="w-full text-sm text-muted-foreground hover:text-foreground"
          >
            Use a different number
          </button>
        </form>
      </div>
    </main>
  );
}
