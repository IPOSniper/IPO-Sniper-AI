import { NextRequest, NextResponse } from "next/server";
import { buildEarningsCalendar } from "@/engine/intelligence/buildEarningsCalendar";

/**
 * Feeds the Workstation homepage's "Upcoming Earnings" widget -- a
 * market-wide, ticker-agnostic view (same spirit as market-news's
 * NewsRail feed) shown before the user has searched anything.
 */

export const revalidate = 3600;

export async function GET(request: NextRequest) {
    const days = Number(request.nextUrl.searchParams.get("days") ?? "7");
    const result = await buildEarningsCalendar(days);
    return NextResponse.json(result);
}