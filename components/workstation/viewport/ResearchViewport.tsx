import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import { ResearchSession } from "../session";

export default function ResearchViewport({
 research,
}: WorkstationPanelProps){

return(
<main className="flex flex-col gap-8">
<ResearchSession research={research} />
</main>
);
}
