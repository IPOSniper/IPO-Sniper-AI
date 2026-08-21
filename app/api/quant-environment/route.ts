import { NextResponse } from "next/server";
import { getMarketEnvironment, classifyTickerEnvironment } from "@/engine/quant/EnvironmentEngine";
import { buildOpportunityUniverse } from "@/engine/quant/OpportunityEngine";

export async function GET() {
    const [environment, opportunityData] = await Promise.all([
        getMarketEnvironment(),
        buildOpportunityUniverse(),
    ]);

    const topTickers = opportunityData.rankedOpportunities.slice(0, 10).map(o => o.ticker);

    const tickerEnvironments = await Promise.all(
        topTickers.map(ticker => classifyTickerEnvironment(ticker))
    );

    return NextResponse.json({
        marketEnvironment: environment,
        topOpportunitiesWithEnvironment: opportunityData.rankedOpportunities.slice(0, 10).map((opp, i) => ({
            ticker: opp.ticker,
            score: opp.score,
            scoreBreakdown: opp.scoreBreakdown,
            tickerEnvironment: tickerEnvironments[i],
        })),
        fetchedAt: new Date().toISOString(),
    });
}
