import { NextResponse } from "next/server";
import { fetchSecFilings } from "@/lib/secFilingsFeed";

interface FiledItem {
    company: string;
    formType: string;
    filedAt: string;
    secUrl: string;
}

function parseSecHeadline(headline: string): { formType: string; company: string } | null {
    const match = headline.match(/^(S-1(?:\/A)?)\s*-\s*(.+?)\s*\(\d+\)/);
    if (!match) return null;
    return { formType: match[1], company: match[2].trim() };
}

export const revalidate = 120;

export async function GET() {
    const userAgent = process.env.SEC_EDGAR_USER_AGENT;
    if (!userAgent) {
        return NextResponse.json({ items: [], available: false, reason: "SEC_EDGAR_USER_AGENT not configured." });
    }

    const items = await fetchSecFilings(revalidate);

    const filed: FiledItem[] = items
        .filter(item => /^S-1(\/A)?\s*-/.test(item.headline))
        .map(item => {
            const parsed = parseSecHeadline(item.headline);
            return {
                company: parsed?.company ?? item.headline,
                formType: parsed?.formType ?? "S-1",
                filedAt: item.publishedAt,
                secUrl: item.url,
            };
        });

    return NextResponse.json({ items: filed, available: true });
}
