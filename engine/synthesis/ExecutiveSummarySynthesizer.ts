import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { AnthropicClient } from "./providers/AnthropicClient";

/**
 * Turns the committee's real, already-computed findings into
 * readable prose — a genuine upgrade over the stats-line format
 * ("Committee Recommendation: SELL / Overall Score: 30 / ...") that
 * ResearchReportBuilder falls back to. Deliberately does NOT let the
 * LLM decide the recommendation, score, or confidence — those stay
 * fully deterministic, computed by ChiefInvestmentOfficer exactly as
 * before. This only asks the model to write about numbers it's
 * already been given, never to compute or invent new ones.
 *
 * The grounding rule (see the system prompt below) is the whole
 * point: an LLM asked to play "investment analyst" will confidently
 * generate plausible-sounding claims from thin context unless
 * explicitly constrained. This synthesizer only ever hands it the
 * real, already-verified per-analyst theses and scores — it cannot
 * see raw evidence it wasn't given, and is explicitly told not to
 * state any number that isn't in what it received.
 *
 * Fails honestly: if ANTHROPIC_API_KEY isn't configured or the call
 * fails, callers should fall back to the deterministic summary
 * string (committee.summary) rather than block the whole report.
 */
export class ExecutiveSummarySynthesizer {

    private readonly client = new AnthropicClient();

    async synthesize(
        companyName: string,
        committee: CommitteeReport
    ): Promise<string> {

        const scoredReports = committee.reports.filter(r => r.confidence > 0);

        const factSheet = scoredReports
            .map(r => `- ${r.analyst}: ${r.recommendation.replace("_", " ")} (score ${r.score}/100, confidence ${r.confidence}%). Thesis: "${r.thesis}"`)
            .join("\n");

        const excludedCount = committee.reports.length - scoredReports.length;

        const systemPrompt =
            "You write short, plain-English executive summaries for an investment research report. " +
            "You will be given the ALREADY-COMPUTED committee recommendation, score, and a list of " +
            "individual analyst findings with their exact theses. Your job is ONLY to synthesize these " +
            "into 2-4 readable sentences. " +
            "HARD RULES: " +
            "(1) Never state a number, percentage, or statistic that is not explicitly given to you below. " +
            "(2) Never invent facts, events, or claims not present in the analyst theses given. " +
            "(3) Do not change or second-guess the recommendation, score, or confidence you're given — report them, don't revise them. " +
            "(4) If the analyst theses conflict, say so plainly rather than picking a side. " +
            "(5) Write in plain prose, no bullet points, no markdown, no preamble like 'Here is a summary'.";

        const userPrompt =
            `Company: ${companyName}\n` +
            `Committee recommendation: ${committee.recommendation.replace("_", " ")}\n` +
            `Overall score: ${committee.overallScore}/100\n` +
            `Confidence: ${committee.confidence}%\n` +
            `Analyst agreement: ${committee.agreement}%\n` +
            `${excludedCount > 0 ? `${excludedCount} analyst(s) had insufficient verified data and are excluded from these findings.\n` : ""}` +
            `\nAnalyst findings:\n${factSheet}\n\n` +
            `Write the executive summary now.`;

        return this.client.complete(systemPrompt, userPrompt);
    }

}
