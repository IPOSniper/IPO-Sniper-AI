import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
research:ResearchObject;
}

export default function ResearchProgress({research}:Props){

return(

<WorkstationCard title="Research Progress">

<ul className="space-y-2">

{research.runtime.completedStages.map(stage=>

<li key={stage}>

? {stage}

</li>

)}

</ul>

</WorkstationCard>

);

}
