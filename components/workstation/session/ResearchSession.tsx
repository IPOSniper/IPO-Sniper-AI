import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import MissionControlHeader from "../panels/MissionControlHeader";
import ResearchSnapshotPanel from "../panels/ResearchSnapshotPanel";
import AIVerdictRow from "../panels/AIVerdictRow";
import CommitteeAvatarRow from "../panels/CommitteeAvatarRow";
import AnalystLayer from "./AnalystLayer";
import IntelligenceLayer from "./IntelligenceLayer";
import OperationsLayer from "./OperationsLayer";

export default function ResearchSession({
 research,
}: WorkstationPanelProps){

return(
<div className="space-y-8">
<ResearchSnapshotPanel research={research} />
<MissionControlHeader research={research} />
<AIVerdictRow research={research} />
<CommitteeAvatarRow committee={research.committee} />
<AnalystLayer research={research} />
<IntelligenceLayer research={research} />
<OperationsLayer research={research} />
</div>
);
}
