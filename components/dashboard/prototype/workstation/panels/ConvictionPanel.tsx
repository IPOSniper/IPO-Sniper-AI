import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
research:ResearchObject;
}

export default function ConvictionPanel({research}:Props){

return(

<WorkstationCard title="Conviction">

<div className="text-5xl font-bold">

{research.conviction.score}

</div>

</WorkstationCard>

);

}
