interface MatterItem {
    icon: string;
    category: string;
    headline: string;
    status: string;
    statusTone: "high" | "med" | "pending";
}

const PLACEHOLDER_ITEMS: MatterItem[] = [
    { icon: "\u{1F680}", category: "IPO", headline: "Awaiting signal", status: "Pending", statusTone: "pending" },
    { icon: "\u{1F4C4}", category: "SEC", headline: "Awaiting signal", status: "Pending", statusTone: "pending" },
    { icon: "\u26A1", category: "Market", headline: "Awaiting signal", status: "Pending", statusTone: "pending" },
    { icon: "\u{1F916}", category: "Quant", headline: "Awaiting signal", status: "Pending", statusTone: "pending" },
];

function toneClass(tone: MatterItem["statusTone"]): string {
    if (tone === "high") return "bg-red-600/20 text-red-300";
    if (tone === "med") return "bg-amber-600/20 text-amber-300";
    return "bg-zinc-800 text-zinc-500";
}

export default function WhatMattersNow() {
    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What Matters Now</p>
                <span className="text-[10px] text-zinc-600">Live -- Layer 2 pending</span>
            </div>
            <div className="divide-y divide-zinc-800 rounded-lg border border-zinc-800 bg-zinc-900">
                {PLACEHOLDER_ITEMS.map(item => (
                    <div key={item.category} className="flex items-center gap-3 px-3 py-2.5">
                        <span className="text-base">{item.icon}</span>
                        <span className="w-16 shrink-0 text-[11px] uppercase tracking-wide text-zinc-500">{item.category}</span>
                        <span className="flex-1 text-sm text-zinc-300">{item.headline}</span>
                        <span className={`rounded px-2 py-0.5 text-[10px] font-medium uppercase ${toneClass(item.statusTone)}`}>
                            {item.status}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}