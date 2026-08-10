import { ReactNode } from "react";

interface ResearchCardProps{

    title:string;

    source:string;

    children:ReactNode;

}

import SourceBadge from "./SourceBadge";

export default function ResearchCard({

    title,

    source,

    children,

}:ResearchCardProps){

    return(

        <section className="rounded-xl border border-zinc-800 bg-zinc-900 p-5">

            <div className="mb-4 flex items-center justify-between">

                <h2 className="font-semibold text-lg">

                    {title}

                </h2>

                <SourceBadge source={source}/>

            </div>

            {children}

        </section>

    );

}
