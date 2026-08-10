interface Props{

    value:number;

}

export default function ProgressBar({

    value

}:Props){

    return(

        <div className="w-full rounded bg-slate-800">

            <div
                className="h-2 rounded bg-cyan-500"
                style={{width:`${value}%`}}
            />

        </div>

    );

}
