import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import ResearchProgress from "../panels/ResearchProgress";
import SystemLog from "../panels/SystemLog";
import UpcomingEvents from "../panels/UpcomingEvents";
import SnapshotPanel from "../panels/SnapshotPanel";
import WhatCouldChangeThisPanel from "../panels/WhatCouldChangeThisPanel";

export default function OperationsLayer({
research,
}: WorkstationPanelProps){

return(
<section className="space-y-6">
<div className="grid gap-4 sm:grid-cols-2">
<SnapshotPanel research={research} />
<WhatCouldChangeThisPanel research={research} />
</div>
<ResearchProgress research={research} />
<SystemLog research={research} />
<UpcomingEvents research={research} />
</section>
);
}
