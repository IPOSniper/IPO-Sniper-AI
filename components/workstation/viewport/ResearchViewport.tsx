import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import { ResearchSession } from "../session";

export default function ResearchViewport({
 research,
}: WorkstationPanelProps){

return(
<main className="flex flex-col gap-8 h-full overflow-y-auto">
<ResearchSession research={research} />
</main>
);
}
