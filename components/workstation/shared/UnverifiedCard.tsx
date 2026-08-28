interface UnverifiedCardProps {
 title: string;
 reason: string;
}

/**
 * The honest-state pattern for this whole UI: instead of a fake
 * "Connected" badge or a hardcoded placeholder number, cards with no
 * real data source render THIS - visually distinct (dashed border,
 * muted) so "we don't know" is never confused with "the answer is
 * zero/empty." Use this instead of inventing a plausible-looking
 * number for anything without a real, verified source.
 */
export default function UnverifiedCard({ title, reason }: UnverifiedCardProps) {
 return (
 <div className="rounded-xl border border-dashed border-zinc-700 bg-zinc-900/30 p-4">
 <div className="mb-1 flex items-center gap-2">
 <span className="h-1.5 w-1.5 rounded-full bg-zinc-600" />
 <h3 className="text-sm font-medium text-zinc-500">{title}</h3>
 </div>
 <p className="text-xs text-zinc-600">{reason}</p>
 </div>
 );
}
