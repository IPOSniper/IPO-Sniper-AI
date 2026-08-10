import type { AnalystReport } from "../../contracts/AnalystReport";

/**
 * Shared low-confidence guard. When the evidence an analyst depends
 * on is below this confidence threshold, the analyst should not
 * compute a confident-sounding recommendation from what is actually
 * a placeholder/missing value (e.g. debtToEquity: 0 meaning "no
 * data" being read as "zero leverage"). Below this bar, analysts
 * call insufficientDataReport() instead of running their normal
 * threshold logic.
 */
export const MIN_USABLE_CONFIDENCE = 20;

export function insufficientDataReport(
    analystName: string,
    missingFields: string[]
): AnalystReport {

    return {

        analyst: analystName,

        recommendation: "HOLD",

        score: 0,

        confidence: 0,

        evidenceStrength: 0,

        thesis:
            `Insufficient verified data to form a view: ${missingFields.join(", ")} ${
                missingFields.length === 1 ? "is" : "are"
            } unverified or unavailable.`,

        evidence: [],

        assumptions: [],

        risks: [],

        unknowns: missingFields.map(
            field => `${field} has no verified data source yet.`
        ),

        monitoring: [
            {
                title: "Data Availability",
                description: `Re-run once ${missingFields.join(", ")} ${
                    missingFields.length === 1 ? "has" : "have"
                } a real data source.`,
                priority: "LOW"
            }
        ]

    };

}
