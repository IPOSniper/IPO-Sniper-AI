"use client";

export default function PrintButton() {
    return (
        <button
            type="button"
            onClick={() => window.print()}
            className="rounded-lg border border-zinc-700 px-3 py-2 text-xs font-medium text-zinc-300 hover:border-zinc-500 hover:text-white"
        >
            Print / Save as PDF
        </button>
    );
}
