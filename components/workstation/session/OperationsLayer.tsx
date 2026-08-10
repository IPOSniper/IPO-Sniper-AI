import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import ResearchProgress from "../panels/ResearchProgress";
import SystemLog from "../panels/SystemLog";
import UpcomingEvents from "../panels/UpcomingEvents";

export default function OperationsLayer({
research,
}: WorkstationPanelProps){

return(
<section className="space-y-6">
<ResearchProgress research={research} />
<SystemLog research={research} />
<UpcomingEvents research={research} />
</section>
);
}
