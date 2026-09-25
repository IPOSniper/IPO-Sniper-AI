import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import MissionControlHeader from "../panels/MissionControlHeader";
import ResearchSnapshotPanel from "../panels/ResearchSnapshotPanel";
import AIVerdictRow from "../panels/AIVerdictRow";
import CommitteeAvatarRow from "../panels/CommitteeAvatarRow";
import AdaptiveIntelligencePanel from "../panels/AdaptiveIntelligencePanel";
import AnalystBriefingSummary from "../panels/AnalystBriefingSummary";
import AnalystLayer from "./AnalystLayer";
import IntelligenceLayer from "./IntelligenceLayer";
import OperationsLayer from "./OperationsLayer";

export default function ResearchSession({
    research,
    userId = null,
}: WorkstationPanelProps & { userId?: string | null }) {
    return (
        <div className="space-y-8">
            <section id="overview" className="scroll-mt-24">
                <div className="space-y-4">
                    <ResearchSnapshotPanel research={research} />

                    <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                        <MissionControlHeader research={research} />
                        <section id="assessment" className="scroll-mt-24">
                            <AIVerdictRow research={research} />
                        </section>

                    </div>
                </div>
            </section>

            {/*
              ZONE 2 (Workstation Blueprint v1): the product's real
              differentiator, pulled together into one prominent, early
              section instead of scattered by build order.
              AdaptiveIntelligencePanel used to render at page.tsx level,
              above the entire branded header/global nav -- moved here,
              right next to AnalystBriefingSummary (which used to sit
              after History, near the bottom of the page).
            */}
            <section id="briefing" className="scroll-mt-24">
                <AdaptiveIntelligencePanel userId={userId} ticker={research.company.ticker} committee={research.committee} />
                <AnalystBriefingSummary research={research} />
            </section>

            <section id="committee" className="scroll-mt-24">
                <CommitteeAvatarRow committee={research.committee} />
            </section>

            <section id="analysts" className="scroll-mt-24">
                <AnalystLayer research={research} />
            </section>

            <section id="intelligence" className="scroll-mt-24">
                <IntelligenceLayer research={research} />
            </section>

            <section id="operations" className="scroll-mt-24">
                <OperationsLayer research={research} />
            </section>
        </div>
    );
}