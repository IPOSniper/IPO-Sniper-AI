import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
research:ResearchObject;
}

export default function CommitteeSummary({research}:Props){

return(

<WorkstationCard title="Committee">

<pre className="text-xs overflow-auto">

{JSON.stringify(research.committee,null,2)}

</pre>

</WorkstationCard>

);

}
