import Link from "next/link";
import { getWhileYouWereAwayHome } from "@/app/(app)/workstation/while-you-were-away/actions";

export default async function WhileYouWereAwayHome() {
    const summary = await getWhileYouWereAwayHome();

    if (!summary.lastVisitedAt) return null;

    return (
        <div className="mb-4 rounded-xl border border-zinc-800 bg-zinc-950 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">👋 Welcome back</h2>
                <span className="text-[10px] text-zinc-600">Since {new Date(summary.lastVisitedAt).toLocaleString()}</span>
            </div>

            {summary.researchCount === 0 ? (
                <p className="text-xs text-zinc-500">No new research activity since your last visit.</p>
            ) : (
                <>
                    <p className="mb-2 text-xs text-zinc-400">
                        {summary.researchCount} real research {summary.researchCount === 1 ? "run" : "runs"} since you were last here.
                    </p>
                    <div className="space-y-1.5">
                        {summary.recentResearch.map(r => (
                            <Link
                                key={`${r.ticker}-${r.createdAt}`}
                                href={`/research/${r.ticker}`}
                                className="flex items-center justify-between rounded-md px-2 py-1.5 text-xs hover:bg-zinc-900"
                            >
                                <span className="font-medium text-white">{r.ticker}</span>
                                <span className="text-zinc-500">{r.companyName}</span>
                                <span className="text-zinc-400">{r.recommendation} · {r.conviction}/100</span>
                            </Link>
                        ))}
                    </div>
                </>
            )}
        </div>
    );
}
