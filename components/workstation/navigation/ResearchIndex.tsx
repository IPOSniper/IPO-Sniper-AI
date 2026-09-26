"use client";

import { useEffect, useState } from "react";
import type { ResearchObject } from "@/engine/models/ResearchObject";

type ResearchSectionGroup = {
    label: string;
    items: readonly {
        id: string;
        label: string;
    }[];
};

const SECTIONS: ResearchSectionGroup[] = [
    {
        label: "Company",
        items: [
            { id: "snapshot", label: "Research Snapshot" },
            { id: "overview", label: "Overview" },
            { id: "market", label: "Market" },
        ],
    },
    {
        label: "AI Research",
        items: [
            { id: "assessment", label: "AI Assessment" },
            { id: "committee", label: "Committee" },
            { id: "analysts", label: "Analysts" },
            { id: "consensus", label: "Consensus" },
        ],
    },
    {
        label: "Evidence",
        items: [
            { id: "evidence", label: "Evidence" },
            { id: "financials", label: "Financials" },
            { id: "valuation", label: "Valuation" },
        ],
    },
    {
        label: "Ownership",
        items: [
            { id: "institutions", label: "Institutions" },
            { id: "insiders", label: "Insiders" },
        ],
    },
    {
        label: "Market Intelligence",
        items: [
            { id: "earnings", label: "Earnings" },
            { id: "options", label: "Options" },
            { id: "news", label: "News" },
            { id: "risks", label: "Risks" },
            { id: "catalysts", label: "Catalysts" },
            { id: "events", label: "Events" },
        ],
    },
    {
        label: "Investment Case",
        items: [
            { id: "thesis", label: "Investment Thesis" },
            { id: "decision", label: "Decision" },
        ],
    },
    {
        label: "Workspace",
        items: [
            { id: "portfolio", label: "Portfolio" },
            { id: "operations", label: "Operations" },
            { id: "history", label: "History" },
            { id: "briefing", label: "Analyst Briefing Summary" },
        ],
    },
];

const ALL_SECTIONS = SECTIONS.flatMap((group) => group.items);

interface Props {
    research?: ResearchObject;
}

function summaryFor(id: string, research?: ResearchObject): string | null {
    if (!research) return null;
    const snap = research.researchSnapshot;

    switch (id) {
        case "committee":
            return snap ? `${snap.recommendation} - ${snap.agreement}% agree` : null;
        case "assessment":
            return snap ? `${snap.recommendation} - ${snap.conviction}/100 conviction` : null;
        case "consensus":
            return snap ? `${snap.votingAnalystCount}/${snap.analystCount} voting` : null;
        case "analysts":
            return snap ? `${snap.analystCount} analysts` : null;
        case "decision":
            return snap ? `${snap.conviction}/100 conviction` : null;
        default:
            return null;
    }
}

export default function ResearchIndex({ research }: Props) {
    const [activeSection, setActiveSection] = useState("overview");

    useEffect(() => {
        const elements = ALL_SECTIONS
            .map(({ id }) => document.getElementById(id))
            .filter((element): element is HTMLElement => element !== null);

        if (elements.length === 0) {
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                const visible = entries
                    .filter((entry) => entry.isIntersecting)
                    .sort(
                        (a, b) =>
                            b.intersectionRatio - a.intersectionRatio
                    );

                if (visible[0]?.target.id) {
                    setActiveSection(visible[0].target.id);
                }
            },
            {
                rootMargin: "-96px 0px -55% 0px",
                threshold: [0, 0.25, 0.5, 0.75, 1],
            }
        );

        elements.forEach((element) => observer.observe(element));

        return () => observer.disconnect();
    }, []);

    const HIGHLIGHT_CLASSES = [
        "ring-2",
        "ring-violet-400",
        "ring-offset-4",
        "ring-offset-[#03070c]",
        "!bg-violet-950/30",
        "transition-all",
        "duration-500",
    ];

    const navigateTo = (id: string) => {
        const el = document.getElementById(id);
        if (!el) return;

        el.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });

        // Real highlight-on-arrival: flash the exact target section,
        // not just scroll near it -- clears any previous flash first
        // so rapid clicks between sections don't stack.
        document.querySelectorAll("[data-research-index-flash]").forEach((prev) => {
            prev.classList.remove(...HIGHLIGHT_CLASSES);
            prev.removeAttribute("data-research-index-flash");
        });

        el.setAttribute("data-research-index-flash", "true");
        el.classList.add(...HIGHLIGHT_CLASSES);

        window.setTimeout(() => {
            el.classList.remove(...HIGHLIGHT_CLASSES);
            el.removeAttribute("data-research-index-flash");
        }, 1600);
    };

    const scrollToTop = () => {
        window.scrollTo({ top: 0, behavior: "smooth" });
    };

    return (
        <nav
            aria-label="Research Index"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
        >
            <div className="mb-3 flex items-center justify-between px-1">
                <span className="text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                    Research Index
                </span>
                {research?.runtime?.generatedAt && (
                    <span className="flex items-center gap-1 text-[8px] text-zinc-600">
                        <span className="h-1 w-1 rounded-full bg-emerald-400" />
                        live
                    </span>
                )}
            </div>

            <div className="space-y-3">
                {SECTIONS.map((group) => (
                    <div key={group.label}>
                        <div className="mb-1 px-1 text-[9px] font-semibold uppercase tracking-[0.14em] text-zinc-600">
                            {group.label}
                        </div>

                        <div className="space-y-0.5">
                            {group.items.map((section) => {
                                const active =
                                    activeSection === section.id;
                                const summary = summaryFor(section.id, research);

                                return (
                                    <button
                                        key={section.id}
                                        type="button"
                                        onClick={() =>
                                            navigateTo(section.id)
                                        }
                                        aria-current={
                                            active
                                                ? "location"
                                                : undefined
                                        }
                                        className={`flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                                            active
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                                        }`}
                                    >
                                        <span
                                            className={`mt-0.5 h-1.5 w-1.5 shrink-0 rounded-full ${
                                                active
                                                    ? "bg-violet-400"
                                                    : "bg-zinc-700"
                                            }`}
                                        />
                                        <span className="flex flex-col">
                                            <span>{section.label}</span>
                                            {summary && (
                                                <span className="text-[9px] font-normal text-zinc-600">
                                                    {summary}
                                                </span>
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>

            <button
                type="button"
                onClick={scrollToTop}
                className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-md border border-zinc-800 py-1.5 text-[9px] font-semibold uppercase tracking-[0.1em] text-zinc-500 transition hover:bg-zinc-800/60 hover:text-zinc-300"
            >
                Back to Top
            </button>
        </nav>
    );
}