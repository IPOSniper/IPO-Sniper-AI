import WorkstationCard from "../shared/WorkstationCard";
import type { ResearchObject } from "@/engine/models/ResearchObject";

interface Props{
    research:ResearchObject;
}

export default function CompanyHeader({research}:Props){

    return(

        <WorkstationCard title="Company">

            <div className="flex justify-between">

                <div>

                    <h1 className="text-2xl font-bold">

                        {research.company.name}

                    </h1>

                    <p className="text-slate-400">

                        {research.company.ticker}

                    </p>

                </div>

                <div className="text-right">

                    <div>

                        Conviction {research.conviction.score}

                    </div>

                    <div>

                        Confidence {research.confidence}

                    </div>

                </div>

            </div>

        </WorkstationCard>

    );

}
