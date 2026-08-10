import type { Company } from "../models/Company";
import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type { InvestmentDecisionReport } from "../models/InvestmentDecisionReport";

import { ExecutiveDecisionEngine } from "./ExecutiveDecisionEngine";
import { ExpectationsEngine } from "./ExpectationsEngine";
import { ScenarioEngine } from "./ScenarioEngine";
import { CapitalRotationEngine } from "./CapitalRotationEngine";
import { PortfolioImpactEngine } from "./PortfolioImpactEngine";
import { RiskRadarEngine } from "./RiskRadarEngine";

export class InvestmentDecisionBuilder {

    private readonly executiveDecision =
        new ExecutiveDecisionEngine();

    private readonly expectations =
        new ExpectationsEngine();

    private readonly scenarios =
        new ScenarioEngine();

    private readonly capitalRotation =
        new CapitalRotationEngine();

    private readonly portfolioImpact =
        new PortfolioImpactEngine();

    private readonly riskRadar =
        new RiskRadarEngine();

    build(
        company: Company,
        committee: CommitteeReport
    ): InvestmentDecisionReport {

        return {

            company,

            executiveDecision:
                this.executiveDecision.build(committee),

            // NOTE: wallStreet and ipoSniper both currently resolve
            // to the same committee-derived expectations because we
            // have no external consensus-estimates source (e.g. a
            // Finnhub/FMP estimates feed) wired in yet. They are no
            // longer fabricated "Insufficient data" placeholders,
            // but they are also not yet two genuinely distinct views.
            // Wiring a real Wall Street consensus source is separate,
            // still-open work.
            wallStreet:
                this.expectations.build(company, committee),

            ipoSniper:
                this.expectations.build(company, committee),

            keyMetrics:
                committee.reports.map(report => ({
                    name: report.analyst,
                    importance: Math.round(report.evidenceStrength),
                    reason: report.thesis
                })),

            scenarios:
                this.scenarios.build(company, committee),

            capitalRotation:
                this.capitalRotation.build(company, committee),

            portfolioImpact:
                this.portfolioImpact.build(company, committee),

            riskRadar:
                this.riskRadar.build(company, committee),

            evidence: {
                strengths: committee.reports
                    .filter(report =>
                        report.recommendation === "STRONG_BUY" ||
                        report.recommendation === "BUY"
                    )
                    .map(report => report.thesis),
                concerns: committee.reports
                    .flatMap(report => report.risks)
                    .map(risk => risk.description)
            }

        };

    }

}
