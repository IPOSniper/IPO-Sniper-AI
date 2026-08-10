import { AnthropicClient } from "../synthesis/providers/AnthropicClient";
import type { EarningsCalendarEntry } from "./providers/FinnhubEarningsCalendarProvider";

/**
 * Writes the CleanSpark/SolarEdge-style pre-earnings brief: ranked
 * "what investors will care about" topics, a bull case, a bear case,
 * and a rough probability read — the parts of that format that are
 * genuinely interpretive, not sourced.
 *
 * Same grounding rule as ExecutiveSummarySynthesizer: this is only
 * ever handed the REAL, verified calendar data (confirmed date,
 * session, consensus EPS/revenue estimates) plus static company
 * facts already in the report (sector, industry). It is explicitly
 * forbidden from stating any number not given to it, and everything
 * it returns is presented to the user as AI analysis, clearly
 * separated from the verified data above it — never blended together
 * as if both came from the same source.
 *
 * Fails honestly: if ANTHROPIC_API_KEY isn't configured or the call
 * fails or returns unparseable JSON, callers should show the
 * verified calendar data on its own with a "AI analysis unavailable"
 * note, not block the whole preview.
 */

export interface EarningsPreview {
    topicsToWatch: Array<{ topic: string; importance: 1 | 2 | 3 | 4 | 5 }>;
    bullCase: string[];
    bearCase: string[];
    probabilityAssessment: Array<{ outcome: string; probabilityPercent: number }>;
    weighting: Array<{ factor: string; weightPercent: number }>;
    narrative: string;
}

export class EarningsPreviewSynthesizer {

    private readonly client = new AnthropicClient();

    async synthesize(
        companyName: string,
        sector: string,
        industry: string,
        entry: EarningsCalendarEntry
    ): Promise<EarningsPreview> {

        const systemPrompt =
            "You write short pre-earnings briefs for an investment research product, in the style of a " +
            "sell-side earnings preview note. You will be given ONLY real, already-verified facts: a company's " +
            "sector/industry and its confirmed next earnings date with consensus EPS/revenue estimates (which " +
            "may be missing if not yet covered by analysts). " +
            "HARD RULES: " +
            "(1) Never state a specific dollar figure, EPS number, revenue number, or percentage that is not " +
            "explicitly given to you below — if estimates are missing, say so, don't invent placeholder numbers. " +
            "(2) Do not claim knowledge of recent news, contracts, guidance, or announcements you were not told " +
            "about — reason only from sector/industry context and general knowledge of what that kind of " +
            "company's earnings calls typically cover. " +
            "(3) Respond with ONLY a single JSON object, no markdown fences, no preamble, matching exactly this " +
            "shape: " +
            '{"topicsToWatch": [{"topic": string, "importance": 1-5}], "bullCase": string[], "bearCase": ' +
            'string[], "probabilityAssessment": [{"outcome": string, "probabilityPercent": number}], ' +
            '"weighting": [{"factor": string, "weightPercent": number}], "narrative": string}. ' +
            "(4) topicsToWatch: 4-6 items ranked by importance (5 = most important). " +
            "(5) bullCase and bearCase: 3-5 short bullet strings each. " +
            "(6) probabilityAssessment: 3-5 outcomes (e.g. revenue beat, EPS beat, guidance raise) with rough " +
            "percentages — clearly your own estimate, not a sourced statistic. " +
            "(7) weighting: 3-6 factors that should matter most in scoring this event, weightPercent summing " +
            "to roughly 100. " +
            "(8) narrative: 2-3 sentences on why this earnings event matters for the stock right now.";

        const userPrompt =
            `Company: ${companyName}\n` +
            `Sector: ${sector}\n` +
            `Industry: ${industry}\n` +
            `Confirmed report date: ${entry.reportDate}\n` +
            `Session: ${entry.session === "bmo" ? "Before market open" : entry.session === "amc" ? "After market close" : entry.session === "dmh" ? "During market hours" : "Not specified"}\n` +
            `Consensus EPS estimate: ${entry.epsEstimate ?? "Not covered / unavailable"}\n` +
            `Consensus revenue estimate: ${entry.revenueEstimate ?? "Not covered / unavailable"}\n` +
            `Fiscal period: ${entry.fiscalQuarter ? `Q${entry.fiscalQuarter} ${entry.fiscalYear}` : "Unknown"}\n\n` +
            `Write the preview now as JSON only.`;

        const raw = await this.client.complete(systemPrompt, userPrompt);

        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");

        let parsed: EarningsPreview;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error("Earnings preview synthesis returned unparseable output.");
        }

        return parsed;
    }

}
