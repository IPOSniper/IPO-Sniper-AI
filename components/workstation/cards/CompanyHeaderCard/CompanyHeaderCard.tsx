import { WorkstationPanelProps } from "../../contracts/WorkstationPanelProps";

export default function CompanyHeaderCard({research}:WorkstationPanelProps){

    return(

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5 shadow">

            <div className="flex items-center justify-between mb-3">

                <h2 className="font-semibold text-lg">

                    CompanyHeader

                </h2>

                <span className="rounded bg-zinc-800 px-2 py-1 text-xs">

                    AI

                </span>

            </div>

            <div className="text-zinc-400 text-sm">

                TODO

            </div>

        </section>

    );

}
