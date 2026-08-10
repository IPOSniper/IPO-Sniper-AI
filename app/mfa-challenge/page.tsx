"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Second step of sign-in for a user with a TOTP factor enrolled
 * (see the Security section of /settings for enrollment). Reached
 * either from app/login/page.tsx right after a correct password, or
 * from proxy.ts redirecting a direct/bookmarked URL that skipped
 * that redirect — see the comment there.
 */
function MfaChallengeForm() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const redirectTo = searchParams.get("redirectTo") || "/workstation";

    const [code, setCode] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [factorId, setFactorId] = useState<string | null>(null);

    useEffect(() => {
        const supabase = createClient();
        supabase.auth.mfa.listFactors().then(({ data, error }) => {
            if (error) {
                setError(error.message);
                return;
            }
            const totp = data?.totp?.find(f => f.status === "verified");
            if (totp) setFactorId(totp.id);
            else setError("No verified authenticator found for this account.");
        });
    }, []);

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!factorId) return;

        setError(null);
        setLoading(true);

        const supabase = createClient();

        const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId });

        if (challengeError) {
            setLoading(false);
            setError(challengeError.message);
            return;
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId,
            challengeId: challenge.id,
            code,
        });

        setLoading(false);

        if (verifyError) {
            setError(verifyError.message);
            return;
        }

        router.push(redirectTo);
        router.refresh();
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-3">
            <input
                type="text"
                inputMode="numeric"
                required
                autoFocus
                placeholder="6-digit code"
                value={code}
                onChange={e => setCode(e.target.value)}
                className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-center text-lg tracking-widest text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
            />

            {error && <p className="text-sm text-red-400">{error}</p>}

            <Button type="submit" disabled={loading || !factorId} className="w-full justify-center">
                {loading ? "Verifying..." : "Verify"}
            </Button>
        </form>
    );
}

export default function MfaChallengePage() {
    return (
        <div className="flex min-h-screen items-center justify-center bg-[#09090B] px-4">
            <div className="w-full max-w-sm">
                <h1 className="mb-1 text-2xl font-bold text-white">Enter your authenticator code</h1>
                <p className="mb-8 text-sm text-zinc-400">
                    Open your authenticator app and enter the current 6-digit code.
                </p>
                <Suspense fallback={null}>
                    <MfaChallengeForm />
                </Suspense>
            </div>
        </div>
    );
}
