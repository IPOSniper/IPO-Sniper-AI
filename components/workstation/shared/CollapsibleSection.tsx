"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";

interface Props {
    title: string;
    defaultOpen?: boolean;
    children: React.ReactNode;
}

/**
 * Generic collapse wrapper for long Workstation sections. Purely
 * presentational -- renders whatever children it's given, doesn't
 * touch or interpret any research data itself.
 */
export default function CollapsibleSection({ title, defaultOpen = false, children }: Props) {
    const [open, setOpen] = useState(defaultOpen);

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-950">
            <button
                type="button"
                onClick={() => setOpen(!open)}
                className="flex w-full items-center justify-between px-4 py-3 text-left"
            >
                <span className="text-sm font-semibold text-zinc-300">{title}</span>
                {open ? <ChevronDown size={16} className="text-zinc-500" /> : <ChevronRight size={16} className="text-zinc-500" />}
            </button>
            {open && <div className="border-t border-zinc-800 p-4 space-y-4">{children}</div>}
        </div>
    );
}