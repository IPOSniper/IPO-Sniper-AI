import { NextResponse } from "next/server";
import { FinnhubIPOProvider } from "@/engine/evidence/providers/FinnhubIPOProvider";
import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";

async function resolveSecFilingUrl(ticker: string): Promise<string | null> {
    try {
        const provider = new SECEdgarProvider();
        const cik = await provider.getCIK(ticker);
        if (!cik) return null;

        const filing = await provider.findLatestFiling(cik, ["424B4", "S-1"]);
        if (!filing) return null;

        return provider.buildFilingUrl(cik, filing);
    } catch {
        return null;
    }
}

export async function GET() {
    const provider = new FinnhubIPOProvider();
    const ipos = await provider.getUpcomingIPOs(8);

    const items = [];
    for (const ipo of ipos) {
        const secFilingUrl = await resolveSecFilingUrl(ipo.symbol);
        items.push({ ...ipo, secFilingUrl });
    }

    return NextResponse.json({ items });
}
