const PLACEHOLDER_ITEMS = [
    { icon: "\u{1F680}", label: "IPO", text: "No signal yet" },
    { icon: "\u{1F4C4}", label: "SEC", text: "No signal yet" },
    { icon: "\u26A1", label: "Market", text: "No signal yet" },
    { icon: "\u{1F916}", label: "Quant", text: "No signal yet" },
];

export default function WhatMattersNow() {
    return (
        <div className="mb-4">
            <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">What Matters Now</p>
                <span className="text-[10px] text-zinc-600">Live -- Layer 2 pending</span>
            </div>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
                {PLACEHOLDER_ITEMS.map(item => (
                    <div key={item.label} className="rounded-lg border border-zinc-800 bg-zinc-900 p-3">
                        <p className="text-xs text-zinc-500">{item.icon} {item.label}</p>
                        <p className="mt-1 text-sm text-zinc-400">{item.text}</p>
                    </div>
                ))}
            </div>
        </div>
    );
}