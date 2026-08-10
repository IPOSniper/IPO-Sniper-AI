interface SourceBadgeProps{
    source:string;
}

export default function SourceBadge({
    source,
}:SourceBadgeProps){

    return(

        <span className="rounded border border-zinc-700 px-2 py-1 text-xs uppercase tracking-wide">

            {source}

        </span>

    );

}
