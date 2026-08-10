import Image from "next/image";
import { WorkstationPanelProps } from "../contracts/WorkstationPanelProps";

/**
 * Final revision of the committee-avatar decision: real submitted
 * photos, cropped from the provided committee board image, used as
 * the avatar -- but the fictional human names (Lina Park, Sarah
 * Miller, etc.) are never rendered anywhere. Only "AI [Role]" is
 * shown, matching each real analyst's actual function in
 * committee.reports. This is the specific instruction: use the
 * submitted avatars, omit the names, use the job description as the
 * representation instead.
 *
 * The prominent "not real people" disclosure stays -- a real photo
 * next to only a role label (no name) is closer to a stock-photo
 * illustration convention (like a generic "customer support"
 * icon using a photo) than to presenting an individual identity, but
 * the disclosure is what actually removes the ambiguity, not the
 * absence of a name alone. Keeping it is not optional.
 *
 * There are 12 available photos (one board member, "Founder &
 * Chairman", was excluded -- that role isn't an AI analyst persona
 * at all). committee.reports can have more or fewer real analysts
 * than 12, so photos are assigned deterministically by a hash of the
 * real analyst name -- stable across reloads, not random, and cycles
 * through the available 12 if there are more analysts than photos.
 */

const PHOTOS = [
    "lina", "sarah", "jasmine", "priya", "marcus_j", "donald",
    "arjun", "chris", "kenji", "declan", "olivia", "ethan", "mei",
];

const GRADIENTS = [
    "from-violet-600 to-indigo-700",
    "from-blue-600 to-cyan-700",
    "from-emerald-600 to-teal-700",
    "from-amber-600 to-orange-700",
    "from-rose-600 to-pink-700",
    "from-fuchsia-600 to-purple-700",
    "from-sky-600 to-blue-700",
];

/**
 * Guaranteed-unique photo assignment, not hash-based -- a hash-mod
 * assignment can (and did) collide once analyst count exceeded the
 * 12-photo pool, showing the same face for two different analysts.
 * This sorts analysts into a stable order (alphabetical by name, so
 * it's deterministic across reloads without depending on
 * committee.reports' array order) and assigns each a DIFFERENT photo
 * by index. Once the 13-photo pool is exhausted, remaining analysts
 * fall back to a gradient-initials avatar instead of reusing a face
 * -- two different analysts must never show the same person.
 */
function buildPhotoAssignments(analystNames: string[]): Map<string, string | null> {
    const sorted = [...analystNames].sort();
    const map = new Map<string, string | null>();
    sorted.forEach((name, i) => {
        map.set(name, i < PHOTOS.length ? `/committee/${PHOTOS[i]}.png` : null);
    });
    return map;
}

function gradientFor(name: string): string {
    let hash = 0;
    for (let i = 0; i < name.length; i++) hash = (hash * 31 + name.charCodeAt(i)) >>> 0;
    return GRADIENTS[hash % GRADIENTS.length];
}

const RECOMMENDATION_COLOR: Record<string, string> = {
    STRONG_BUY: "#16D47B",
    BUY: "#16D47B",
    HOLD: "#8A8FA3",
    REDUCE: "#F04452",
    SELL: "#F04452",
};

const RECOMMENDATION_LABEL: Record<string, string> = {
    STRONG_BUY: "STRONG BUY",
    BUY: "BUY",
    HOLD: "HOLD",
    REDUCE: "REDUCE",
    SELL: "SELL",
};

export default function CommitteeAvatarRow({ research }: WorkstationPanelProps) {
    const { committee } = research;
    const votingAnalysts = committee.reports.filter(r => r.confidence > 0);
    const photoAssignments = buildPhotoAssignments(committee.reports.map(r => r.analyst));

    const buyCount = votingAnalysts.filter(r => r.recommendation === "STRONG_BUY" || r.recommendation === "BUY").length;
    const sellCount = votingAnalysts.filter(r => r.recommendation === "REDUCE" || r.recommendation === "SELL").length;
    const holdCount = votingAnalysts.length - buyCount - sellCount;
    const total = votingAnalysts.length || 1;

    return (
        <div className="rounded-lg border border-zinc-800 bg-zinc-900 p-4">
            <div className="mb-2 flex items-center justify-between">
                <h2 className="text-sm font-semibold text-zinc-300">AI Analyst Committee</h2>
                <span className="text-xs text-emerald-400">Live</span>
            </div>

            <p className="mb-4 rounded-md border border-violet-900/40 bg-violet-950/20 px-3 py-1.5 text-xs text-violet-300">
                These are AI analyst personas, not real people — each represents a specialized research process that contributes evidence to the committee&apos;s recommendation.
            </p>

            <div className="mb-4 flex flex-wrap gap-4">
                {committee.reports.map(report => {
                    const hasOpinion = report.confidence > 0;
                    const color = hasOpinion ? (RECOMMENDATION_COLOR[report.recommendation] ?? "#8A8FA3") : "#3F3F46";
                    const photoSrc = photoAssignments.get(report.analyst) ?? null;
                    return (
                        <div key={report.analyst} className="flex w-24 flex-col items-center text-center">
                            <div
                                className="relative h-14 w-14 overflow-hidden rounded-full border-2"
                                style={{ borderColor: color, opacity: hasOpinion ? 1 : 0.4 }}
                            >
                                {photoSrc ? (
                                    <Image
                                        src={photoSrc}
                                        alt={`AI ${report.analyst}`}
                                        fill
                                        sizes="56px"
                                        className="object-cover"
                                    />
                                ) : (
                                    <div className={`flex h-full w-full items-center justify-center bg-gradient-to-br ${gradientFor(report.analyst)}`}>
                                        <span className="text-xs font-bold text-white">
                                            {report.analyst.split(" ")[0].slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                            </div>
                            {/* Only "AI [Role]" — the underlying photo's fictional
                                human name is never rendered. */}
                            <span className="mt-1.5 text-[10px] font-medium leading-tight text-zinc-300">
                                AI {report.analyst}
                            </span>
                            <span
                                className="mt-0.5 text-[10px] font-semibold"
                                style={{ color: hasOpinion ? color : "#52525b" }}
                            >
                                {hasOpinion ? RECOMMENDATION_LABEL[report.recommendation] ?? report.recommendation : "NO DATA"}
                            </span>
                        </div>
                    );
                })}
            </div>

            <div className="flex h-2 w-full overflow-hidden rounded-full bg-zinc-800">
                {buyCount > 0 && <div className="h-full bg-emerald-500" style={{ width: `${(buyCount / total) * 100}%` }} />}
                {holdCount > 0 && <div className="h-full bg-zinc-600" style={{ width: `${(holdCount / total) * 100}%` }} />}
                {sellCount > 0 && <div className="h-full bg-red-500" style={{ width: `${(sellCount / total) * 100}%` }} />}
            </div>
            <div className="mt-1.5 flex justify-between text-[10px] text-zinc-500">
                <span>{buyCount} buy-leaning</span>
                <span>{holdCount} hold</span>
                <span>{sellCount} sell-leaning</span>
            </div>

            <div className="mt-3 flex items-center justify-between border-t border-zinc-800 pt-3 text-xs">
                <span className="text-zinc-500">Committee vote</span>
                <span className="font-semibold text-white">
                    {RECOMMENDATION_LABEL[committee.recommendation] ?? committee.recommendation} · {committee.confidence}% confidence
                </span>
            </div>
        </div>
    );
}
