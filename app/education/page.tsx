import MarketPulseSection from "@/components/education/MarketPulseSection";
import { GraduationCap } from "lucide-react";

/**
 * Moved from app/(app)/education/page.tsx to app/education/page.tsx
 * (same URL either way -- Next.js route groups like (app) don't
 * affect the URL path, only which layout wraps the page). This is
 * the real fix for a real UX issue: unauthenticated visitors were
 * seeing the full authenticated app shell (sidebar, ticker search,
 * login prompt) on a page meant to be genuinely public. Content
 * itself is unchanged -- only the layout/access shell changed, per
 * direct instruction.
 */
export default function EducationPage() {
    return (
        <div>
            <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
                    <GraduationCap size={18} />
                </div>
                <h1 className="text-2xl font-bold">Market Pulse</h1>
            </div>
            <p className="text-zinc-400 mb-6 max-w-3xl">
                What&apos;s moving markets today, why, and the general concepts investors use to think about it —
                real index/instrument data with an AI explainer layered on top.
            </p>

            <MarketPulseSection />
        </div>
    );
}
