import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type {
    ExpectationSummary,
    MetricExpectation
} from "../models/InvestmentDecisionReport";

/**
 * Builds metric-level expectations from the evidence items each
 * analyst actually collected, instead of a fixed metric list. If an
 * analyst hasn't run yet (e.g. this company's committee doesn't
 * include a Valuation analyst), that metric simply isn't listed
 * rather than showing a fabricated "Insufficient data" row.
 */
export class ExpectationsEngine {

    build(
        company: Company,
        committee: CommitteeReport
    ): ExpectationSummary {

        const metrics: MetricExpectation[] = committee.reports
            .flatMap(report => report.evidence)
            .map(evidence => ({
                name: evidence.metric,
                expected: this.describeValue(evidence.value),
                confidence: Math.round(evidence.confidence)
            }));

        return { metrics };

    }

    private describeValue(value: unknown): string {

        if (typeof value === "number") {
            return Number.isInteger(value)
                ? `${value}`
                : `${value.toFixed(1)}`;
        }

        if (Array.isArray(value)) {
            return `${value.length} data points`;
        }

        return String(value);

    }

}
