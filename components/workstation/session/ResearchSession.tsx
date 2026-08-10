import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import AnalystLayer from "./AnalystLayer";
import IntelligenceLayer from "./IntelligenceLayer";
import OperationsLayer from "./OperationsLayer";

export default function ResearchSession({
    research,
}: WorkstationPanelProps){

return(
<div className="space-y-8">
<AnalystLayer research={research} />
<IntelligenceLayer research={research} />
<OperationsLayer research={research} />
</div>
);
}
