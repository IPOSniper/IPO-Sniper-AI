import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { sectorOrIndustryLabel } from "./shared/companyLabel";
import type { PortfolioImpact } from "../models/InvestmentDecisionReport";

/**
 * Translates a committee recommendation into portfolio-level
 * guidance. This is research guidance, not live position sizing —
 * IPO Sniper AI has no connected brokerage/holdings state yet, so
 * cashTarget is expressed as a suggested allocation percentage,
 * not a dollar amount against real positions.
 */
export class PortfolioImpactEngine {

    build(
        company: Company,
        committee: CommitteeReport
    ): PortfolioImpact {

        const isBullish =
            committee.recommendation === "STRONG_BUY" ||
            committee.recommendation === "BUY";

        const isBearish =
            committee.recommendation === "REDUCE" ||
            committee.recommendation === "SELL";

        const increaseExposure: string[] = [];
        const reduceExposure: string[] = [];

        if (isBullish) {
            increaseExposure.push(
                `${company.ticker} — ${sectorOrIndustryLabel(company)}`
            );

            if (committee.agreement >= 70) {
                increaseExposure.push(
                    `${company.industry} peers with similar thesis`
                );
            }
        }

        if (isBearish) {
            reduceExposure.push(
                `${company.ticker} — ${sectorOrIndustryLabel(company)}`
            );
        }

        // Low agreement among analysts means the committee itself
        // is split, regardless of the headline recommendation.
        if (committee.agreement < 50) {
            reduceExposure.push(
                `${company.ticker} — analyst disagreement (${Math.round(committee.agreement)}% agreement)`
            );
        }

        const cashTarget = this.suggestedAllocationPct(
            committee
        );

        return {
            increaseExposure,
            reduceExposure,
            cashTarget
        };

    }

    /**
     * Suggested position size as a percentage of a hypothetical
     * portfolio sleeve, scaled by conviction (score) and reliability
     * of that conviction (confidence x agreement). Capped well below
     * 100% since this is guidance, not an execution instruction.
     */
    private suggestedAllocationPct(
        committee: CommitteeReport
    ): number {

        const conviction = committee.overallScore / 100;
        const reliability =
            (committee.confidence / 100) *
            (committee.agreement / 100);

        const raw = conviction * reliability * 15;

        return Math.round(
            Math.max(0, Math.min(15, raw)) * 10
        ) / 10;

    }

}
