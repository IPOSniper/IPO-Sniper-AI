import type { ReactNode } from "react";

export function DesignSection({
    eyebrow,
    title,
    action,
    children,
}: {
    eyebrow?: string;
    title: string;
    action?: ReactNode;
    children: ReactNode;
}) {
    return (
        <section className="rounded-lg border border-zinc-800 bg-zinc-950/80 p-3">
            <div className="mb-2 flex items-center justify-between gap-3">
                <div className="min-w-0">
                    {eyebrow && (
                        <div className="text-[9px] font-semibold uppercase tracking-[0.18em] text-zinc-600">
                            {eyebrow}
                        </div>
                    )}
                    <h2 className="text-sm font-semibold text-zinc-200">{title}</h2>
                </div>
                {action}
            </div>
            {children}
        </section>
    );
}

export function Metric({
    label,
    value,
    detail,
    tone = "default",
}: {
    label: string;
    value: ReactNode;
    detail?: ReactNode;
    tone?: "default" | "positive" | "negative" | "warning";
}) {
    const toneClass =
        tone === "positive"
            ? "text-emerald-400"
            : tone === "negative"
              ? "text-red-400"
              : tone === "warning"
                ? "text-amber-400"
                : "text-zinc-100";

    return (
        <div className="min-w-0 rounded-md border border-zinc-800 bg-zinc-900/50 px-2.5 py-2">
            <div className="truncate text-[9px] uppercase tracking-wide text-zinc-600">
                {label}
            </div>
            <div className={`mt-0.5 text-base font-semibold ${toneClass}`}>{value}</div>
            {detail && <div className="mt-0.5 text-[9px] leading-4 text-zinc-600">{detail}</div>}
        </div>
    );
}

export function DataBar({
    value,
    label,
    right,
    tone = "neutral",
}: {
    value: number;
    label?: React.ReactNode;
    right?: React.ReactNode;
    tone?: "positive" | "negative" | "warning" | "neutral";
}) {
    const clamped = Math.max(0, Math.min(100, value));
    const fill =
        tone === "positive"
            ? "bg-emerald-500"
            : tone === "negative"
              ? "bg-red-500"
              : tone === "warning"
                ? "bg-amber-500"
                : "bg-zinc-500";

    return (
        <div className="space-y-1">
            {(label || right) && (
                <div className="flex items-center justify-between gap-2 text-[10px]">
                    <span className="truncate text-zinc-400">{label}</span>
                    <span className="shrink-0 text-zinc-600">{right}</span>
                </div>
            )}
            <div className="h-1.5 overflow-hidden rounded-full bg-zinc-800">
                <div className={`h-full ${fill}`} style={{ width: `${clamped}%` }} />
            </div>
        </div>
    );
}

export function DataTable({
    columns,
    rows,
}: {
    columns: string[];
    rows: React.ReactNode[][];
}) {
    return (
        <div className="overflow-hidden rounded-md border border-zinc-800">
            <div
                className="grid gap-2 border-b border-zinc-800 bg-zinc-900/60 px-2 py-1.5 text-[9px] uppercase tracking-wide text-zinc-600"
                style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
            >
                {columns.map((column) => <div key={column}>{column}</div>)}
            </div>
            {rows.map((row, index) => (
                <div
                    key={index}
                    className="grid gap-2 border-b border-zinc-900 px-2 py-1.5 text-[10px] text-zinc-400 last:border-b-0"
                    style={{ gridTemplateColumns: `repeat(${columns.length}, minmax(0, 1fr))` }}
                >
                    {row.map((cell, cellIndex) => (
                        <div key={cellIndex} className="min-w-0 truncate">{cell}</div>
                    ))}
                </div>
            ))}
        </div>
    );
}

export function EmptyState({
    label = "Data unavailable",
    detail,
}: {
    label?: string;
    detail?: React.ReactNode;
}) {
    return (
        <div className="rounded-md border border-dashed border-zinc-800 bg-zinc-950 px-3 py-3">
            <div className="text-[10px] font-medium text-zinc-500">{label}</div>
            {detail && <div className="mt-1 text-[9px] leading-4 text-zinc-600">{detail}</div>}
        </div>
    );
}
