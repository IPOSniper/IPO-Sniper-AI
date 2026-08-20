import Link from "next/link";
import WhileYouWereAwayHome from "@/components/workstation/panels/WhileYouWereAwayHome";
import MarketContext from "@/components/workstation/panels/MarketContext";

export default function DashboardPage() {
    return (
        <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">Dashboard</h1>
            <p className="text-zinc-400 mb-6">What changed, and what matters today.</p>

            <WhileYouWereAwayHome />
            <div className="mb-4">
                <MarketContext />
            </div>

            <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-6 text-center">
                <p className="text-sm text-zinc-500">
                    More Dashboard sections (IPO Radar, News, Market Movers, Watchlist, Earnings Radar) are real, planned future work.
                </p>
                <Link href="/workstation" className="mt-3 inline-block rounded-lg bg-violet-600 px-4 py-2 text-sm font-semibold text-white hover:bg-violet-500">
                    Go to Workstation to research a company
                </Link>
            </div>
        </div>
    );
}
