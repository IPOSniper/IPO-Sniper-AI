import { NextResponse } from "next/server";
import { FinnhubIPOProvider } from "@/engine/evidence/providers/FinnhubIPOProvider";
import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { CompanyBuilder } from "@/engine/evidence/builders/company/CompanyBuilder";

async function resolveExchange(ticker: string): Promise<string> {
    try {
        const company = await new CompanyBuilder().build(ticker);
        return company.exchange;
    } catch {
        return "Unknown";
    }
}

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
        const exchange = await resolveExchange(ipo.symbol);
        items.push({ ...ipo, secFilingUrl, exchange });
    }

    return NextResponse.json({ items });
}
