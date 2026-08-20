import { NextRequest, NextResponse } from "next/server";

export interface SearchResult {
    symbol: string;
    description: string;
    type: string;
}

export async function GET(request: NextRequest) {
    const query = request.nextUrl.searchParams.get("q")?.trim();

    if (!query || query.length < 1) {
        return NextResponse.json({ results: [], available: true });
    }

    const apiKey = process.env.FINNHUB_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ results: [], available: false, reason: "FINNHUB_API_KEY not configured." });
    }

    try {
        const res = await fetch(`https://finnhub.io/api/v1/search?q=${encodeURIComponent(query)}&token=${apiKey}`);
        if (!res.ok) {
            return NextResponse.json({ results: [], available: false, reason: `Finnhub search failed: ${res.status}` });
        }

        const data = await res.json();
        const rawResults: Array<{ description?: string; displaySymbol?: string; symbol?: string; type?: string }> = data.result ?? [];

        const results: SearchResult[] = rawResults
            .filter(r => r.symbol && r.description && (!r.type || r.type === "Common Stock" || r.type === "ADR"))
            .slice(0, 8)
            .map(r => ({
                symbol: r.displaySymbol ?? r.symbol!,
                description: r.description!,
                type: r.type ?? "Equity",
            }));

        return NextResponse.json({ results, available: true });
    } catch (err) {
        return NextResponse.json({ results: [], available: false, reason: err instanceof Error ? err.message : "Unknown search error." });
    }
}
