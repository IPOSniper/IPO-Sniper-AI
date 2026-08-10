interface Props{
    title:string;
    subtitle?:string;
}

export default function SectionHeader({
    title,
    subtitle
}:Props){

    return(

        <div className="mb-4">

            <h2 className="text-xl font-semibold text-white">

                {title}

            </h2>

            {subtitle && (

                <p className="text-sm text-slate-400">

                    {subtitle}

                </p>

            )}

        </div>

    );

}
