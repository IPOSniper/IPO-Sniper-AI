interface Props{

    score:number;

}

export default function ScoreGauge({

    score

}:Props){

    const color=

        score>=80
            ? "text-green-400"
        :score>=60
            ? "text-yellow-400"
            :"text-red-400";

    return(

        <div className="flex items-center justify-center">

            <div className={`text-5xl font-bold ${color}`}>

                {score}

            </div>

        </div>

    );

}
