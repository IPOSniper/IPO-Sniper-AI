interface Props{
    label:string;
    color?:"green"|"yellow"|"red"|"blue";
}

export default function StatusBadge({
    label,
    color="green"
}:Props){

    const colors={
        green:"bg-green-500",
        yellow:"bg-yellow-500",
        red:"bg-red-500",
        blue:"bg-blue-500"
    };

    return(
        <div className="flex items-center gap-2">

            <div className={`h-2 w-2 rounded-full ${colors[color]}`} />

            <span className="text-xs text-slate-300">

                {label}

            </span>

        </div>
    );

}
