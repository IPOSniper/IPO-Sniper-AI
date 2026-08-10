import { ReactNode } from "react";

interface WorkstationCardProps {
    title: string;
    children: ReactNode;
    className?: string;
    rightContent?: ReactNode;
}

export default function WorkstationCard({
    title,
    children,
    className="",
    rightContent
}:WorkstationCardProps){

    return(

        <section
            className={`rounded-xl border border-slate-800 bg-slate-900 shadow-lg ${className}`}
        >

            <header className="flex items-center justify-between border-b border-slate-800 px-5 py-3">

                <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-300">

                    {title}

                </h2>

                {rightContent}

            </header>

            <div className="p-5">

                {children}

            </div>

        </section>

    );

}
