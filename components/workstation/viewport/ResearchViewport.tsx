import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

import { ResearchSession } from "../session";

export default function ResearchViewport({
 research,
 userId,
}: WorkstationPanelProps & { userId?: string | null }){

return(
<main className="flex flex-col gap-8">
<ResearchSession research={research} userId={userId} />
</main>
);
}