import { NextResponse } from "next/server";

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

export async function GET() {
    try {
        const base = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "http://localhost:3000";
        const response = await fetch(`${base}/api/market-news`, { cache: "no-store" });
        if (!response.ok) return NextResponse.json({ items: [] });

        const data = await response.json();
        const items: Array<{ category: string; headline: string; url: string; publishedAt: string }> = data.items ?? [];

        const filed: FiledItem[] = items
            .filter(item => item.category === "sec" && /^S-1(\/A)?\s*-/.test(item.headline))
            .map(item => {
                const parsed = parseSecHeadline(item.headline);
                return {
                    company: parsed?.company ?? item.headline,
                    formType: parsed?.formType ?? "S-1",
                    filedAt: item.publishedAt,
                    secUrl: item.url,
                };
            });

        return NextResponse.json({ items: filed });
    } catch {
        return NextResponse.json({ items: [] });
    }
}
