import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import EvidenceSummaryGrid from "../panels/EvidenceSummaryGrid/EvidenceSummaryGrid";
import EvidenceModule from "../panels/EvidenceModule";
import DataFreshnessModule from "../panels/DataFreshnessModule";
import ResearchGapMap from "../panels/ResearchGapMap";
import ExecutiveSummaryPanel from "../panels/ExecutiveSummaryPanel";
import RecommendationPanel from "../panels/RecommendationPanel";
import CommitteePanel from "../panels/CommitteePanel";
import ConvictionRadar from "../panels/ConvictionRadar/ConvictionRadar";
import ResearchIntelligenceMap from "../panels/ResearchIntelligenceMap";
import ConsensusBar from "../panels/ConsensusBar";
import AnalystEvidenceCards from "../panels/AnalystEvidenceCards";
import FiveTierVoteDistribution from "../panels/FiveTierVoteDistribution";
import QualityRiskGauges from "../panels/QualityRiskGauges";
import InstitutionalFilingFreshness from "../panels/InstitutionalFilingFreshness";
import OptionsGreeksSummary from "../panels/OptionsGreeksSummary";
import CommitteeConsensusCard from "../panels/CommitteeConsensusCard";
import InvestmentThesisPanel from "../panels/InvestmentThesisPanel";
import InvestmentThesisCards from "../panels/InvestmentThesisCards";
import InvestorDecisionCenter from "../panels/InvestorDecisionCenter";
import PortfolioIntelligence from "../panels/PortfolioIntelligence/PortfolioIntelligence";
import FinancialOverviewChart from "../panels/FinancialOverviewChart/FinancialOverviewChart";
import MarginTrendModule from "../panels/MarginTrendModule";
import CashDebtModule from "../panels/CashDebtModule";
import GrowthTrendModule from "../panels/GrowthTrendModule";
import BalanceSheetTrend from "../panels/BalanceSheetTrend";
import GrowthVsProfitability from "../panels/GrowthVsProfitability";
import ValuationSummary from "../panels/ValuationSummary/ValuationSummary";
import InstitutionalOwnershipCard from "../panels/InstitutionalOwnershipCard/InstitutionalOwnershipCard";
import InstitutionalOwnershipTable from "../panels/InstitutionalOwnershipTable";
import InstitutionalEvidenceTable13F from "../panels/InstitutionalEvidenceTable13F";
import EvidencePanel from "../panels/EvidencePanel";
import RiskPanel from "../panels/RiskPanel";
import CatalystPanel from "../panels/CatalystPanel";
import NewsSentimentDonut from "../panels/NewsSentimentDonut/NewsSentimentDonut";
import ShareCardButton from "../panels/ShareCard/ShareCardButton";
import EarningsPanel from "../panels/EarningsPanel";
import EarningsComparisonChart from "../panels/EarningsComparisonChart";
import PriceVolumeModule from "../panels/PriceVolumeModule";
import DrawdownModule from "../panels/DrawdownModule";

export default function IntelligenceLayer({
research,
}: WorkstationPanelProps){

return(
<section className="space-y-6">
<section id="evidence" className="scroll-mt-24 space-y-6">
<EvidenceSummaryGrid research={research} />
<EvidenceModule research={research} />
<DataFreshnessModule research={research} />
<ResearchGapMap research={research} />
</section>
<QualityRiskGauges research={research} />
<ExecutiveSummaryPanel research={research} />

<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <ConvictionRadar research={research} />
 <RecommendationPanel research={research} />
</div>

<ResearchIntelligenceMap research={research} />

<CommitteePanel research={research} />
<ConsensusBar research={research} />
<CommitteeConsensusCard research={research} />
<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<AnalystEvidenceCards research={research} />
<FiveTierVoteDistribution research={research} />
</div>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<InvestmentThesisPanel research={research} />
<InvestmentThesisCards research={research} />
</div>

<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
<InvestorDecisionCenter research={research} />
<PortfolioIntelligence research={research} />
</div>

<section id="financials" className="scroll-mt-24">
<FinancialOverviewChart research={research} />
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
<MarginTrendModule research={research} />
<CashDebtModule research={research} />
<GrowthTrendModule research={research} />
<BalanceSheetTrend research={research} />
<GrowthVsProfitability research={research} />
</div>
</section>

<section id="valuation" className="scroll-mt-24">
<ValuationSummary />
</section>

<section id="institutions" className="scroll-mt-24">
<InstitutionalOwnershipCard ticker={research.company.ticker} />
<div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
<InstitutionalOwnershipTable research={research} />
<InstitutionalEvidenceTable13F research={research} />
</div>
<InstitutionalFilingFreshness research={research} />
</section>

<section id="news" className="scroll-mt-24">
<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <NewsSentimentDonut research={research} />
 <EvidencePanel research={research} />
</div>
</section>

<section id="risks" className="scroll-mt-24">
<div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
<RiskPanel research={research} />
<div id="catalysts">
<CatalystPanel research={research} />
</div>
</div>
</section>

<section id="earnings" className="scroll-mt-24">
<EarningsComparisonChart ticker={research.company.ticker} companyName={research.company.name} />
<EarningsPanel research={research} />
<OptionsGreeksSummary ticker={research.company.ticker} />
</section>

<div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
<PriceVolumeModule ticker={research.company.ticker} />
<DrawdownModule ticker={research.company.ticker} />
</div>

<ShareCardButton research={research} />
</section>
);
}
