import MarketPulseSection from "@/components/education/MarketPulseSection";
import { GraduationCap } from "lucide-react";

export default function EducationPage() {
    return (
        <div className="text-white">
            <div className="flex items-center gap-3 mb-1">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-violet-600/20 text-violet-400">
                    <GraduationCap size={18} />
                </div>
                <h1 className="text-2xl font-bold">Market Pulse</h1>
            </div>
            <p className="text-zinc-400 mb-6 max-w-3xl">
                What&apos;s moving markets today, why, and the general concepts investors use to think about it —
                real index/instrument data with an AI explainer layered on top.
            </p>

            <MarketPulseSection />
        </div>
    );
}
