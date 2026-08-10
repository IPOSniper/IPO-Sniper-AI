import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

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
<AIVerdictRow research={research} />
<CommitteeAvatarRow research={research} />
<AnalystLayer research={research} />
<IntelligenceLayer research={research} />
<OperationsLayer research={research} />
</div>
);
}
