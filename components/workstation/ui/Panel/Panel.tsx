interface PanelProps {

    title: string;

    children: React.ReactNode;

    className?: string;

}

export default function Panel({

    title,

    children,

    className = ""

}: PanelProps) {

    return (

        <section
            className={`rounded-xl border border-slate-800 bg-slate-950 shadow-sm ${className}`}
        >

            <div className="border-b border-slate-800 px-4 py-3">

                <h2 className="font-semibold text-slate-100">

                    {title}

                </h2>

            </div>

            <div className="p-4">

                {children}

            </div>

        </section>

    );

}
