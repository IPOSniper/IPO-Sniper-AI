"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { Button } from "@/components/ui/button";

/**
 * Real Supabase MFA (TOTP) enrollment — auth.mfa.enroll/challenge/
 * verify are documented Supabase Auth APIs, not a bolted-on custom
 * scheme. This is "something you know" (password) + "something you
 * have" (authenticator app) = two factors. A genuine third factor
 * ("something you are" — biometric) isn't something a web app can
 * enforce on its own without a hardware/platform API (WebAuthn with
 * a biometric authenticator would be the honest way to add one
 * later); not fabricating that here.
 */
export default function SecuritySection() {

    const [factors, setFactors] = useState<{ id: string; status: string }[]>([]);
    const [loading, setLoading] = useState(true);
    const [enrolling, setEnrolling] = useState(false);
    const [qrCode, setQrCode] = useState<string | null>(null);
    const [secret, setSecret] = useState<string | null>(null);
    const [pendingFactorId, setPendingFactorId] = useState<string | null>(null);
    const [verifyCode, setVerifyCode] = useState("");
    const [error, setError] = useState<string | null>(null);

    async function refreshFactors() {
        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.listFactors();
        setLoading(false);
        if (error) {
            setError(error.message);
            return;
        }
        setFactors((data?.totp ?? []).map(f => ({ id: f.id, status: f.status })));
    }

    useEffect(() => {
        refreshFactors();
    }, []);

    async function startEnroll() {
        setError(null);
        setEnrolling(true);

        const supabase = createClient();
        const { data, error } = await supabase.auth.mfa.enroll({ factorType: "totp" });

        if (error) {
            setError(error.message);
            setEnrolling(false);
            return;
        }

        setPendingFactorId(data.id);
        setQrCode(data.totp.qr_code);
        setSecret(data.totp.secret);
    }

    async function confirmEnroll(e: React.FormEvent) {
        e.preventDefault();
        if (!pendingFactorId) return;

        setError(null);

        const supabase = createClient();

        const { data: challenge, error: challengeError } =
            await supabase.auth.mfa.challenge({ factorId: pendingFactorId });

        if (challengeError) {
            setError(challengeError.message);
            return;
        }

        const { error: verifyError } = await supabase.auth.mfa.verify({
            factorId: pendingFactorId,
            challengeId: challenge.id,
            code: verifyCode,
        });

        if (verifyError) {
            setError(verifyError.message);
            return;
        }

        setEnrolling(false);
        setPendingFactorId(null);
        setQrCode(null);
        setSecret(null);
        setVerifyCode("");
        refreshFactors();
    }

    async function unenroll(factorId: string) {
        setError(null);
        const supabase = createClient();
        const { error } = await supabase.auth.mfa.unenroll({ factorId });
        if (error) {
            setError(error.message);
            return;
        }
        refreshFactors();
    }

    const verifiedFactor = factors.find(f => f.status === "verified");

    return (
        <div className="mt-6 max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
            <h2 className="text-lg font-semibold text-white">Two-factor authentication</h2>
            <p className="mt-1 text-sm text-zinc-500">
                Require an authenticator app code in addition to your password.
            </p>

            {loading ? (
                <p className="mt-4 text-sm text-zinc-500">Loading...</p>
            ) : verifiedFactor ? (
                <div className="mt-4">
                    <p className="text-sm text-emerald-400">Enabled</p>
                    <Button
                        variant="outline"
                        className="mt-3"
                        onClick={() => unenroll(verifiedFactor.id)}
                    >
                        Turn off
                    </Button>
                </div>
            ) : !enrolling ? (
                <Button className="mt-4" onClick={startEnroll}>
                    Set up authenticator app
                </Button>
            ) : (
                <form onSubmit={confirmEnroll} className="mt-4 space-y-3">
                    {qrCode && (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={qrCode} alt="Scan with your authenticator app" className="rounded-lg bg-white p-2" />
                    )}
                    {secret && (
                        <p className="text-xs text-zinc-500">
                            Can&apos;t scan? Enter this code manually: <span className="text-zinc-300">{secret}</span>
                        </p>
                    )}
                    <input
                        type="text"
                        inputMode="numeric"
                        required
                        placeholder="6-digit code from your app"
                        value={verifyCode}
                        onChange={e => setVerifyCode(e.target.value)}
                        className="w-full rounded-lg border border-zinc-800 bg-zinc-950 px-3 py-2 text-sm text-white placeholder:text-zinc-600 focus:border-zinc-600 focus:outline-none"
                    />
                    <div className="flex gap-2">
                        <Button type="submit">Confirm</Button>
                        <Button
                            type="button"
                            variant="outline"
                            onClick={() => { setEnrolling(false); setPendingFactorId(null); setQrCode(null); setSecret(null); }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>
    );
}
