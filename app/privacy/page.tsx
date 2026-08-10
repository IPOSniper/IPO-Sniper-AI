export default function PrivacyPage() {
    return (
        <main className="mx-auto max-w-2xl px-6 py-16 text-white">
            <h1 className="text-2xl font-bold">Privacy Policy</h1>
            <p className="mt-6 rounded-lg border border-amber-900/50 bg-amber-950/30 p-4 text-sm text-amber-200">
                This policy is being finalized with legal counsel and is not yet complete.
                This page is an honest placeholder, not a binding policy — do not rely on it
                as your actual Privacy Policy, particularly for anything involving user data
                handling commitments.
            </p>
            <p className="mt-6 text-sm text-zinc-400">
                What is true today: account data (email, research history) is stored via Supabase
                with row-level security so only you can see your own data. No data is sold to
                third parties. This statement itself needs real legal review before being relied on.
            </p>
        </main>
    );
}
