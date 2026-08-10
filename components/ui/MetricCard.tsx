interface MetricCardProps{

title:string

value:string

change?:string

}

export default function MetricCard({

title,

value,

change

}:MetricCardProps){

return(

<div className="rounded-2xl border border-zinc-800 bg-zinc-950 p-5">

<p className="text-zinc-500 text-sm">
{title}
</p>

<h1 className="text-3xl font-bold mt-2">
{value}
</h1>

{change && (

<p className="text-green-400 mt-2">

{change}

</p>

)}

</div>

)

}
