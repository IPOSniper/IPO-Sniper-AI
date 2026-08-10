interface Props{
    percent:number;
}

export default function ProgressRing({
    percent
}:Props){

    return(

        <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-violet-500 text-xl font-bold">

            {percent}%

        </div>

    );

}
