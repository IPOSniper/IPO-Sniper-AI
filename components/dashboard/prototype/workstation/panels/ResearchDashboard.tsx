import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
    research:ResearchObject;
}

export default function ResearchDashboard({research}:Props){

    return(

        <WorkstationCard title="Research Dashboard">

            <div className="space-y-2">

                <div>
                    Company: {research.company.name}
                </div>

                <div>
                    Recommendation: {research.report.recommendation}
                </div>

                <div>
                    Generated:
                    {" "}
                    {research.runtime.generatedAt.toString()}
                </div>

            </div>

        </WorkstationCard>

    );

}
