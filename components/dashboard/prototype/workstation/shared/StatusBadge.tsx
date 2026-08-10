interface Props{

    label:string;

}

export default function StatusBadge({

    label

}:Props){

    return(

        <span className="rounded bg-blue-600 px-2 py-1 text-xs font-medium">

            {label}

        </span>

    );

}
