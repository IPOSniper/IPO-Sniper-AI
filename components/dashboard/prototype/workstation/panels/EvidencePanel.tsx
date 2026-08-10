import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
research:ResearchObject;
}

export default function EvidencePanel({research}:Props){

return(

<WorkstationCard title="Evidence">

<pre className="text-xs overflow-auto">

{JSON.stringify(research.report.evidence,null,2)}

</pre>

</WorkstationCard>

);

}
