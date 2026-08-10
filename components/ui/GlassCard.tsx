import { ReactNode } from "react";

interface GlassCardProps {
    title: string;
    children?: ReactNode;
    className?: string;
}

export default function GlassCard({
    title,
    children,
    className=""
}: GlassCardProps){

return(

<div className={`rounded-3xl border border-zinc-800 bg-zinc-900/80 backdrop-blur-xl shadow-xl p-6 ${className}`}>

<div className="flex items-center justify-between mb-5">

<h2 className="text-lg font-semibold text-white">
{title}
</h2>

<div className="h-2 w-2 rounded-full bg-green-400 animate-pulse"/>

</div>

{children}

</div>

)

}
