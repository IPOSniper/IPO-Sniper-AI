import React from "react";
import CompanyLogo from "./CompanyLogo";
import CondensingHeaderBar from "./CondensingHeaderBar";
import CommandBar from "../panels/CommandBar/CommandBar";
import ProcessStepper from "../panels/ProcessStepper/ProcessStepper";
import PriceChart from "../panels/PriceChart/PriceChart";
import IntelligenceSidebar from "../sidebar/IntelligenceSidebar";
import ResearchViewport from "../viewport/ResearchViewport";
import ResearchTarget from "../panels/ResearchTarget/ResearchTarget";
import ResearchIndex from "../navigation/ResearchIndex";
import { ResearchObject } from "@/engine/models/ResearchObject";

interface Props {
    research: ResearchObject;
    ticker?: string;
}

const workspaceSections = [
    ["overview", "Overview"],
    ["committee", "Committee"],
    ["evidence", "Evidence"],
    ["financials", "Financials"],
    ["valuation", "Valuation"],
    ["institutions", "Institutions"],
    ["news", "News"],
    ["risks", "Risks"],
    ["catalysts", "Catalysts"],
    ["earnings", "Earnings"],
    ["options", "Options"],
    ["operations", "Operations"],
];

export default function WorkstationShell({ research, ticker }: Props) {
    const quote = research.report.evidence.quote;
    const symbol = research.company.ticker;
    const companyName = research.company.name;

    return (
        <div className="min-h-screen bg-[#03070c] text-zinc-100">
            {/* WORKSTATION TOP BAR */}
            <header className="sticky top-0 z-40 border-b border-cyan-950/60 bg-[#03070c]/95 backdrop-blur-xl">
                <div className="flex min-h-14 items-center gap-4 px-4 lg:px-6">
                    <div className="flex min-w-[190px] items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-violet-500/50 bg-violet-600/20 text-sm font-bold text-violet-300">
                            IS
                        </div>

                        <div className="hidden sm:block">
                            <div className="text-[11px] font-bold tracking-[0.16em] text-zinc-100">
                                IPO SNIPER AI
                            </div>
                            <div className="text-[8px] uppercase tracking-[0.25em] text-cyan-500/70">
                                Workstation
                            </div>
                        </div>
                    </div>

                    <div className="min-w-0 flex-1">
                        <CommandBar research={research} />
                    </div>

                    <div className="hidden items-center gap-3 lg:flex">
                        <div className="flex items-center gap-2 rounded-md border border-emerald-900/60 bg-emerald-950/20 px-3 py-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
                            <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-emerald-400">
                                Live Research
                            </span>
                        </div>

                        <div className="text-[10px] text-zinc-600">
                            {symbol}
                        </div>
                    </div>
                </div>
            </header>

            <CondensingHeaderBar symbol={symbol} companyName={companyName} />

            {/* RESEARCH IDENTITY */}
            <section id="research-identity" className="border-b border-cyan-950/50 bg-[#050a11]">
                <div className="px-4 py-3 lg:px-6">
                    <ResearchTarget defaultTicker={ticker} />

                    <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4 lg:grid-cols-6">
                        <div className="rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Research Target
                            </div>
                            <div className="mt-1 truncate text-[11px] font-semibold text-zinc-200">
                                {symbol}
                            </div>
                        </div>

                        <div className="rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Price
                            </div>
                            {quote.price.verified ? (
                                <div className="mt-1 flex items-baseline gap-1.5 text-[11px] font-semibold">
                                    <span className="text-zinc-200">${quote.price.value.toFixed(2)}</span>
                                    {quote.changePercent.verified && (
                                        <span className={quote.changePercent.value >= 0 ? "text-emerald-400" : "text-red-400"}>
                                            {quote.changePercent.value >= 0 ? "+" : ""}{quote.changePercent.value.toFixed(2)}%
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <div className="mt-1 text-[11px] font-semibold text-zinc-600">-</div>
                            )}
                        </div>

                        <div className="rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Company
                            </div>
                            <div className="mt-1 flex items-center gap-1.5">
                                <CompanyLogo symbol={symbol} companyName={companyName} />
                                <div className="truncate text-[11px] font-semibold text-zinc-200">
                                    {companyName}
                                </div>
                            </div>
                        </div>

                        <div className="rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Research State
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-emerald-400">
                                ACTIVE
                            </div>
                        </div>

                        <div className="rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Intelligence
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-cyan-400">
                                LIVE
                            </div>
                        </div>

                        <div className="hidden rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2 sm:block">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Environment
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-zinc-300">
                                ANALYST
                            </div>
                        </div>

                        <div className="hidden rounded-md border border-zinc-800/80 bg-black/30 px-3 py-2 lg:block">
                            <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-600">
                                Workspace
                            </div>
                            <div className="mt-1 text-[11px] font-semibold text-violet-300">
                                RESEARCH
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* PROCESS STRIP */}
            <section className="border-b border-zinc-900 bg-[#03070c] px-4 py-2 lg:px-6">
                <ProcessStepper research={research} />
            </section>

            {/* SECTION COMMAND STRIP */}
            <nav className="sticky top-14 z-30 border-b border-zinc-900 bg-[#03070c]/95 px-4 py-2 backdrop-blur-xl lg:px-6">
                <div className="flex gap-1 overflow-x-auto pb-0.5">
                    {workspaceSections.map(([id, label]) => (
                        <a
                            key={id}
                            href={`#${id}`}
                            className="shrink-0 rounded-md border border-transparent px-3 py-1.5 text-[9px] font-semibold uppercase tracking-[0.08em] text-zinc-500 transition hover:border-zinc-800 hover:bg-zinc-900 hover:text-zinc-200"
                        >
                            {label}
                        </a>
                    ))}
                </div>
            </nav>

            {/* PRIMARY WORKSTATION */}
            <main className="px-3 py-3 lg:px-5 lg:py-4">
                <div
                    className="
                        grid
                        grid-cols-1
                        gap-3
                        lg:grid-cols-[190px_minmax(0,1fr)_250px]
                        xl:grid-cols-[210px_minmax(0,1fr)_280px]
                        2xl:grid-cols-[230px_minmax(0,1fr)_300px]
                    "
                >
                    {/* LEFT ANALYST NAVIGATION */}
                    <aside className="hidden lg:block">
                        {/* STICKY_FIX_V2 */}
                        <div className="sticky top-[102px]">
                        <div className="overflow-hidden rounded-lg border border-zinc-800/80 bg-[#070b11]">
                            <div className="border-b border-zinc-900 px-3 py-2.5">
                                <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-500/70">
                                    Research Index
                                </div>
                                <div className="mt-1 text-[10px] text-zinc-500">
                                    {symbol} workstation
                                </div>
                            </div>

                            <div className="p-2">
                                <ResearchIndex research={research} />
                            </div>

                            <div className="border-t border-zinc-900 px-3 py-3">
                                <div className="text-[8px] uppercase tracking-[0.15em] text-zinc-700">
                                    Workspace
                                </div>
                                <div className="mt-2 space-y-1 text-[9px] text-zinc-600">
                                    <div>Evidence-linked research</div>
                                    <div>Analyst committee</div>
                                    <div>Market intelligence</div>
                                </div>
                            </div>
                        </div>
                        </div>
                    </aside>

                    {/* CENTER RESEARCH WORKSPACE */}
                    <section className="min-w-0">
                        <div className="space-y-3">
                            {/* MARKET VISUALIZATION */}
                            <section className="overflow-hidden rounded-lg border border-cyan-950/60 bg-[#05090f]">
                                <div className="flex items-center justify-between border-b border-zinc-900 px-4 py-2.5">
                                    <div>
                                        <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-cyan-500/70">
                                            Market Intelligence
                                        </div>
                                        <h2 className="mt-0.5 text-xs font-semibold text-zinc-200">
                                            Price Action
                                        </h2>
                                    </div>

                                    <div className="rounded border border-zinc-800 bg-black/40 px-2 py-1 text-[8px] uppercase tracking-[0.12em] text-zinc-600">
                                        Live Data
                                    </div>
                                </div>

                                <PriceChart ticker={research.company.ticker} />
                            </section>

                            {/* RESEARCH CONTENT */}
                            <div className="rounded-lg border border-zinc-900/80 bg-[#05080d] p-2 sm:p-3 lg:p-4">
                                <ResearchViewport research={research} />
                            </div>
                        </div>
                    </section>

                    {/* RIGHT INTELLIGENCE RAIL */}
                    <aside className="min-w-0">
                        <div className="sticky top-[102px]">
                            <div className="mb-2 flex items-center justify-between px-1">
                                <div>
                                    <div className="text-[8px] font-bold uppercase tracking-[0.18em] text-violet-400/80">
                                        Intelligence Rail
                                    </div>
                                    <div className="text-[9px] text-zinc-600">
                                        Context surrounding {symbol}
                                    </div>
                                </div>

                                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 shadow-[0_0_7px_rgba(52,211,153,0.8)]" />
                            </div>

                            <IntelligenceSidebar research={research} />
                        </div>
                    </aside>
                </div>
            </main>

            {/* WORKSTATION FOOTER */}
            <footer className="border-t border-zinc-900 bg-[#03070c] px-4 py-3 lg:px-6">
                <div className="flex flex-col gap-1 text-[8px] uppercase tracking-[0.14em] text-zinc-700 sm:flex-row sm:items-center sm:justify-between">
                    <span>IPO Sniper AI · Research Workstation</span>
                    <span>Evidence-backed intelligence environment</span>
                </div>
            </footer>
        </div>
    );
}