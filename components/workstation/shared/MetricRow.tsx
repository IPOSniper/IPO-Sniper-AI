export function MetricRow({ label, value, status }: { label: string; value: string; status?: string }) {
    return (
        <div className="flex items-center justify-between py-1 text-xs">
            <span className="text-zinc-500">{label}</span>
            <span className="text-zinc-200">{value}{status && <span className="ml-2 text-[10px] text-zinc-600">{status}</span>}</span>
        </div>
    );
}
