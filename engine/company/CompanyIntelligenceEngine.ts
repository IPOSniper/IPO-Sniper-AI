import { ThesisEngine } from "../thesis/ThesisEngine";
import { InvestmentCommittee } from "../committee/InvestmentCommittee";
import { IntelligenceRegistry } from "../intelligence/IntelligenceRegistry";

import { CompanyIntelligenceReport } from "./models/CompanyIntelligenceReport";

export class CompanyIntelligenceEngine {

    private readonly thesis =
        new ThesisEngine();

    private readonly committee =
        new InvestmentCommittee();

    public async analyze(
        symbol: string
    ): Promise<CompanyIntelligenceReport> {

        const reports = [];

        for (const engine of IntelligenceRegistry) {

            reports.push(
                await engine.analyze(symbol)
            );

        }

        const thesis =
            this.thesis.build(reports);

        const committee =
            this.committee.evaluate(thesis);

        return {

            symbol,

            generatedAt: new Date(),

            intelligence: reports,

            thesis,

            committee

        };

    }

}
