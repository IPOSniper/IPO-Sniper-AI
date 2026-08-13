import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";

/**
 * Genuinely public layout for /education -- deliberately NOT
 * AppShell (the authenticated sidebar/nav). Confirmed no Context
 * dependency in AppShell.tsx before detaching, not assumed. Route
 * itself already treated as public by proxy.ts's PUBLIC_PREFIXES
 * (unchanged by this move -- middleware matches on URL path, not
 * file location, so moving the page here doesn't require any
 * proxy.ts change).
 *
 * Header intentionally lean: only real, working destinations.
 * "Research" and "About" (from the original nav spec) were left out
 * -- neither has a real page yet (no general /research index exists;
 * public research snapshots only exist per-slug at /r/[slug], not as
 * a browsable list), and linking to something that doesn't exist
 * would be a real, honest UX bug, not a shortcut worth taking.
 *
 * Real header adjustment: an already-signed-in user can still reach
 * this page (the authenticated sidebar links here too), and showing
 * them a "Sign In" button would be genuinely confusing. Checks real
 * auth state server-side and shows "Back to App" instead when a
 * session exists, rather than blindly showing Sign In to everyone.
 */
export default async function EducationLayout({ children }: { children: React.ReactNode }) {
    let isSignedIn = false;
    if (isSupabaseConfigured()) {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();
        isSignedIn = !!user;
    }

    return (
        <div className="min-h-screen bg-black text-white">
            <header className="border-b border-zinc-800 px-6 py-4">
                <div className="mx-auto flex max-w-5xl items-center justify-between">
                    <Link href="/" className="text-sm font-semibold text-white hover:text-zinc-300">
                        IPO Sniper AI
                    </Link>
                    <nav className="flex items-center gap-6 text-sm">
                        <Link href="/education" className="text-violet-400">Education</Link>
                        {isSignedIn ? (
                            <Link href="/workstation" className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-zinc-500 hover:text-white">
                                Back to App
                            </Link>
                        ) : (
                            <Link href="/login" className="rounded-md border border-zinc-700 px-3 py-1.5 text-zinc-300 hover:border-zinc-500 hover:text-white">
                                Sign In
                            </Link>
                        )}
                    </nav>
                </div>
            </header>

            <main className="mx-auto max-w-5xl px-6 py-8">
                {children}
            </main>

            <footer className="mt-16 border-t border-zinc-800 px-6 py-8 text-center text-xs text-zinc-600">
                Educational content only — not financial advice. IPO Sniper AI is not a registered investment adviser.
            </footer>
        </div>
    );
}
