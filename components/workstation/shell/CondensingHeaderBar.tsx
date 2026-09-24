"use client";

import { useEffect, useState } from "react";
import CompanyLogo from "./CompanyLogo";

/**
 * Isolated as its own tiny client component, same reasoning as
 * CompanyLogo.tsx: WorkstationShell is a Server Component, and this
 * needs real browser state (an IntersectionObserver watching scroll
 * position), which only works in a Client Component.
 *
 * Watches the real "research-identity" section (the full header
 * block) via IntersectionObserver. When that section scrolls out of
 * view under the fixed top bar, shows a slim sticky bar with ONLY
 * the logo + company name -- nothing else, per explicit spec. When
 * scrolled back to the top, this bar disappears and the full
 * Research Identity block is visible again on its own.
 */
export default function CondensingHeaderBar({ symbol, companyName }: { symbol: string; companyName: string }) {
    const [collapsed, setCollapsed] = useState(false);

    useEffect(() => {
        const target = document.getElementById("research-identity");
        if (!target) return;

        const observer = new IntersectionObserver(
            ([entry]) => setCollapsed(!entry.isIntersecting),
            // rootMargin accounts for the real fixed top bar's height
            // (h-14 = 56px) -- the condensed bar should appear right
            // as the full header passes under it, not before.
            { rootMargin: "-56px 0px 0px 0px", threshold: 0 }
        );
        observer.observe(target);
        return () => observer.disconnect();
    }, []);

    if (!collapsed) return null;

    return (
        <div className="sticky top-14 z-30 flex items-center gap-2 border-b border-cyan-950/60 bg-[#03070c]/95 px-4 py-2 backdrop-blur-xl lg:px-6">
            <CompanyLogo symbol={symbol} companyName={companyName} />
            <span className="truncate text-[11px] font-semibold text-zinc-100">{companyName}</span>
        </div>
    );
}