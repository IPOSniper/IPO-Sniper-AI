"use client";

import { useEffect, useState } from "react";

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
            { id: "overview", label: "Overview" },
            { id: "market", label: "Market" },
        ],
    },
    {
        label: "AI Research",
        items: [
            { id: "overview", label: "AI Assessment" },
            { id: "committee", label: "Committee" },
            { id: "analysts", label: "Analysts" },
            { id: "committee", label: "Consensus" },
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
        ],
    },
];

const ALL_SECTIONS = SECTIONS.flatMap((group) => group.items);

export default function ResearchIndex() {
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

    const navigateTo = (id: string) => {
        document.getElementById(id)?.scrollIntoView({
            behavior: "smooth",
            block: "start",
        });
    };

    return (
        <nav
            aria-label="Research Index"
            className="rounded-lg border border-zinc-800 bg-zinc-900 p-3"
        >
            <div className="mb-3 px-1 text-[10px] font-semibold uppercase tracking-[0.16em] text-zinc-500">
                Research Index
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
                                        className={`flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-left text-xs transition-colors ${
                                            active
                                                ? "bg-zinc-800 text-white"
                                                : "text-zinc-500 hover:bg-zinc-800/60 hover:text-zinc-300"
                                        }`}
                                    >
                                        <span
                                            className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                                                active
                                                    ? "bg-violet-400"
                                                    : "bg-zinc-700"
                                            }`}
                                        />
                                        {section.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ))}
            </div>
        </nav>
    );
}
