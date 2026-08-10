"use client";

interface Props{
    research:any;
}

export default function ResearchInspector({research}:Props){

return(

<div className="space-y-8 p-8">

<h1 className="text-3xl font-bold">
Research Object Inspector
</h1>

<pre className="rounded-xl bg-black text-green-400 p-6 overflow-auto">

{JSON.stringify(research,null,2)}

</pre>

</div>

);

}
