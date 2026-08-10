interface Props{

title:string

subtitle?:string

}

export default function SectionHeader({

title,

subtitle

}:Props){

return(

<div className="mb-6">

<h2 className="text-xl font-semibold">

{title}

</h2>

{subtitle && (

<p className="text-zinc-500 mt-1">

{subtitle}

</p>

)}

</div>

)

}
