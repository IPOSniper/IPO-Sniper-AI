import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import ResearchProgress from "../panels/ResearchProgress";
import SystemLog from "../panels/SystemLog";
import UpcomingEvents from "../panels/UpcomingEvents";
import SnapshotPanel from "../panels/SnapshotPanel";
import WhatCouldChangeThisPanel from "../panels/WhatCouldChangeThisPanel";
import InsiderActivityPanel from "../panels/InsiderActivityPanel";
import OptionsChainPanel from "../panels/OptionsChainPanel";

export default function OperationsLayer({
research,
}: WorkstationPanelProps){

return(
<section className="space-y-6">
<div className="grid gap-4 sm:grid-cols-2">
<SnapshotPanel research={research} />
<WhatCouldChangeThisPanel research={research} />
</div>
<section id="options" className="scroll-mt-24">
<OptionsChainPanel research={research} />
</section>
<section id="insiders" className="scroll-mt-24">
<InsiderActivityPanel research={research} />
</section>
<ResearchProgress research={research} />
<SystemLog research={research} />
<section id="events" className="scroll-mt-24">
<UpcomingEvents research={research} />
</section>
</section>
);
}
