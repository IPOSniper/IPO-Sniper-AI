import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import EvidenceSummaryGrid from "../panels/EvidenceSummaryGrid/EvidenceSummaryGrid";
import ExecutiveSummaryPanel from "../panels/ExecutiveSummaryPanel";
import RecommendationPanel from "../panels/RecommendationPanel";
import CommitteePanel from "../panels/CommitteePanel";
import ConvictionRadar from "../panels/ConvictionRadar/ConvictionRadar";
import InvestmentThesisPanel from "../panels/InvestmentThesisPanel";
import InvestorDecisionCenter from "../panels/InvestorDecisionCenter";
import FinancialOverviewChart from "../panels/FinancialOverviewChart/FinancialOverviewChart";
import ValuationSummary from "../panels/ValuationSummary/ValuationSummary";
import EvidencePanel from "../panels/EvidencePanel";
import RiskPanel from "../panels/RiskPanel";
import CatalystPanel from "../panels/CatalystPanel";
import NewsSentimentDonut from "../panels/NewsSentimentDonut/NewsSentimentDonut";
import PortfolioIntelligence from "../panels/PortfolioIntelligence/PortfolioIntelligence";
import ShareCardButton from "../panels/ShareCard/ShareCardButton";
import EarningsPanel from "../panels/EarningsPanel";

export default function IntelligenceLayer({
research,
}: WorkstationPanelProps){

return(
<section className="space-y-6">
<EvidenceSummaryGrid research={research} />
<ExecutiveSummaryPanel research={research} />

<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <ConvictionRadar research={research} />
 <RecommendationPanel research={research} />
</div>

<CommitteePanel research={research} />
<InvestmentThesisPanel research={research} />
<InvestorDecisionCenter research={research} />
<PortfolioIntelligence research={research} />

<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <FinancialOverviewChart research={research} />
 <ValuationSummary />
</div>

<div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
 <NewsSentimentDonut research={research} />
 <EvidencePanel research={research} />
</div>

<RiskPanel research={research} />
<CatalystPanel research={research} />
<EarningsPanel research={research} />

<div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
 <h2 className="mb-1 text-lg font-semibold">Share Research Card</h2>
 <p className="mb-3 text-xs text-zinc-600">
 Excludes News data - NewsAPI&apos;s free tier terms forbid production/public use.
 Recommendation shown is recomputed without the News Analyst&apos;s vote.
 </p>
 <ShareCardButton research={research} />
</div>
</section>
);
}
