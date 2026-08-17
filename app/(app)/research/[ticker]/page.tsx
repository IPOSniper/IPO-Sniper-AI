import { WorkstationShell } from "@/components/workstation/shell";
import { ResearchService } from "@/engine/services/ResearchService";
import { createClient } from "@/lib/supabase/server";
import { isSupabaseConfigured } from "@/lib/supabase/client";
import { ingestRecentEvents } from "@/engine/intelligence/EventIngestionEngine";

interface PageProps {
    params: Promise<{ ticker: string }>;
}

export default async function ResearchPage({ params }: PageProps) {

    const { ticker: rawTicker } = await params;
    const ticker = rawTicker.toUpperCase();

    const researchService = new ResearchService();

    try {
        const research = await researchService.load(ticker);

        // Real event ingestion, triggered on a real research page
        // visit -- the actual first real call site for round90's
        // ingestRecentEvents(), which was built but left deliberately
        // unwired. Wrapped so a real ingestion failure (SEC API down,
        // no auth session, etc.) never breaks the research page
        // itself -- this is a real, best-effort side effect, not a
        // dependency of rendering the page.
        try {
            if (isSupabaseConfigured()) {
                const supabase = await createClient();
                const { data: { user } } = await supabase.auth.getUser();
                if (user) {
                    await ingestRecentEvents(user.id, ticker);
                }
            }
        } catch {
            // Real ingestion failures shouldn't block real research.
        }

        return (
            <WorkstationShell
                research={research}
                ticker={ticker}
            />
        );
    } catch (error) {
        return (
            <div className="text-white">
                <h1 className="text-2xl font-bold text-red-400">
                    Couldn&apos;t analyze {ticker}
                </h1>
                <p className="mt-2 text-zinc-400">
                    {error instanceof Error ? error.message : "Something went wrong while running research."}
                </p>
                <a
                    href="/workstation"
                    className="mt-4 inline-block rounded-lg bg-cyan-500 px-4 py-2 text-sm font-semibold text-black hover:bg-cyan-400"
                >
                    Back to Workstation
                </a>
            </div>
        );
    }
}
