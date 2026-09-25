import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";
import { SECEdgarProvider } from "@/engine/evidence/providers/SECEdgarProvider";
import { AnthropicClient } from "@/engine/synthesis/providers/AnthropicClient";

/**
 * Path B "Moat" analysis -- a real, constrained-AI reading of the
 * company's own actual "Item 1. Business" filing text (10-K, or
 * S-1/424B4 for recent IPOs), asking only for a factual summary of
 * what the company states about itself -- never an independent
 * judgment invented by the model. A genuinely different kind of
 * analyst from the other 15: those extract numbers from financial
 * statements; this one summarizes real, disclosed text.
 *
 * Honest, real limitation, stated plainly in the UI: this reflects
 * what the COMPANY SAYS about itself in a public filing, not
 * independent verification of a real competitive advantage.
 *
 * Fails closed exactly like every other real gap tonight: missing
 * filing, failed extraction, or a failed Anthropic call (including
 * the currently-known exhausted-credits case) all show the same
 * honest "AI analysis unavailable" pattern already used elsewhere,
 * never invented text.
 */
const BUSINESS_START = /Item\s+1\.?\s+Business/i;
const BUSINESS_END = /Item\s+1A\.?\s+Risk\s+Factors/i;
const MAX_CHARS = 6000;

function extractBusinessSection(text: string): string | null {
    const startMatch = BUSINESS_START.exec(text);
    if (!startMatch) return null;
    const endMatch = BUSINESS_END.exec(text);
    const start = startMatch.index;
    const end = endMatch && endMatch.index > start ? endMatch.index : Math.min(text.length, start + MAX_CHARS);
    const section = text.slice(start, end).trim();
    return section.length > 200 ? section.slice(0, MAX_CHARS) : null;
}

export default async function MoatAnalysisCard({ research }: WorkstationPanelProps) {
    const ticker = research.company.ticker;

    try {
        const edgar = new SECEdgarProvider();
        const cik = await edgar.getCIK(ticker);
        if (!cik) {
            return (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Competitive Position (Moat)</p>
                    <p className="mt-1 text-sm text-zinc-600">No SEC filer record found for this ticker.</p>
                </div>
            );
        }

        const filing = await edgar.findLatestFiling(cik, ["10-K", "S-1", "424B4"]);
        if (!filing) {
            return (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Competitive Position (Moat)</p>
                    <p className="mt-1 text-sm text-zinc-600">No 10-K, S-1, or 424B4 filing found for this ticker.</p>
                </div>
            );
        }

        const text = await edgar.getFilingText(cik, filing);
        const businessSection = extractBusinessSection(text);
        if (!businessSection) {
            return (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                    <p className="text-xs uppercase tracking-wide text-zinc-500">Competitive Position (Moat)</p>
                    <p className="mt-1 text-sm text-zinc-600">
                        Could not locate a real &quot;Item 1. Business&quot; section in the {filing.formType} filing -- it may use non-standard formatting.
                    </p>
                </div>
            );
        }

        const systemPrompt = "You summarize a company's own SEC filing business description. Describe ONLY what the text explicitly states -- the business model and any competitive advantages, differentiators, or market position the company claims for itself. Do not add outside knowledge, opinions, or judgments not present in the text. Do not speculate about whether these claims are true. 2-3 sentences.";
        const client = new AnthropicClient();
        const summary = await client.complete(systemPrompt, businessSection);

        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Competitive Position (Moat)</p>
                <p className="mt-2 text-sm text-zinc-300">{summary}</p>
                <p className="mt-3 border-t border-zinc-800 pt-2 text-[10px] leading-relaxed text-zinc-600">
                    AI-summarized directly from the company&apos;s own {filing.formType} filing ({filing.filedAt}) -- reflects what the company says about itself, not independent verification of a real competitive advantage. See <a href="/#disclosures" className="underline hover:text-zinc-400">Disclosures</a>.
                </p>
            </div>
        );
    } catch (err) {
        return (
            <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
                <p className="text-xs uppercase tracking-wide text-zinc-500">Competitive Position (Moat)</p>
                <p className="mt-1 text-sm text-zinc-600">
                    AI analysis unavailable -- {err instanceof Error ? err.message : "an unknown error occurred"}.
                </p>
            </div>
        );
    }
}