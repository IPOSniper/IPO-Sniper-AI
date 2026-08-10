interface ConfidenceBarProps{

    confidence:number;

}

export default function ConfidenceBar({

    confidence,

}:ConfidenceBarProps){

    return(

        <div className="space-y-1">

            <div className="flex justify-between text-xs">

                <span>Confidence</span>

                <span>{confidence}%</span>

            </div>

            <div className="h-2 rounded bg-zinc-800 overflow-hidden">

                <div

                    className="h-full bg-emerald-500"

                    style={{

                        width:`${confidence}%`

                    }}

                />

            </div>

        </div>

    );

}
