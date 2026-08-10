"use client";

import { useProfile } from "@/hooks/useProfile";
import SecuritySection from "@/components/settings/SecuritySection";

const ROLE_LABEL: Record<string, string> = {
    guest: "Guest",
    retail: "Retail",
    pro: "Pro",
    hedge_admin: "Hedge Fund Admin",
    admin: "Admin",
};

export default function SettingsPage() {
    const { profile, loading } = useProfile();

    return (
        <main className="p-8">
            <h1 className="text-2xl font-bold">Settings</h1>
            <p className="mt-1 text-sm text-zinc-500">Your account.</p>

            <div className="mt-6 max-w-md rounded-xl border border-zinc-800 bg-zinc-900 p-6">
                {loading ? (
                    <p className="text-sm text-zinc-500">Loading...</p>
                ) : !profile ? (
                    <p className="text-sm text-zinc-500">
                        Not signed in, or Supabase isn&apos;t configured.
                    </p>
                ) : (
                    <div className="space-y-4">
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Name</p>
                            <p className="text-white">{profile.displayName || "Not set"}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Email</p>
                            <p className="text-white">{profile.email}</p>
                        </div>
                        <div>
                            <p className="text-xs uppercase tracking-wide text-zinc-500">Role</p>
                            <p className="text-white">{ROLE_LABEL[profile.role] ?? profile.role}</p>
                        </div>
                        {profile.isDeveloper && (
                            <div>
                                <p className="text-xs uppercase tracking-wide text-zinc-500">Developer Mode</p>
                                <p className="text-emerald-400">Enabled</p>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {profile && <SecuritySection />}

            <p className="mt-6 text-xs text-zinc-600">
                Editing your name/email, notification preferences, and API key management aren&apos;t built yet.
            </p>
        </main>
    );
}
