interface ScoreBadgeProps{
    score:number;
}

export default function ScoreBadge({
    score,
}:ScoreBadgeProps){

    const color =
        score >= 80 ? "bg-green-600" :
        score >= 60 ? "bg-yellow-600" :
        "bg-red-600";

    return(

        <span
            className={`rounded px-2 py-1 text-xs font-bold text-white ${color}`}
        >
            {score}
        </span>

    );

}
