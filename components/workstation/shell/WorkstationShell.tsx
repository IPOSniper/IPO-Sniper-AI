import React from "react";

import CommandBar from "../panels/CommandBar/CommandBar";
import ProcessStepper from "../panels/ProcessStepper/ProcessStepper";
import PriceChart from "../panels/PriceChart/PriceChart";
import IntelligenceSidebar from "../sidebar/IntelligenceSidebar";
import ResearchViewport from "../viewport/ResearchViewport";
import ResearchTarget from "../panels/ResearchTarget/ResearchTarget";

import { ResearchObject } from "@/engine/models/ResearchObject";

interface Props {
    research: ResearchObject;
    ticker?: string;
}

export default function WorkstationShell({ research, ticker }: Props) {

    return (

        <div className="space-y-4 text-white">

            <CommandBar research={research} />
            <PriceChart ticker={research.company.ticker} />
            <ProcessStepper research={research} />

            <div className="mb-4">
                <ResearchTarget defaultTicker={ticker} />
            </div>

            <main className="grid grid-cols-12 gap-4">

                <section className="col-span-9">

                    <ResearchViewport research={research} />

                </section>

                <aside className="col-span-3">

                    <IntelligenceSidebar research={research} />

                </aside>

            </main>

        </div>

    );

}
