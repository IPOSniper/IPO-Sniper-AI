import React from "react";

import CommandBar from "../panels/CommandBar/CommandBar";
import ProcessStepper from "../panels/ProcessStepper/ProcessStepper";
import PriceChart from "../panels/PriceChart/PriceChart";
import ResearchViewport from "../viewport/ResearchViewport";
import ResearchTarget from "../panels/ResearchTarget/ResearchTarget";

import { ResearchObject } from "@/engine/models/ResearchObject";

interface Props {
    research: ResearchObject;
    ticker?: string;
    userId?: string | null;
}

export default function WorkstationShell({ research, ticker }: Props) {

    return (

        <div className="space-y-4 text-white">

            <h1 className="text-2xl font-bold mb-1">Workstation</h1>
            <CommandBar research={research} />
            <PriceChart ticker={research.company.ticker} />
            <ProcessStepper research={research} />

            <div className="mb-4">
                <ResearchTarget defaultTicker={ticker} />
            </div>

            <main>

                

                    <ResearchViewport research={research} />

                

                

                    

                

            </main>

        </div>

    );

}


