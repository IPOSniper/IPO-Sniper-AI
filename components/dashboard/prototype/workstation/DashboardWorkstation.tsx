import CompanyHeader from "./panels/CompanyHeader";
import ResearchProgress from "./panels/ResearchProgress";
import ResearchDashboard from "./panels/ResearchDashboard";
import ConvictionPanel from "./panels/ConvictionPanel";
import InvestmentThesis from "./panels/InvestmentThesis";
import CommitteeSummary from "./panels/CommitteeSummary";
import EvidencePanel from "./panels/EvidencePanel";

import { loadResearchObject } from "@/engine/loaders/loadResearchObject";

export default async function DashboardWorkstation() {

    const research = await loadResearchObject("RKLB");

    return (

        <div className="min-h-screen bg-slate-950 text-white">

            <CompanyHeader research={research} />

            <div className="grid grid-cols-12 gap-6">

                <aside className="col-span-2 space-y-6">

                    <ResearchProgress research={research} />

                </aside>

                <main className="col-span-7 rounded-xl border border-slate-800 bg-slate-900 p-6">

                    <InvestmentThesis research={research} />

                    <CommitteeSummary research={research} />

                    <ResearchDashboard research={research} />

                    <EvidencePanel research={research} />

                </main>

                <ConvictionPanel research={research} />

            </div>

        </div>

    );

}













