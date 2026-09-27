import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import PriceChart from "../panels/PriceChart/PriceChart";
import ResearchSnapshotPanel from "../panels/ResearchSnapshotPanel";
import AIVerdictRow from "../panels/AIVerdictRow";
import CommitteeAvatarRow from "../panels/CommitteeAvatarRow";
import AnalystLayer from "./AnalystLayer";
import CommitteePanel from "../panels/CommitteePanel";
import ConsensusBar from "../panels/ConsensusBar";
import ConvictionRadar from "../panels/ConvictionRadar/ConvictionRadar";
import RecommendationPanel from "../panels/RecommendationPanel";
import EvidenceSummaryGrid from "../panels/EvidenceSummaryGrid/EvidenceSummaryGrid";
import InvestmentThesisPanel from "../panels/InvestmentThesisPanel";
import InvestorDecisionCenter from "../panels/InvestorDecisionCenter";
import FinancialModule from "../panels/FinancialModule";
import ValuationModule from "../panels/ValuationModule";
import RiskModule from "../panels/RiskModule";
import InstitutionalOwnershipCard from "../panels/InstitutionalOwnershipCard/InstitutionalOwnershipCard";
import InsiderActivityPanel from "../panels/InsiderActivityPanel";
import CatalystPanel from "../panels/CatalystPanel";
import EarningsPanel from "../panels/EarningsPanel";
import OptionsChainPanel from "../panels/OptionsChainPanel";
import NewsSentimentDonut from "../panels/NewsSentimentDonut/NewsSentimentDonut";
import PortfolioIntelligence from "../panels/PortfolioIntelligence/PortfolioIntelligence";
import UpcomingEvents from "../panels/UpcomingEvents";
import ShareCardButton from "../panels/ShareCard/ShareCardButton";

function Module({
    title,
    children,
    className = "",
}: {
    title?: string;
    children: React.ReactNode;
    className?: string;
}) {
    return (
        <div className={`rounded-xl border border-zinc-800 bg-zinc-950 p-4 ${className}`}>
            {title && (
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-zinc-500">
                    {title}
                </h3>
            )}
            {children}
        </div>
    );
}

export default function ResearchDashboard({ research }: WorkstationPanelProps) {
    return (
        <div className="space-y-4">

            <div className="grid grid-cols-1 gap-4 xl:grid-cols-[minmax(0,2fr)_minmax(0,1fr)]">
                <Module title="Price & Market Activity">
                    <PriceChart ticker={research.company.ticker} />
                </Module>
                <Module title="AI Research Assessment">
                    <ResearchSnapshotPanel research={research} />
                    <AIVerdictRow research={research} />
                </Module>
            </div>

            <Module title="AI Investment Committee">
                <CommitteeAvatarRow committee={research.committee} />
                <AnalystLayer research={research} />
                <CommitteePanel research={research} />
                <ConsensusBar research={research} />
                <div className="mt-4 grid grid-cols-1 gap-4 lg:grid-cols-2">
                    <ConvictionRadar research={research} />
                    <RecommendationPanel research={research} />
                </div>
            </Module>

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <FinancialModule research={research} />
                <ValuationModule />
                <RiskModule research={research} />
                <Module title="Institutions">
                    <InstitutionalOwnershipCard ticker={research.company.ticker} />
                </Module>
            </div>

            <div className="grid grid-cols-1 items-start gap-4 sm:grid-cols-2 xl:grid-cols-4">
                <Module title="Insiders">
                    <InsiderActivityPanel research={research} />
                </Module>
                <Module title="Earnings">
                    <EarningsPanel research={research} />
                </Module>
                <Module title="Options">
                    <OptionsChainPanel research={research} />
                </Module>
                <Module title="News">
                    <NewsSentimentDonut research={research} />
                </Module>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                <Module title="Investment Thesis">
                    <InvestmentThesisPanel research={research} />
                </Module>
                <Module title="Investor Decision Center">
                    <InvestorDecisionCenter research={research} />
                </Module>
            </div>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <Module title="Catalysts">
                    <CatalystPanel research={research} />
                </Module>
                <Module title="Portfolio Intelligence">
                    <PortfolioIntelligence research={research} />
                </Module>
                <Module title="Upcoming Events">
                    <UpcomingEvents research={research} />
                </Module>
            </div>

            <Module title="Evidence Intelligence">
                <EvidenceSummaryGrid research={research} />
            </Module>

            <Module>
                <ShareCardButton research={research} />
            </Module>

        </div>
    );
}
