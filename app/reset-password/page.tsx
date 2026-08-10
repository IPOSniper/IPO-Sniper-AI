"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Reached via the link Supabase emails from resetPasswordForEmail()
 * on /forgot-password. That link carries a recovery token in the
 * URL, which the Supabase client picks up and turns into a
 * short-lived session — supabase-js fires a PASSWORD_RECOVERY auth
 * event when that happens, which is what gates the form below so a
 * random visitor can't land here and set someone else's password.
 */
export default function ResetPasswordPage() {
    const router = useRouter();
    const [ready, setReady] = useState(false);
    const [password, setPassword] = useState("");
    const [confirm, setConfirm] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [done, setDone] = useState(false);

    useEffect(() => {
        if (!isSupabaseConfigured()) return;

        const supabase = createClient();

        const { data: listener } = supabase.auth.onAuthStateChange((event) => {
            if (event === "PASSWORD_RECOVERY") {
                setReady(true);
            }
        });

        // If the recovery session was already established before this
        // effect subscribed (e.g. fast redirect), check directly too.
        supabase.auth.getSession().then(({ data }) => {
            if (data.session) setReady(true);
        });

        return () => listener.subscription.unsubscribe();
    }, []);

    if (!isSupabaseConfigured()) {
        return (
            <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
                <div className="w-full max-w-sm text-center">
                    <h1 className="mb-2 text-2xl font-bold text-white">Sign-in isn&apos;t set up yet</h1>
                    <p className="text-sm text-zinc-500">Authentication isn&apos;t configured in this environment.</p>
                </div>
            </div>
        );
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        setError(null);

        if (password.length < 8) {
            setError("Password must be at least 8 characters.");
            return;
        }

        if (password !== confirm) {
            setError("Passwords don't match.");
            return;
        }

        setLoading(true);
        const supabase = createClient();
        const { error } = await supabase.auth.updateUser({ password });
        setLoading(false);

        if (error) {
            setError(error.message);
            return;
        }

        setDone(true);
        setTimeout(() => router.push("/login"), 2000);
    }

    return (
        <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
            <div className="w-full max-w-sm">
                <h1 className="mb-1 text-2xl font-bold text-white">Set a new password</h1>

                {!ready ? (
                    <p className="mt-4 text-sm text-zinc-500">
                        Open this page from the reset link in your email — this link isn&apos;t valid on its own.
                    </p>
                ) : done ? (
                    <p className="mt-4 text-sm text-emerald-400">Password updated. Redirecting to sign in...</p>
                ) : (
                    <form onSubmit={handleSubmit} className="mt-6 space-y-3">
                        <input
                            type="password"
                            required
                            placeholder="New password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />
                        <input
                            type="password"
                            required
                            placeholder="Confirm new password"
                            value={confirm}
                            onChange={e => setConfirm(e.target.value)}
                            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                        />

                        {error && <p className="text-sm text-red-400">{error}</p>}

                        <Button type="submit" disabled={loading} className="w-full justify-center">
                            {loading ? "Updating..." : "Update password"}
                        </Button>
                    </form>
                )}
            </div>
        </div>
    );
}
