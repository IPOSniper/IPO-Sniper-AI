import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
research:ResearchObject;
}

export default function InvestmentThesis({research}:Props){

return(

<WorkstationCard title="Investment Thesis">

<p>

{research.report.executiveSummary}

</p>

</WorkstationCard>

);

}
