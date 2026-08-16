/**
 * Real Data Source Registry -- Track A, first piece, of the
 * Real-Time Adaptive Intelligence architecture. Makes every data
 * source's real, known license status explicit and structurally
 * checkable, rather than a convention scattered across comments in
 * different files (which is how NewsAPI's exclusion has been
 * enforced so far this session -- correctly, but ad hoc).
 *
 * This is provider-agnostic infrastructure -- it does NOT itself
 * grant Quant real-time news access. It's the control layer Track B
 * (researching and licensing a real production news/data provider)
 * will plug into once a provider's actual terms are confirmed. Until
 * then, every source below reflects what's REALLY known about it
 * right now, including real uncertainty where it exists -- not
 * optimistic guesses.
 */

export type DataPurpose =
    | "public-display"       // shown on /r/[slug] or /education -- unauthenticated viewers
    | "internal-decision"    // feeds an actual AI Committee analyst or Quant Strategist decision
    | "internal-display";    // shown inside the authenticated app, not used to drive a decision

export interface DataSourceLicense {
    id: string;
    /** Real, honest status -- "needs-verification" is a legitimate value, not a placeholder to resolve later and forget. */
    status: "confirmed-permitted" | "confirmed-restricted" | "needs-verification";
    /** What this source is actually confirmed/believed permitted for. Empty array if status is confirmed-restricted. */
    permittedPurposes: DataPurpose[];
    /** The real, stated reason -- cite what's actually known, not an assumption. */
    notes: string;
    /** When this entry was last actually checked against a real source (search, official docs) -- not when the code was written. */
    lastVerified: string;
}

/**
 * Real registry of every external data source this app actually
 * uses today. Each entry reflects genuine research done this
 * session (or explicitly flags what hasn't been verified yet) --
 * not a blanket assumption that "free tier" means "safe for
 * anything."
 */
export const DATA_SOURCE_REGISTRY: Record<string, DataSourceLicense> = {
    newsapi: {
        id: "newsapi",
        status: "confirmed-restricted",
        permittedPurposes: [],
        notes: "NewsAPI's free Developer plan is for development/testing only and explicitly forbids production use. Confirmed earlier this session -- News Analyst is excluded from every real capital-decision path (Quant Strategist, Batch Scanner) and from every public-facing view (/r/[slug] Share Cards), not just one or the other.",
        lastVerified: "2026-08",
    },
    finnhub: {
        id: "finnhub",
        status: "needs-verification",
        permittedPurposes: ["internal-display"],
        notes: "A third-party summary (not Finnhub's own official terms page) states the free tier is licensed for 'personal, non-commercial projects' and requires a paid plan 'the moment your app is monetized.' This app isn't currently monetized, but is explicitly being built toward eventual real-capital deployment, and Finnhub powers nearly every feature here including the now-public /r/[slug] and /education pages. Marked needs-verification rather than asserting either way -- confirm against Finnhub's actual official terms (finnhub.io/pricing / their ToS) before treating this as settled, and definitely before any real-money use.",
        lastVerified: "2026-08",
    },
    secEdgar: {
        id: "secEdgar",
        status: "confirmed-permitted",
        permittedPurposes: ["public-display", "internal-decision", "internal-display"],
        notes: "SEC EDGAR is public U.S. government data with no licensing restriction on use.",
        lastVerified: "2026-08",
    },
    alpaca: {
        id: "alpaca",
        status: "confirmed-permitted",
        permittedPurposes: ["internal-decision", "internal-display"],
        notes: "Alpaca's paper trading API and options/quote data are used under this app's own account credentials for its own trading activity -- not a third-party content-licensing situation the same way NewsAPI/Finnhub are.",
        lastVerified: "2026-08",
    },
    currentsApi: {
        id: "currentsApi",
        status: "needs-verification",
        permittedPurposes: [],
        notes: "Used elsewhere in this app's evidence pipeline, but its real license terms for production/commercial use haven't been directly researched this session -- flagged for the same real check Finnhub needs, not assumed safe by default.",
        lastVerified: "2026-08",
    },
};

/**
 * Real, centralized authorization check -- what Track A's proposal
 * calls for: a function other code can call before using a data
 * source for a specific purpose, instead of relying on scattered
 * comments to remember the restriction correctly every time.
 *
 * Defaults to false for any source/purpose not explicitly listed as
 * confirmed-permitted for that exact purpose -- "needs-verification"
 * and "confirmed-restricted" both correctly fail closed here.
 */
export function isDataSourceAuthorized(sourceId: string, purpose: DataPurpose): boolean {
    const entry = DATA_SOURCE_REGISTRY[sourceId];
    if (!entry) return false;
    if (entry.status !== "confirmed-permitted") return false;
    return entry.permittedPurposes.includes(purpose);
}
