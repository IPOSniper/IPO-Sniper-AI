import type { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import ResearchDashboard from "../session/ResearchDashboard";
import LiveIntelligenceFeed from "../panels/LiveIntelligenceFeed";

const NAV = [
    ["overview", "Overview"],
    ["committee", "AI Committee"],
    ["evidence", "Evidence"],
    ["thesis", "Thesis"],
    ["decision", "Decision Center"],
    ["portfolio", "Portfolio"],
    ["financials", "Financials"],
    ["valuation", "Valuation"],
    ["institutions", "Institutions"],
    ["insiders", "Insiders"],
    ["earnings", "Earnings"],
    ["options", "Options"],
    ["news", "News"],
    ["risk", "Risks"],
    ["catalysts", "Catalysts"],
    ["events", "Events"],
    ["operations", "Operations"],
    ["history", "History"],
    ["publish", "Publish"],
] as const;

export default function ResearchViewport({
    research,
}: WorkstationPanelProps) {
    return (
        <div className="grid grid-cols-1 gap-6 xl:grid-cols-[190px_minmax(0,1fr)_310px]">
            <aside className="hidden xl:block">
                <div className="sticky top-24 rounded-xl border border-zinc-800 bg-zinc-950 p-3">
                    <p className="mb-3 px-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                        Research Index
                    </p>
                    <nav className="space-y-1">
                        {NAV.map(([id, label]) => (
                            <a
                                key={id}
                                href={`#${id}`}
                                className="block rounded-md px-2.5 py-1.5 text-xs text-zinc-500 transition hover:bg-zinc-900 hover:text-white"
                            >
                                {label}
                            </a>
                        ))}
                    </nav>
                </div>
            </aside>

            <main className="min-w-0">
                <ResearchDashboard research={research} />
            </main>

            <aside className="hidden xl:block">
                <div className="sticky top-24 space-y-4">
                    <LiveIntelligenceFeed />

                    <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-4">
                        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                            Research Integrity
                        </p>
                        <p className="mt-2 text-xs leading-5 text-zinc-500">
                            Verified, unverified, unavailable, and provider-limited
                            states remain visible. Missing data is not treated as a
                            bearish signal.
                        </p>
                    </div>
                </div>
            </aside>
        </div>
    );
}
