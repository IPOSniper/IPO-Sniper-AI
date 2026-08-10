import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type { RiskRadar, Risk } from "../models/InvestmentDecisionReport";

/**
 * Aggregates every risk flagged by every analyst on the committee
 * into a single ranked radar. Severity is converted from the
 * analyst-level LOW/MEDIUM/HIGH scale into a 0-100 number so the
 * UI can sort/plot them without re-deriving the mapping itself.
 */
export class RiskRadarEngine {

    build(
        company: Company,
        committee: CommitteeReport
    ): RiskRadar {

        // Same exclusion as ChiefInvestmentOfficer's scoring and
        // AnalystLayer's "NO VERIFIED DATA" display: an analyst with
        // confidence 0 has no real opinion, so its risks array
        // (which can still be non-empty even at confidence 0 - see
        // RevenueGrowthInvestigation, which returns a "growth is
        // slowing" risk even when computed from empty/fake data)
        // must not leak into the aggregate radar. Found live: this
        // was still showing "Financial Analyst: Revenue growth is
        // slowing" after that analyst was correctly fixed to report
        // confidence:0 and excluded everywhere else.
        const risks: Risk[] = committee.reports
            .filter(report => report.confidence > 0)
            .flatMap(report =>
                report.risks.map(risk => ({
                    title: `${report.analyst}: ${risk.description}`,
                    severity: this.severityToScore(risk.severity)
                }))
            )
            .sort((a, b) => b.severity - a.severity);

        return { risks };

    }

    private severityToScore(
        severity: "LOW" | "MEDIUM" | "HIGH"
    ): number {

        switch (severity) {
            case "HIGH":
                return 85;
            case "MEDIUM":
                return 55;
            case "LOW":
            default:
                return 25;
        }

    }

}
