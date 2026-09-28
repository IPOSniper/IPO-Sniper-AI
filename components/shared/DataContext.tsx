import type { ReactNode } from "react";

export interface ExplainerContent {
    /** What this number or panel actually is, in plain English. */
    meaning: string;
    /** Why it matters to everyday people or the wider economy (general, not a prediction). */
    whyItMatters: string;
    /** Direct and indirect factors that tend to move this number or data pool. */
    influences: string[];
    /** Optional honest limitation, e.g. why the data may be empty or thin. */
    caveat?: string;
}

/**
 * Reusable "what this means" dropdown. Uses a native details element so it
 * works in server components with no client JavaScript. Panels whose data
 * pool is empty can pass defaultOpen so the honest "why" is visible
 * without a click. Content is general educational context only.
 */
export default function DataContext({
    content,
    title = "What this means",
    defaultOpen = false,
    children,
}: {
    content: ExplainerContent;
    title?: string;
    defaultOpen?: boolean;
    children?: ReactNode;
}) {
    return (
        <details open={defaultOpen} className="mt-2 rounded-md border border-zinc-800/80 bg-black/20 text-xs">
            <summary className="cursor-pointer select-none px-3 py-1.5 text-zinc-400 hover:text-zinc-200">
                {title}
            </summary>
            <div className="space-y-2 border-t border-zinc-800/80 px-3 py-2 text-zinc-400">
                <p>
                    <span className="font-semibold text-zinc-300">What it is. </span>
                    {content.meaning}
                </p>
                <p>
                    <span className="font-semibold text-zinc-300">Why it matters. </span>
                    {content.whyItMatters}
                </p>
                <div>
                    <p className="font-semibold text-zinc-300">What can influence it</p>
                    <ul className="mt-1 list-disc space-y-0.5 pl-4">
                        {content.influences.map(item => (
                            <li key={item}>{item}</li>
                        ))}
                    </ul>
                </div>
                {content.caveat && <p className="text-zinc-500">{content.caveat}</p>}
                {children}
                <p className="text-[10px] text-zinc-600">
                    General educational context - not a prediction, and not advice about any security.
                </p>
            </div>
        </details>
    );
}