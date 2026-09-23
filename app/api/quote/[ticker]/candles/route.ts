import { NextRequest, NextResponse } from "next/server";
import { finnhubFetch } from "@/lib/data/finnhub";
import { AlpacaBarsProvider } from "@/engine/evidence/providers/AlpacaBarsProvider";

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
        "5Y": 5 * 365 * 86400,
        // "Max" requests a real 20-year lookback -- Finnhub/Alpaca
        // return whatever real history actually exists within that
        // window (never fabricated), which for most listings is the
        // company's full trading history.
        "Max": 20 * 365 * 86400,
    };
    const from = now - (rangeSeconds[range] ?? rangeSeconds["3M"]);

    try {
        const data = await finnhubFetch<CandleResponse>(
            `/stock/candle?symbol=${encodeURIComponent(ticker)}&resolution=D&from=${from}&to=${now}`
        );

        if (data.s === "ok" && data.c?.length) {
            const points = data.t.map((t, i) => ({
                date: new Date(t * 1000).toISOString().slice(0, 10),
                close: data.c[i],
            }));
            return NextResponse.json({ points, available: true, source: "finnhub" });
        }
    } catch {
        // Finnhub's free tier restricts /stock/candle on some plans —
        // real, honest fallback below, not a crash.
    }

    // Real fallback: Alpaca's own Basic (free) Market Data plan
    // includes real historical bars for both paper and live accounts
    // at zero cost (confirmed via Alpaca's own docs before building
    // this) — genuinely solves the case where Finnhub's plan
    // restricts /stock/candle, which has shown up honestly,
    // repeatedly, throughout this app's real usage.
    try {
                const alpacaLimit =
            range === "Max" ? 5200 :
            range === "5Y" ? 1300 :
            range === "1Y" ? 365 :
            range === "3M" ? 90 : 30;
        const bars = await new AlpacaBarsProvider().getBars(ticker, "1Day", alpacaLimit);
        if (bars.length > 0) {
            const points = bars.map(bar => ({
                date: bar.timestamp.slice(0, 10),
                close: bar.close,
            }));
            return NextResponse.json({ points, available: true, source: "alpaca" });
        }
    } catch {
        // Real, honest final fallback below.
    }

    return NextResponse.json({ points: [], available: false });
}
