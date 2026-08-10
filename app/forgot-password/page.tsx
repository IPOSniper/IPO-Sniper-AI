"use client";

import { useState } from "react";
import Link from "next/link";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Standard Supabase password-recovery flow, not a custom one: this
 * app has no separate "username" — email doubles as the identifier
 * (see login/signup forms) — so there's no separate "forgot
 * username" flow to build. If someone forgot which email they used,
 * that's an account-recovery problem, not a self-service password
 * reset, and building a "look up my email" form would itself be a
 * way to enumerate registered accounts — deliberately not doing
 * that here.
 */
export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [sent, setSent] = useState(false);
    const [loading, setLoading] = useState(false);

    if (!isSupabaseConfigured()) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
                <div className="w-full max-w-sm text-center">
                    <h1 className="mb-2 text-2xl font-bold text-white">Sign-in isn&apos;t set up yet</h1>
                    <p className="text-sm text-zinc-500">
                        Authentication isn&apos;t configured in this environment.
                    </p>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);
        setLoading(true);

        const supabase = createClient();

        const { error } = await supabase.auth.resetPasswordForEmail(email, {
            redirectTo: `${window.location.origin}/reset-password`,
        });

        setLoading(false);

        // Deliberately show the same success state whether or not the
        // email exists — a different message for "no account" would
        // let this form be used to enumerate registered emails.
        if (error) {
            setError(error.message);
            return;
        }

        setSent(true);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
            <div className="w-full max-w-sm">
                <h1 className="mb-1 text-2xl font-bold text-white">Reset your password</h1>
                <p className="mb-8 text-sm text-zinc-400">
                    Enter the email on your account and we&apos;ll send a reset link.
                </p>

                {sent ? (
                    <p className="text-sm text-emerald-400">
                        If an account exists for that email, a reset link is on its way. Check your inbox.
                    </p>
                ) : (
                    <form onSubmit={handleSubmit} className="space-y-3">
                        <input
                            type="email"
                            required
                            placeholder="Email"
                            value={email}
                            onChange={e => setEmail(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <Button type="submit" disabled={loading} className="w-full justify-center">
                            {loading ? "Sending..." : "Send reset link"}
                        </Button>
                    </form>
                )}

                <p className="mt-6 text-center text-sm text-zinc-500">
                    <Link href="/login" className="text-white hover:underline">Back to sign in</Link>
                </p>
            </div>
        </div>
    );
}
