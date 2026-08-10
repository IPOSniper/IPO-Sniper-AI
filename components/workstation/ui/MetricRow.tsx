interface MetricRowProps{

    label:string;

    value:string | number;

}

export default function MetricRow({

    label,

    value,

}:MetricRowProps){

    return(

        <div className="flex justify-between border-b border-zinc-800 py-2">

            <span className="text-zinc-400">

                {label}

            </span>

            <span className="font-medium">

                {value}

            </span>

        </div>

    );

}
