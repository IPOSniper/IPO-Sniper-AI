import Link from "next/link";

export const dynamic = "force-dynamic";
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
import SystemStatusBar from "@/components/workstation/panels/SystemStatusBar";
import WhatMattersNow from "@/components/workstation/panels/WhatMattersNow";
import QuantAwarenessStrip from "@/components/workstation/panels/QuantAwarenessStrip";
import ResearchSpotlightPlaceholder from "@/components/workstation/panels/ResearchSpotlightPlaceholder";

/**
 * Dashboard Information Architecture v1 -- reorganized per the Master
 * Product Roadmap's agreed hierarchy: Market Today -> Your Market
 * Pulse -> Your Market -> IPO Intelligence -> Quant awareness ->
 * Live Intelligence -> Supporting. Every panel below already existed
 * and was already wired -- this is a pure regrouping under clearer
 * section headers, no new data fetching, no panel internals touched.
 * Steps 5-9 (populate real gaps, deepen Analyst View/personalization,
 * connect deeper pages) remain separate, later work.
 */
export default function WorkstationPage() {
    return (
        <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">
                Dashboard
            </h1>
            <p className="text-zinc-400 mb-4">
                Enter a ticker to run a full AI research report.
            </p>
            <SystemStatusBar />

            <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Market Today</p>
            </div>
            <div className="mb-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                <MarketContext />
                <MarketMoversPanel />
            </div>
            <WhatMattersNow />

            <Link
                href="/education"
                className="mb-4 flex items-center justify-between rounded-xl border border-violet-700/50 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-950 px-4 py-2 hover:border-violet-500 transition group"
            >
                <div className="flex items-center gap-3">
                    <GraduationCap size={16} className="text-violet-300" />
                    <p className="text-xs font-semibold text-white">
                        Your Market Pulse
                        <span className="ml-2 font-normal text-zinc-400">Dow -- S&amp;P -- Nasdaq -- Gold -- Bonds</span>
                    </p>
                </div>
                <ArrowRight size={14} className="text-violet-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </Link>

            <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Your Market</p>
            </div>
            <div className="mb-4">
                <WhileYouWereAwayHome />
                <ContinueResearchPanel />
                <ResearchSpotlightPlaceholder />
            </div>

            <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">IPO Intelligence</p>
            </div>
            <div className="mb-4">
                <IPOIntelligenceCenter />
            </div>

            <QuantAwarenessStrip />

            <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Live Intelligence</p>
            </div>
            <div className="mb-4">
                <LiveIntelligenceFeed />
            </div>

            <div className="mb-2">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">Supporting Intelligence</p>
            </div>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <ResearchTarget />
                <UpcomingEarnings />
                <NewsRail />
            </div>
        </div>
    );
}
