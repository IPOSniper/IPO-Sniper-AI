import { NextRequest, NextResponse } from "next/server";
import { finnhubFetch } from "@/lib/data/finnhub";

interface CandleResponse {
    c: number[]; // close
    t: number[]; // unix seconds
    s: string; // "ok" | "no_data"
}

export async function GET(
    request: NextRequest,
    { params }: { params: Promise<{ ticker: string }> }
) {
    const { ticker } = await params;
    const range = request.nextUrl.searchParams.get("range") ?? "3M";

    const now = Math.floor(Date.now() / 1000);
    const rangeSeconds: Record<string, number> = {
        "1M": 30 * 86400,
        "3M": 90 * 86400,
        "1Y": 365 * 86400,
    };
    const from = now - (rangeSeconds[range] ?? rangeSeconds["3M"]);

    try {
        const data = await finnhubFetch<CandleResponse>(
            `/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${now}`
        );

        if (data.s !== "ok" || !data.c?.length) {
            return NextResponse.json({ points: [], available: false });
        }

        const points = data.t.map((t, i) => ({
            date: new Date(t * 1000).toISOString().slice(0, 10),
            close: data.c[i],
        }));

        return NextResponse.json({ points, available: true });
    } catch (err) {
        // Finnhub's free tier restricts /stock/candle on some plans —
        // this may come back as a 403 rather than empty data. Either
        // way, the chart should show "unavailable," not crash the page.
        return NextResponse.json({
            points: [],
            available: false,
            error: err instanceof Error ? err.message : "Unknown error",
        });
    }
}
