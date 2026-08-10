import { IntelligenceReport } from "../intelligence/contracts/IntelligenceReport";
import { InvestmentThesis } from "../brain/thesis/contracts/InvestmentThesis";

export class ThesisEngine {

    public build(
        reports: IntelligenceReport[]
    ): InvestmentThesis {

        const conviction =
            reports.length === 0
                ? 0
                : reports.reduce(
                    (sum, report) => sum + report.score.overall,
                    0
                ) / reports.length;

        const recommendation =
            conviction >= 90 ? "Strong Buy" :
            conviction >= 80 ? "Buy" :
            conviction >= 65 ? "Hold" :
            "Sell";

        const bullCase: string[] = [];
        const bearCase: string[] = [];
        const risks: string[] = [];
        const catalysts: string[] = [];

        for (const report of reports) {

            if (report.score.overall >= 80) {
                bullCase.push(report.summary);
            } else {
                bearCase.push(report.summary);
            }

            if (
                report.recommendation === "Neutral" ||
                report.recommendation === "Pending"
            ) {
                risks.push(
                    `${report.category} requires additional confirmation.`
                );
            }

        }

        if (bullCase.length > 0) {
            catalysts.push(
                "Positive operating momentum."
            );
        }

        return {

            recommendation,

            conviction,

            executiveSummary:
                `${recommendation} with ${Math.round(conviction)} conviction based on ${reports.length} intelligence engine(s).`,

            bullCase,

            bearCase,

            risks,

            catalysts

        };

    }

}
