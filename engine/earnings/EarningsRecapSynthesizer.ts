import { AnthropicClient } from "../synthesis/providers/AnthropicClient";
import type { EarningsAnalysis } from "./models/EarningsAnalysis";
import type { EarningsEvent } from "./models/EarningsEvent";

/**
 * Writes the "what actually happened" half of the before/after pair —
 * EarningsPreviewSynthesizer handles the before. Grounded on the real
 * reported EPS/revenue, the real prior-period actuals (now that
 * FinnhubEarningsProvider fetches them for real instead of reusing
 * the estimate — see the comments there), and the deterministic
 * beat/miss + qualityScore computed by EPSAnalyzer/RevenueAnalyzer.
 *
 * Same hard rule as the preview synthesizer: never state a number
 * that isn't handed to it below, and everything it writes is labeled
 * to the user as AI interpretation, not sourced fact.
 */

export interface EarningsRecap {
    narrative: string;
    takeaways: string[];
    watchNext: string[];
}

export class EarningsRecapSynthesizer {

    private readonly client = new AnthropicClient();

    async synthesize(
        companyName: string,
        event: EarningsEvent,
        analysis: EarningsAnalysis
    ): Promise<EarningsRecap> {

        const systemPrompt =
            "You write short post-earnings recaps for an investment research product. You will be given " +
            "ONLY real, already-computed facts: actual vs. estimated EPS and revenue, whether each beat or " +
            "missed, prior-period actuals when available, and quality scores already computed by a " +
            "deterministic analyzer. " +
            "HARD RULES: " +
            "(1) Never state a specific dollar figure, EPS number, revenue number, or percentage that is not " +
            "explicitly given to you below. " +
            "(2) Do not claim knowledge of the earnings call, guidance, management commentary, or stock price " +
            "reaction — you were not given any of that, so do not invent it. " +
            "(3) Respond with ONLY a single JSON object, no markdown fences, no preamble, matching exactly " +
            'this shape: {"narrative": string, "takeaways": string[], "watchNext": string[]}. ' +
            "(4) narrative: 2-3 sentences summarizing what the numbers show. " +
            "(5) takeaways: 2-4 short bullet strings on what this quarter's numbers imply. " +
            "(6) watchNext: 2-3 short bullet strings on what would confirm or undercut this read next quarter.";

        const userPrompt =
            `Company: ${companyName}\n` +
            `Fiscal period: ${event.fiscalQuarter} ${event.fiscalYear}\n` +
            `Actual EPS: ${event.actualEPS} (estimate ${event.estimatedEPS}, beat: ${analysis.eps.beat})\n` +
            `Actual revenue: ${event.actualRevenue} (estimate ${event.estimatedRevenue}, beat: ${analysis.revenue.beat})\n` +
            `EPS surprise: ${analysis.eps.surprisePercent.toFixed(1)}%\n` +
            `Revenue surprise: ${analysis.revenue.surprisePercent.toFixed(1)}%\n` +
            `${event.previousEPS !== null ? `Prior-period EPS: ${event.previousEPS} (growth ${analysis.eps.epsGrowth.toFixed(1)}%)\n` : "Prior-period EPS: not available\n"}` +
            `${event.previousRevenue !== null ? `Prior-period revenue: ${event.previousRevenue} (YoY growth ${analysis.revenue.revenueGrowthYoY.toFixed(1)}%, trend: ${analysis.revenue.trend})\n` : "Prior-period revenue: not available\n"}` +
            `EPS quality score: ${analysis.eps.qualityScore}/100\n` +
            `Revenue quality score: ${analysis.revenue.qualityScore}/100\n\n` +
            `Write the recap now as JSON only.`;

        const raw = await this.client.complete(systemPrompt, userPrompt);
        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");

        try {
            return JSON.parse(cleaned);
        } catch {
            throw new Error("Earnings recap synthesis returned unparseable output.");
        }
    }

}
