interface MetricCardProps {

    label: string;

    value: string | number;

}

export default function MetricCard({

    label,

    value

}: MetricCardProps) {

    return (

        <div className="rounded-lg border border-slate-800 bg-slate-900 p-4">

            <div className="text-xs uppercase tracking-wide text-slate-400">

                {label}

            </div>

            <div className="mt-2 text-2xl font-bold text-white">

                {value}

            </div>

        </div>

    );

}
