interface Props{
    score:number;
}

export default function ConfidenceMeter({
    score
}:Props){

    return(

        <div>

            <div className="flex justify-between">

                <span>Confidence</span>

                <span>{score}%</span>

            </div>

            <div className="mt-2 h-3 rounded bg-slate-800">

                <div
                    className="h-3 rounded bg-green-500"
                    style={{
                        width:`${score}%`
                    }}
                />

            </div>

        </div>

    );

}
