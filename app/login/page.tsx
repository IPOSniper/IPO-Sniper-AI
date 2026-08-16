"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">
          Sign-in isn&apos;t set up yet
        </h1>
        <p className="text-sm text-zinc-500">
          NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY
          aren&apos;t configured in this environment. Add them to your
          .env file to enable authentication.
        </p>
      </div>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirectTo = searchParams.get("redirectTo") || "/workstation";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      setLoading(false);
      setError(error.message);
      return;
    }

    // Password alone gets the session to aal1. If this user has a
    // TOTP factor enrolled (see /settings Security section),
    // nextLevel comes back aal2 and they still need the code —
    // don't let a correct password alone finish sign-in for them.
    const { data: aal, error: aalError } =
      await supabase.auth.mfa.getAuthenticatorAssuranceLevel();

    setLoading(false);

    if (aalError) {
      setError(aalError.message);
      return;
    }

    if (aal.nextLevel === "aal2" && aal.nextLevel !== aal.currentLevel) {
      router.push(`/mfa-challenge?redirectTo=${encodeURIComponent(redirectTo)}`);
      return;
    }

    router.push(redirectTo);
    router.refresh();
  }

  async function handleOAuthLogin(provider: "google" | "github") {
    setError(null);

    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/auth/callback?redirectTo=${encodeURIComponent(redirectTo)}`,
      },
    });

    if (error) {
      setError(error.message);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-white">
          IPO Sniper AI
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          Sign in to your research workstation.
        </p>

        <form onSubmit={handlePasswordLogin} className="space-y-3">
          <input
            type="email"
            required
            placeholder="Email"
            value={email}
            onChange={e => setEmail(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
          <input
            type="password"
            required
            placeholder="Password"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <div className="text-right">
            <Link href="/forgot-password" className="text-xs text-zinc-500 hover:text-white hover:underline">
              Forgot password?
            </Link>
          </div>

          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? "Signing in..." : "Sign in"}
          </Button>
        </form>

        <div className="my-4 flex items-center gap-3 text-xs text-zinc-600">
          <div className="h-px flex-1 bg-zinc-800" />
          or
          <div className="h-px flex-1 bg-zinc-800" />
        </div>

        <div className="space-y-2">
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin("google")}
            className="w-full justify-center"
          >
            Continue with Google
          </Button>
          <Button
            variant="outline"
            onClick={() => handleOAuthLogin("github")}
            className="w-full justify-center"
          >
            Continue with GitHub
          </Button>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  if (!isSupabaseConfigured()) {
    return <NotConfigured />;
  }

  return (
    <Suspense fallback={null}>
      <LoginForm />
    </Suspense>
  );
}
