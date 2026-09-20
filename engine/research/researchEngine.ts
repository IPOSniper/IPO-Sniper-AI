import { EvidenceEngine } from "../evidence/evidenceEngine";
import type { EvidencePackage } from "../evidence/package";

import { CommitteeEngine } from "../committee/committeeEngine";
import { FinancialAnalystAdapter } from "../committee/adapters/FinancialAnalystAdapter";
import { RevenueAnalyst } from "../committee/analysts/RevenueAnalyst";
import { MarginAnalyst } from "../committee/analysts/MarginAnalyst";
import { BalanceSheetAnalyst } from "../committee/analysts/BalanceSheetAnalyst";
import { CashFlowAnalyst } from "../committee/analysts/CashFlowAnalyst";
import { GrowthAnalyst } from "../committee/analysts/GrowthAnalyst";
import { LiquidityAnalyst } from "../committee/analysts/LiquidityAnalyst";
import { ValuationAnalyst } from "../committee/analysts/ValuationAnalyst";
import { IndustryAnalyst } from "../committee/analysts/IndustryAnalyst";
import { MarketAnalyst } from "../committee/analysts/MarketAnalyst";
import { ManagementAnalyst } from "../committee/analysts/ManagementAnalyst";
import { RiskAnalyst } from "../committee/analysts/RiskAnalyst";
import { VerificationAnalyst } from "../committee/analysts/VerificationAnalyst";
import { NewsAnalyst } from "../committee/analysts/NewsAnalyst";
import { SECAnalyst } from "../committee/analysts/SECAnalyst";
// KnowledgeAnalyst is intentionally NOT imported â€” unlike News/SEC,
// it doesn't just need a data source, it needs a product decision on
// what "Knowledge" evidence even means for a single-company analyst.
// See the comment at the top of KnowledgeAnalyst.ts.

import type { ResearchRequest } from "../models/ResearchRequest";
import type { ResearchReport } from "../models/ResearchReport";
import type { InvestmentDecisionReport } from "../models/InvestmentDecisionReport";

import { ResearchReportBuilder } from "../report/ResearchReportBuilder";
import { InvestmentDecisionBuilder } from "../investment/InvestmentDecisionBuilder";

import { recordResearchCall } from "@/engine/ledger/ResearchCallLedger";

export class ResearchEngine {

    private readonly evidence =
        new EvidenceEngine();

    private readonly committee =
        new CommitteeEngine<EvidencePackage>([
            new RevenueAnalyst(),
            new MarginAnalyst(),
            new FinancialAnalystAdapter(),
            new BalanceSheetAnalyst(),
            new CashFlowAnalyst(),
            new GrowthAnalyst(),
            new LiquidityAnalyst(),
            new ValuationAnalyst(),
            new IndustryAnalyst(),
            new MarketAnalyst(),
            new ManagementAnalyst(),
            new RiskAnalyst(),
            new VerificationAnalyst(),
            new NewsAnalyst(),
            new SECAnalyst(),
        ]);

    private readonly reportBuilder =
        new ResearchReportBuilder();

    private readonly decisionBuilder =
        new InvestmentDecisionBuilder();

    getCommitteeEngine() {
        return this.committee;
    }

    /**
     * Existing Research Pipeline
     */
    async analyze(
        request: ResearchRequest
    ): Promise<ResearchReport> {

        const evidence =
            await this.evidence.build(request.ticker);

        const committee =
            await this.committee.analyze(evidence);

        return await this.reportBuilder.build(
            evidence.company.ticker,
            evidence.company.name,
            committee,
            evidence
        );

    }

    /**
     * New Investment Decision Pipeline
     */
    async analyzeInvestmentDecision(
        request: ResearchRequest
    ): Promise<InvestmentDecisionReport> {

        const evidence =
            await this.evidence.build(request.ticker);

        const committee =
            await this.committee.analyze(evidence);

        return this.decisionBuilder.build(
            evidence.company,
            committee
        );

    }

    /**
     * Builds evidence and runs the committee ONCE, then produces
     * both reports from that single pass. .analyze() and
     * .analyzeInvestmentDecision() above each independently rebuild
     * evidence and rerun the committee â€” calling both back to back
     * (as ResearchCapability used to only call .analyze(), and
     * nothing called .analyzeInvestmentDecision() at all) would
     * double every real API call (Finnhub/SEC/NewsAPI) per research
     * request and risk the two reports reflecting slightly
     * different underlying data. Use this for any caller that needs
     * both reports for the same ticker.
     */
    async analyzeFull(
        request: ResearchRequest
    ): Promise<{
        report: ResearchReport;
        investmentDecision: InvestmentDecisionReport;
    }> {

        const evidence =
            await this.evidence.build(request.ticker);

        const committee =
            await this.committee.analyze(evidence);

        const report =
            await this.reportBuilder.build(
                evidence.company.ticker,
                evidence.company.name,
                committee,
                evidence
            );

        const investmentDecision =
            this.decisionBuilder.build(
                evidence.company,
                committee
            );

        recordResearchCall({
            company: evidence.company,
            report,
            committee,
        }).catch(err => console.error("Ledger write failed (non-blocking):", err));

        return { report, investmentDecision };

    }

}


