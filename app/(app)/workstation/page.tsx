import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import ResearchTarget from "@/components/workstation/panels/ResearchTarget/ResearchTarget";
import NewsRail from "@/components/workstation/panels/NewsRail";
import MarketContext from "@/components/workstation/panels/MarketContext";
import UpcomingEarnings from "@/components/workstation/panels/UpcomingEarnings";
import WhileYouWereAwayHome from "@/components/workstation/panels/WhileYouWereAwayHome";
import MarketMoversPanel from "@/components/workstation/panels/MarketMoversPanel";
import IPOIntelligenceCenter from "@/components/workstation/panels/IPOIntelligenceCenter";
import ContinueResearchPanel from "@/components/workstation/panels/ContinueResearchPanel";
import LiveIntelligenceFeed from "@/components/workstation/panels/LiveIntelligenceFeed";

export default function WorkstationPage() {
    return (
        <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">
                IPO Sniper AI
            </h1>
            <p className="text-zinc-400 mb-4">
                Enter a ticker to run a full AI research report.
            </p>

            <WhileYouWereAwayHome />
            <ContinueResearchPanel />

            <Link
                href="/education"
                className="mb-4 flex items-center justify-between rounded-xl border border-violet-700/50 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-950 px-4 py-2 hover:border-violet-500 transition group"
            >
                <div className="flex items-center gap-3">
                    <GraduationCap size={16} className="text-violet-300" />
                    <p className="text-xs font-semibold text-white">
                        Market Pulse
                        <span className="ml-2 font-normal text-zinc-400">Dow · S&amp;P · Nasdaq · Gold · Bonds</span>
                    </p>
                </div>
                <ArrowRight size={14} className="text-violet-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </Link>

            <div className="mb-4">
                <IPOIntelligenceCenter />
            </div>

            <div className="mb-4">
                <LiveIntelligenceFeed />
            </div>

            <div className="mb-4">
                <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Market Intelligence</p>
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <MarketContext />
                    <MarketMoversPanel />
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,380px)_1fr] gap-4 items-start">
                <div className="space-y-4">
                    <ResearchTarget />
                    <UpcomingEarnings />
                </div>
                <NewsRail />
            </div>
        </div>
    );
}
