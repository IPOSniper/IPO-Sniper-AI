import { NextResponse } from "next/server";
import { buildOpportunityUniverse } from "@/engine/quant/OpportunityEngine";

export async function GET() {
    const { rankedOpportunities, unattributedEvents } = await buildOpportunityUniverse();

    return NextResponse.json({
        rankedOpportunities: rankedOpportunities.slice(0, 20),
        unattributedEventCount: unattributedEvents.length,
        fetchedAt: new Date().toISOString(),
    });
}
