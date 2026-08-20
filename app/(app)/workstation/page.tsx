import Link from "next/link";
import { GraduationCap, ArrowRight } from "lucide-react";
import ResearchTarget from "@/components/workstation/panels/ResearchTarget/ResearchTarget";
import NewsRail from "@/components/workstation/panels/NewsRail";
import MarketContext from "@/components/workstation/panels/MarketContext";
import UpcomingEarnings from "@/components/workstation/panels/UpcomingEarnings";
import WhileYouWereAwayHome from "@/components/workstation/panels/WhileYouWereAwayHome";
import MarketMoversPanel from "@/components/workstation/panels/MarketMoversPanel";
import IPORadarPanel from "@/components/workstation/panels/IPORadarPanel";
export default function WorkstationPage() {
    return (
        <div className="text-white">
            <h1 className="text-2xl font-bold mb-1">
                IPO Sniper AI
            </h1>
            <p className="text-zinc-400 mb-6">
                Enter a ticker to run a full AI research report.
            </p>
            <WhileYouWereAwayHome />
            <Link
                href="/education"
                className="mb-4 flex items-center justify-between rounded-xl border border-violet-700/50 bg-gradient-to-r from-violet-950/40 via-zinc-900 to-zinc-950 p-4 shadow-[0_0_24px_-8px_rgba(139,92,246,0.35)] hover:border-violet-500 hover:shadow-[0_0_28px_-6px_rgba(139,92,246,0.5)] transition group"
            >
                <div className="flex items-center gap-3">
                    <div className="rounded-lg bg-violet-500/20 p-2">
                        <GraduationCap size={20} className="text-violet-300" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white flex items-center gap-2">
                            Market Pulse
                            <span className="rounded-full bg-violet-500/20 px-2 py-0.5 text-[10px] font-medium uppercase tracking-wide text-violet-300">
                                Dow · S&amp;P · Nasdaq · Gold · Bonds
                            </span>
                        </p>
                        <p className="text-xs text-zinc-400">
                            What&apos;s moving markets today, why, and what to watch — updated with real data.
                        </p>
                    </div>
                </div>
                <ArrowRight size={18} className="text-violet-400 group-hover:text-white group-hover:translate-x-0.5 transition" />
            </Link>
            <div className="mb-4">
                <MarketContext />
            </div>
            <div className="mb-4">
                <MarketMoversPanel />
            </div>
            <div className="mb-4">
                <IPORadarPanel />
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
