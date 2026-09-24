"use client";

import { useState } from "react";

const RESEARCH_HEADER_LOGO_BASE = "https://images.financialmodelingprep.com/symbol/";

/**
 * Isolated as its own tiny client component ON PURPOSE: WorkstationShell
 * is a Server Component (no "use client"), and useState requires one --
 * a real Next.js build failure (Turbopack), NOT caught by tsc --noEmit,
 * which only checks types and has no concept of the Server/Client
 * Component boundary. Extracting just this interactive fallback logic
 * here keeps the shell itself untouched as a server component.
 */
export default function CompanyLogo({ symbol, companyName }: { symbol: string; companyName: string }) {
    const [failed, setFailed] = useState(false);

    if (failed) return null;

    return (
        // eslint-disable-next-line @next/next/no-img-element
        <img
            src={`${RESEARCH_HEADER_LOGO_BASE}${symbol}.png`}
            alt=""
            className="h-4 w-4 shrink-0 rounded-sm bg-white/5 object-contain"
            onError={() => setFailed(true)}
        />
    );
}