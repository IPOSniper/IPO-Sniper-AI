import { InvestigationFinding } from "../investigation/findings/InvestigationFinding";
import { AnalystConviction } from "./models/AnalystConviction";
import { ConvictionLevel } from "./enums/ConvictionLevel";

export class ConvictionEngine {

    public build(
        analyst: string,
        title: string,
        findings: InvestigationFinding[]
    ): AnalystConviction {

        const confidence =
            findings.length === 0
                ? 0
                : findings.reduce(
                    (sum, finding) => sum + finding.confidence,
                    0
                ) / findings.length;

        const conviction =
            findings.length === 0
                ? 0
                : (findings.filter(f => f.passed).length / findings.length) * 100;

        return {

            analyst,

            title,

            level: this.getLevel(conviction),

            conviction,

            confidence,

            supportingEvidence:
                findings
                    .filter(f => f.passed)
                    .map(f => f.summary),

            contradictingEvidence:
                findings
                    .filter(f => !f.passed)
                    .map(f => f.summary),

            assumptions: [],

            unknowns: [],

            monitoringItems: [],

            summary:
                conviction >= 70
                    ? "Institutional conviction is favorable."
                    : "Institutional conviction is limited."

        };

    }

    private getLevel(
        conviction: number
    ): ConvictionLevel {

        if (conviction >= 90)
            return ConvictionLevel.VERY_HIGH;

        if (conviction >= 75)
            return ConvictionLevel.HIGH;

        if (conviction >= 50)
            return ConvictionLevel.MODERATE;

        if (conviction >= 25)
            return ConvictionLevel.LOW;

        return ConvictionLevel.VERY_LOW;

    }

}
