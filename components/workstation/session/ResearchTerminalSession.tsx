import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import MissionControlHeader from "../panels/MissionControlHeader";
import ResearchSnapshotPanel from "../panels/ResearchSnapshotPanel";
import AIVerdictRow from "../panels/AIVerdictRow";
import CommitteeAvatarRow from "../panels/CommitteeAvatarRow";
import AnalystLayer from "./AnalystLayer";

import EvidenceSummaryGrid from "../panels/EvidenceSummaryGrid/EvidenceSummaryGrid";
import ExecutiveSummaryPanel from "../panels/ExecutiveSummaryPanel";
import RecommendationPanel from "../panels/RecommendationPanel";
import ConvictionRadar from "../panels/ConvictionRadar/ConvictionRadar";
import CommitteePanel from "../panels/CommitteePanel";
import InvestmentThesisPanel from "../panels/InvestmentThesisPanel";
import InvestorDecisionCenter from "../panels/InvestorDecisionCenter";
import PortfolioIntelligence from "../panels/PortfolioIntelligence/PortfolioIntelligence";

import FinancialOverviewChart from "../panels/FinancialOverviewChart/FinancialOverviewChart";
import ValuationSummary from "../panels/ValuationSummary/ValuationSummary";
import InstitutionalOwnershipCard from "../panels/InstitutionalOwnershipCard/InstitutionalOwnershipCard";
import NewsSentimentDonut from "../panels/NewsSentimentDonut/NewsSentimentDonut";
import EvidencePanel from "../panels/EvidencePanel";
import RiskPanel from "../panels/RiskPanel";
import CatalystPanel from "../panels/CatalystPanel";
import EarningsPanel from "../panels/EarningsPanel";
import OptionsChainPanel from "../panels/OptionsChainPanel";
import InsiderActivityPanel from "../panels/InsiderActivityPanel";

import SnapshotPanel from "../panels/SnapshotPanel";
import WhatCouldChangeThisPanel from "../panels/WhatCouldChangeThisPanel";
import UpcomingEvents from "../panels/UpcomingEvents";
import ResearchProgress from "../panels/ResearchProgress";
import SystemLog from "../panels/SystemLog";
import ResearchHistory from "../panels/ResearchHistory/ResearchHistory";

import ShareCardButton from "../panels/ShareCard/ShareCardButton";
import CollapsibleSection from "../shared/CollapsibleSection";

interface Props extends WorkstationPanelProps {
    userId?: string | null;
}

function Section({
    id,
    label,
    children,
}: {
    id: string;
    label: string;
    children: React.ReactNode;
}) {
    return (
        <section id={id} className="scroll-mt-28 space-y-3">
            <div className="flex items-center gap-3">
                <span className="h-px flex-1 bg-zinc-800" />
                <h2 className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">
                    {label}
                </h2>
                <span className="h-px flex-1 bg-zinc-800" />
            </div>
            {children}
        </section>
    );
}

export default function ResearchTerminalSession({
    research,
}: Props) {
    return (
        <div className="space-y-8">
            <Section id="overview" label="Research Overview">
                <ResearchSnapshotPanel research={research} />
                <MissionControlHeader research={research} />
                <AIVerdictRow research={research} />
            </Section>

            <Section id="committee" label="AI Investment Committee">
                <CommitteeAvatarRow committee={research.committee} />
                <AnalystLayer research={research} />
                <CommitteePanel research={research} />

                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <ConvictionRadar research={research} />
                    <RecommendationPanel research={research} />
                </div>
            </Section>

            <Section id="evidence" label="Evidence Intelligence">
                <EvidenceSummaryGrid research={research} />
                <EvidencePanel research={research} />
            </Section>

            <Section id="thesis" label="Investment Thesis">
                <ExecutiveSummaryPanel research={research} />
                <InvestmentThesisPanel research={research} />
            </Section>

            <Section id="decision" label="Investor Decision Center">
                <InvestorDecisionCenter research={research} />
            </Section>

            <Section id="portfolio" label="Portfolio Intelligence">
                <PortfolioIntelligence research={research} />
            </Section>

            <Section id="financials" label="Financial Intelligence">
                <CollapsibleSection title="Financial Overview" defaultOpen>
                    <FinancialOverviewChart research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="valuation" label="Valuation Intelligence">
                <CollapsibleSection title="Valuation" defaultOpen={false}>
                    <ValuationSummary />
                </CollapsibleSection>
            </Section>

            <Section id="institutions" label="Institutional Intelligence">
                <InstitutionalOwnershipCard ticker={research.company.ticker} />
            </Section>

            <Section id="insiders" label="Insider Intelligence">
                <CollapsibleSection title="Insider Activity" defaultOpen={false}>
                    <InsiderActivityPanel research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="earnings" label="Earnings Intelligence">
                <CollapsibleSection title="Earnings" defaultOpen>
                    <EarningsPanel research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="options" label="Options Intelligence">
                <CollapsibleSection title="Options Chain" defaultOpen={false}>
                    <OptionsChainPanel research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="news" label="News Intelligence">
                <CollapsibleSection title="News Sentiment & Evidence" defaultOpen>
                    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                        <NewsSentimentDonut research={research} />
                        <EvidencePanel research={research} />
                    </div>
                </CollapsibleSection>
            </Section>

            <Section id="risk" label="Risk Radar">
                <CollapsibleSection title="Risks" defaultOpen>
                    <RiskPanel research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="catalysts" label="Catalysts">
                <CollapsibleSection title="Catalysts to Watch" defaultOpen>
                    <CatalystPanel research={research} />
                </CollapsibleSection>
            </Section>

            <Section id="events" label="Upcoming Events">
                <UpcomingEvents research={research} />
            </Section>

            <Section id="operations" label="Research Operations">
                <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
                    <SnapshotPanel research={research} />
                    <WhatCouldChangeThisPanel research={research} />
                </div>

                <ResearchProgress research={research} />
                <SystemLog research={research} />
            </Section>

            <Section id="history" label="Research History">
                <ResearchHistory />
            </Section>

            <Section id="publish" label="Publish & Share">
                <div className="rounded-xl border border-zinc-800 bg-zinc-950 p-5">
                    <div className="mb-3">
                        <h2 className="text-sm font-semibold text-zinc-300">
                            Share Research
                        </h2>
                        <p className="mt-1 text-xs text-zinc-600">
                            Public snapshots preserve the research disclosure and
                            exclude News data where the current provider terms do not
                            permit production/public use.
                        </p>
                    </div>
                    <ShareCardButton research={research} />
                </div>
            </Section>
        </div>
    );
}

