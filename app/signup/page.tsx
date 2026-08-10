"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

function NotConfigured() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm text-center">
        <h1 className="mb-2 text-2xl font-bold text-white">
          Sign-up isn&apos;t set up yet
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

function SignupForm() {
  const router = useRouter();

  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [confirmationSent, setConfirmationSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);

    // The 'retail' default role is enforced server-side by the
    // handle_new_user() trigger (see supabase/migrations/), not by
    // this metadata — a client can't grant itself a role this way.
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { display_name: displayName },
      },
    });

    setLoading(false);

    if (error) {
      setError(error.message);
      return;
    }

    // If email confirmation is enabled on the Supabase project,
    // there's no session yet — show a "check your email" state
    // instead of redirecting into a page that will bounce off
    // middleware for having no session.
    if (data.session) {
      router.push("/workstation");
      router.refresh();
    } else {
      setConfirmationSent(true);
    }
  }

  if (confirmationSent) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
        <div className="w-full max-w-sm text-center">
          <h1 className="mb-2 text-2xl font-bold text-white">
            Check your email
          </h1>
          <p className="text-sm text-zinc-400">
            We sent a confirmation link to {email}. Click it to finish setting up your account.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
      <div className="w-full max-w-sm">
        <h1 className="mb-1 text-2xl font-bold text-white">
          Create your account
        </h1>
        <p className="mb-8 text-sm text-zinc-400">
          Start researching with IPO Sniper AI.
        </p>

        <form onSubmit={handleSignup} className="space-y-3">
          <input
            type="text"
            required
            placeholder="Name"
            value={displayName}
            onChange={e => setDisplayName(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />
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
            minLength={8}
            placeholder="Password (min. 8 characters)"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
          />

          {error && (
            <p className="text-sm text-red-400">{error}</p>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="w-full justify-center"
          >
            {loading ? "Creating account..." : "Create account"}
          </Button>
        </form>

        <p className="mt-6 text-center text-sm text-zinc-500">
          Already have an account?{" "}
          <Link href="/login" className="text-white hover:underline">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
}

export default function SignupPage() {
  if (!isSupabaseConfigured()) {
    return <NotConfigured />;
  }

  return <SignupForm />;
}
