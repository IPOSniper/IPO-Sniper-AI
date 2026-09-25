import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type {
    ScenarioAnalysis
} from "../models/InvestmentDecisionReport";

/**
 * Derives bull/base/bear probabilities from how confident and how
 * unanimous the committee actually was, instead of a fixed 25/50/25
 * split. Catalysts are pulled from each analyst's real monitoring
 * items and theses rather than left empty.
 */
export class ScenarioEngine {

    build(
        company: Company,
        committee: CommitteeReport
    ): ScenarioAnalysis {

        const conviction = committee.overallScore / 100;
        const reliability =
            (committee.confidence / 100) *
            (committee.agreement / 100);

        // Reliability widens the gap between bull and bear away from
        // the 50/50 base case; low reliability keeps it close to even.
        const spread = Math.round(30 * reliability);

        const bullProbability = Math.max(
            10,
            Math.min(70, 50 - 25 + Math.round(conviction * 50) + spread / 2)
        );
        const bearProbability = Math.max(
            10,
            Math.min(70, 100 - bullProbability - 20)
        );
        const baseProbability =
            100 - bullProbability - bearProbability;

        // Real bug fixed: bull.catalysts and bear.catalysts both used
        // this SAME shared array, direction-agnostic - confirmed live
        // on SPCE, the identical 5 items appeared twice (once green,
        // once red). Real fix, mirroring the topTheses/topConcerns
        // split just below: each side's real monitoring items now
        // come only from analysts who actually recommended that
        // direction, same as every other direction-specific field
        // in this file.
        const bullMonitoring = committee.reports
            .filter(report => report.recommendation === "STRONG_BUY" || report.recommendation === "BUY")
            .flatMap(report => report.monitoring)
            .filter(item => item.priority === "HIGH")
            .map(item => item.title);

        const bearMonitoring = committee.reports
            .filter(report => report.recommendation === "REDUCE" || report.recommendation === "SELL")
            .flatMap(report => report.monitoring)
            .filter(item => item.priority === "HIGH")
            .map(item => item.title);

        const topTheses = committee.reports
            .filter(report =>
                report.recommendation === "STRONG_BUY" ||
                report.recommendation === "BUY"
            )
            .map(report => report.thesis);

        const topConcerns = committee.reports
            .filter(report =>
                report.recommendation === "REDUCE" ||
                report.recommendation === "SELL"
            )
            .map(report => report.thesis);

        return {

            bull: {
                probability: bullProbability,
                summary: `${company.name} outperforms if ${
                    topTheses[0]?.toLowerCase() ?? "current fundamentals hold"
                }`,
                catalysts: [...new Set(bullMonitoring)]
            },

            base: {
                probability: baseProbability,
                summary: `${company.name} performs in line with the committee's ${committee.recommendation.replace("_", " ").toLowerCase()} view.`,
                catalysts: []
            },

            bear: {
                probability: bearProbability,
                summary: `${company.name} underperforms if ${
                    topConcerns[0]?.toLowerCase() ?? "growth or margin trends deteriorate"
                }`,
                catalysts: [...new Set(bearMonitoring)]
            }

        };

    }

}
