"use server";

import { AlpacaBarsProvider, type PriceBar, type BarTimeframe } from "@/engine/evidence/providers/AlpacaBarsProvider";

/**
 * Real, thin wrapper exposing round106's AlpacaBarsProvider as a
 * callable Server Action for the new position price chart -- the
 * provider itself is a plain engine module (no "use server"), so a
 * real client component needs this real action to call it.
 */
export async function getPositionBars(ticker: string, timeframe: BarTimeframe = "1Day", limit = 90): Promise<PriceBar[]> {
    return new AlpacaBarsProvider().getBars(ticker, timeframe, limit);
}
