import { ResearchEngine } from "../research/researchEngine";
import { FinnhubQuoteProvider } from "../evidence/providers/FinnhubQuoteProvider";
import type { ExecutiveDecision, Risk } from "../models/InvestmentDecisionReport";

/**
 * Turns real per-ticker committee output into portfolio-level risk
 * numbers. Deliberately arithmetic on top of analyzeFull() — no new
 * scoring model, no trading logic. See docs/HEDGE_FUND_ARCHITECTURE.md
 * for why this (not execution) is the right next slice.
 */

export interface PortfolioPosition {
    ticker: string;
    shares: number;
    costBasis: number;
}

export interface PositionRiskResult {
    ticker: string;
    marketValue: number;
    weight: number; // % of the successfully-priced portfolio
    recommendation: ExecutiveDecision["recommendation"];
    conviction: number;
    risks: Risk[];
}

export interface FailedPosition {
    ticker: string;
    reason: string;
}

export interface ConcentrationEntry {
    ticker: string;
    weight: number;
    flagged: boolean; // unusually large vs. the rest of the book
}

export interface WeightedRisk extends Risk {
    ticker: string;
    weightedSeverity: number; // severity * position weight
}

export type CommitteeStanceLabel = "Bullish" | "Bearish" | "Mixed" | "Neutral";

export interface CommitteeStance {
    label: CommitteeStanceLabel;
    buyWeight: number;
    holdWeight: number;
    reduceWeight: number;
}

export interface PortfolioRiskReport {
    asOf: string;
    totalMarketValue: number;
    positions: PositionRiskResult[];
    failed: FailedPosition[];
    concentration: ConcentrationEntry[];
    topRisks: WeightedRisk[];
    committeeStance: CommitteeStance;
}

// Above this weight, a single position gets flagged as concentrated.
// Not a hard limit (this is a research/display feature, not an
// order-blocking risk engine) — just a threshold worth surfacing.
const CONCENTRATION_FLAG_THRESHOLD = 25;

const BUY_RECOMMENDATIONS: ExecutiveDecision["recommendation"][] = ["Strong Buy", "Buy"];
const REDUCE_RECOMMENDATIONS: ExecutiveDecision["recommendation"][] = ["Reduce", "Sell"];

export class PortfolioRiskAggregator {

    private readonly research = new ResearchEngine();
    private readonly quotes = new FinnhubQuoteProvider();

    /**
     * Builds the report position by position. A failure on one
     * ticker (bad symbol, Finnhub/SEC outage, etc.) is recorded in
     * `failed` and excluded from weighting — it does NOT abort the
     * whole run. A portfolio of 12 names shouldn't go blank because
     * one delisted ticker throws.
     */
    async build(positions: PortfolioPosition[]): Promise<PortfolioRiskReport> {

        if (positions.length === 0) {
            return {
                asOf: new Date().toISOString(),
                totalMarketValue: 0,
                positions: [],
                failed: [],
                concentration: [],
                topRisks: [],
                committeeStance: { label: "Neutral", buyWeight: 0, holdWeight: 0, reduceWeight: 0 },
            };
        }

        const settled = await Promise.allSettled(
            positions.map(position => this.analyzePosition(position))
        );

        const priced: Array<Omit<PositionRiskResult, "weight">> = [];
        const failed: FailedPosition[] = [];

        settled.forEach((result, i) => {
            if (result.status === "fulfilled") {
                priced.push(result.value);
            } else {
                failed.push({
                    ticker: positions[i].ticker,
                    reason: this.describeFailure(result.reason),
                });
            }
        });

        const totalMarketValue = priced.reduce((sum, p) => sum + p.marketValue, 0);

        const withWeight: PositionRiskResult[] = priced.map(p => ({
            ...p,
            weight: totalMarketValue > 0 ? (p.marketValue / totalMarketValue) * 100 : 0,
        }));

        return {
            asOf: new Date().toISOString(),
            totalMarketValue,
            positions: withWeight.sort((a, b) => b.weight - a.weight),
            failed,
            concentration: this.buildConcentration(withWeight),
            topRisks: this.buildTopRisks(withWeight),
            committeeStance: this.buildCommitteeStance(withWeight),
        };
    }

    private async analyzePosition(
        position: PortfolioPosition
    ): Promise<Omit<PositionRiskResult, "weight">> {

        const [quote, { investmentDecision }] = await Promise.all([
            this.quotes.getQuote(position.ticker),
            this.research.analyzeFull({ ticker: position.ticker }),
        ]);

        return {
            ticker: position.ticker,
            marketValue: quote.price * position.shares,
            recommendation: investmentDecision.executiveDecision.recommendation,
            conviction: investmentDecision.executiveDecision.capitalAllocationScore,
            risks: investmentDecision.riskRadar.risks,
        };
    }

    private describeFailure(reason: unknown): string {
        if (reason instanceof Error) return reason.message;
        return "Analysis failed for this position.";
    }

    private buildConcentration(positions: PositionRiskResult[]): ConcentrationEntry[] {
        return positions.map(p => ({
            ticker: p.ticker,
            weight: p.weight,
            flagged: p.weight >= CONCENTRATION_FLAG_THRESHOLD,
        }));
    }

    /**
     * Ranks every committee-flagged risk across all positions by
     * severity * how much of the portfolio that position represents
     * — a HIGH-severity risk in a 2%-weight position is genuinely
     * less important to the book than the same risk in a 40%-weight
     * position, so a flat severity sort would mislead.
     */
    private buildTopRisks(positions: PositionRiskResult[]): WeightedRisk[] {
        const all: WeightedRisk[] = positions.flatMap(p =>
            p.risks.map(risk => ({
                ...risk,
                ticker: p.ticker,
                weightedSeverity: risk.severity * (p.weight / 100),
            }))
        );

        return all
            .sort((a, b) => b.weightedSeverity - a.weightedSeverity)
            .slice(0, 10);
    }

    /**
     * What fraction of the (successfully-priced) portfolio, by
     * weight, the committee currently rates Buy vs. Reduce/Sell,
     * rolled into one label. Hold is tracked but doesn't push the
     * label either direction.
     */
    private buildCommitteeStance(positions: PositionRiskResult[]): CommitteeStance {

        let buyWeight = 0;
        let holdWeight = 0;
        let reduceWeight = 0;

        for (const p of positions) {
            if (BUY_RECOMMENDATIONS.includes(p.recommendation)) {
                buyWeight += p.weight;
            } else if (REDUCE_RECOMMENDATIONS.includes(p.recommendation)) {
                reduceWeight += p.weight;
            } else {
                holdWeight += p.weight;
            }
        }

        let label: CommitteeStanceLabel = "Neutral";

        if (buyWeight === 0 && reduceWeight === 0) {
            label = "Neutral";
        } else if (buyWeight >= reduceWeight * 2) {
            label = "Bullish";
        } else if (reduceWeight >= buyWeight * 2) {
            label = "Bearish";
        } else {
            label = "Mixed";
        }

        return { label, buyWeight, holdWeight, reduceWeight };
    }
}
