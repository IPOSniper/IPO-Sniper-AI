import { AnthropicClient } from "../synthesis/providers/AnthropicClient";
import type { Quote } from "../evidence/providers/FinnhubQuoteProvider";

/**
 * Powers the "Market Pulse" education page: a running Q&A-style
 * explainer of what's moving markets and why, in the spirit of "what
 * happened, why, who it affects, what to watch."
 *
 * Same grounding rule as every other synthesizer in this codebase:
 * only fed real, already-fetched data (index/instrument quotes,
 * real recent headlines) — never allowed to invent a statistic that
 * wasn't handed to it.
 *
 * Distinct additional constraint versus the earnings synthesizers:
 * this one is explicitly educational, not advisory. It must never
 * tell the reader what to buy, sell, or how to allocate their own
 * money — "where should I put my money" gets answered with the
 * *considerations* investors in this situation weigh, not a
 * recommendation. This isn't just house style — Claude/Anthropic
 * policy is that a language model shouldn't give confident personal
 * financial advice, and the product itself isn't a licensed advisor.
 * The UI additionally shows a static "educational, not advice"
 * banner regardless of what this returns.
 */

export interface MarketPulse {
    headline: string; // one-line "what's happening" summary
    whatsHappening: string;
    whyItsHappening: string;
    sectorsAffected: string[];
    rippleEffects: string;
    rootCauses: string[];
    likelyWinners: string[];
    likelyLosers: string[];
    riskRewardNote: string;
    safeHavenNote: string; // addresses gold/precious-metals-style flows specifically, grounded on the GLD quote given
    macroPoliticalNote: string; // elections/geopolitics as a general risk category — no partisan framing
    riskMitigationConsiderations: string[]; // general risk-management concepts (diversification, time horizon, position sizing) — never a specific allocation
    evidenceForThisRead: string[]; // the specific quote/headline facts this read is actually grounded in — makes the reasoning checkable
    uncertainty: string; // what's NOT known from today's data alone — what this read could be missing
    whatWouldChangeThisView: string; // what new data/headline would flip or soften today's read — forces falsifiability instead of a flat assertion
    generatedAt: string;
}

export interface MarketPulseInput {
    quotes: Record<string, Quote>; // e.g. { SPY: {...}, QQQ: {...}, VIX: {...}, GLD: {...}, TLT: {...} }
    headlines: Array<{ headline: string; source: string }>;
}

export class MarketPulseSynthesizer {

    private readonly client = new AnthropicClient();

    async synthesize(input: MarketPulseInput): Promise<MarketPulse> {

        const systemPrompt =
            "You write a daily 'Market Pulse' educational explainer for a retail investing app. Audience: " +
            "people who want to understand what's moving markets and why, not people asking you to manage " +
            "their money. " +
            "HARD RULES: " +
            "(1) You are given ONLY real data: today's price/change for a handful of instruments (SPY/QQQ as " +
            "broad equity proxies, VIX as a volatility proxy, GLD as a gold/safe-haven proxy, TLT as a bond " +
            "proxy) and a list of real recent headlines. Never state a specific number not given to you. " +
            "(2) Never recommend a specific trade, ticker to buy/sell, or portfolio allocation percentage. " +
            "'riskMitigationConsiderations' and any 'where to put money' framing must stay at the level of " +
            "general concepts (diversification, time horizon, position sizing, risk tolerance) — never a " +
            "specific recommendation for what the reader personally should do right now. " +
            "(3) On elections/geopolitics/war: describe them as a general category of macro risk investors " +
            "price in (policy uncertainty, trade/sanctions risk, safe-haven demand) — do not take a political " +
            "side or make predictions about a specific election outcome. " +
            "(4) Base your read on the actual sign and magnitude of the given quotes/headlines — don't default " +
            "to a generic bullish or bearish take independent of what's in the data. " +
            "(5) Justify your reasoning like an analyst, not a forecaster: name the specific evidence your read " +
            "rests on, say plainly what today's data does NOT tell you, and say what new data or headline would " +
            "change or soften today's read. This matters more than sounding confident — a reader who can see " +
            "what would change your mind can actually evaluate the read instead of just trusting it. " +
            "(6) Respond with ONLY a single JSON object, no markdown fences, no preamble, matching this shape: " +
            '{"headline": string, "whatsHappening": string, "whyItsHappening": string, "sectorsAffected": ' +
            'string[], "rippleEffects": string, "rootCauses": string[], "likelyWinners": string[], ' +
            '"likelyLosers": string[], "riskRewardNote": string, "safeHavenNote": string, ' +
            '"macroPoliticalNote": string, "riskMitigationConsiderations": string[], ' +
            '"evidenceForThisRead": string[], "uncertainty": string, "whatWouldChangeThisView": string}. ' +
            '"evidenceForThisRead" should cite the actual instrument moves/headlines you used (e.g. "GLD +1.8% ' +
            'while SPY -0.6%"), not a restatement of your conclusion. ' +
            "(7) Keep each free-text field to 2-4 sentences; each array 3-5 short items.";

        const quoteLines = Object.entries(input.quotes)
            .map(([symbol, q]) => `${symbol}: ${q.price.toFixed(2)} (${q.changePercent >= 0 ? "+" : ""}${q.changePercent.toFixed(2)}%)`)
            .join("\n");

        const headlineLines = input.headlines
            .slice(0, 10)
            .map(h => `- ${h.headline} (${h.source})`)
            .join("\n");

        const userPrompt =
            `Today's instrument quotes:\n${quoteLines}\n\n` +
            `Recent headlines:\n${headlineLines || "(none available)"}\n\n` +
            `Write the Market Pulse now as JSON only.`;

        const raw = await this.client.complete(systemPrompt, userPrompt);
        const cleaned = raw.trim().replace(/^```json\s*/i, "").replace(/^```\s*/i, "").replace(/```$/, "");

        let parsed: Omit<MarketPulse, "generatedAt">;
        try {
            parsed = JSON.parse(cleaned);
        } catch {
            throw new Error("Market Pulse synthesis returned unparseable output.");
        }

        return { ...parsed, generatedAt: new Date().toISOString() };
    }

}
