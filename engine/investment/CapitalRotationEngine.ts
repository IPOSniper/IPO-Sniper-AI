import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import { sectorOrIndustryLabel } from "./shared/companyLabel";
import type { CapitalRotation } from "../models/InvestmentDecisionReport";

/**
 * Flags which sectors/industries capital should rotate toward or
 * away from, based on this company's committee outcome as a signal
 * for its peer group. Real signal from committee.reports (per-analyst
 * scores), not a hardcoded return.
 */
export class CapitalRotationEngine {

    build(
        company: Company,
        committee: CommitteeReport
    ): CapitalRotation {

        const winners: string[] = [];
        const losers: string[] = [];

        const strongAnalystCount = committee.reports.filter(
            report =>
                report.recommendation === "STRONG_BUY" ||
                report.recommendation === "BUY"
        ).length;

        const weakAnalystCount = committee.reports.filter(
            report =>
                report.recommendation === "REDUCE" ||
                report.recommendation === "SELL"
        ).length;

        const totalAnalysts = committee.reports.length || 1;
        const bullishShare = strongAnalystCount / totalAnalysts;
        const bearishShare = weakAnalystCount / totalAnalysts;

        if (bullishShare >= 0.5 && committee.overallScore >= 60) {
            winners.push(sectorOrIndustryLabel(company));
        }

        if (bearishShare >= 0.5 && committee.overallScore < 40) {
            losers.push(sectorOrIndustryLabel(company));
        }

        // High-confidence outlier reports (one analyst strongly out
        // of step with the rest) surface as a rotation signal even
        // when the aggregate recommendation doesn't move.
        for (const report of committee.reports) {
            const isOutlierBull =
                report.recommendation === "STRONG_BUY" &&
                committee.recommendation !== "STRONG_BUY" &&
                committee.recommendation !== "BUY" &&
                report.confidence >= 70;

            const isOutlierBear =
                report.recommendation === "SELL" &&
                committee.recommendation !== "SELL" &&
                committee.recommendation !== "REDUCE" &&
                report.confidence >= 70;

            if (isOutlierBull) {
                winners.push(
                    `${company.industry} — per ${report.analyst}`
                );
            }

            if (isOutlierBear) {
                losers.push(
                    `${company.industry} — per ${report.analyst}`
                );
            }
        }

        return {
            winners: [...new Set(winners)],
            losers: [...new Set(losers)]
        };

    }

}
