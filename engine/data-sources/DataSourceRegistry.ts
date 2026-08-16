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

/** Real environment tiers -- distinct from DataPurpose. A source can be permitted for internal-decision use in principle but still restricted to "development" only (this app's actual production deployment is Vercel production, not localhost). */
export type DataEnvironment = "development" | "testing" | "production";

/**
 * Real public/private boundary -- distinct from DataPurpose. A
 * source's DataPurpose says what it's authorized FOR (display vs.
 * decision); visibility says WHO may ever see data derived from it.
 * PUBLIC data may reach /r/[slug] or /education. INTERNAL may reach
 * the authenticated app (Workstation, Hedge Fund) but never an
 * unauthenticated visitor. PRIVATE_QUANT is Quant's own internal
 * reasoning/memory -- never rendered to any UI at all, public or
 * authenticated (decision counts/summaries are fine; raw reasoning
 * artifacts are not). RESTRICTED means don't even let this reach
 * Quant's decision path -- the confirmed-restricted sources (NewsAPI)
 * already can't via DataPurpose, but visibility is a second,
 * independent check, not a redundant one -- a source could
 * theoretically be permitted for internal-decision use but still be
 * too sensitive to ever surface in any UI at all.
 */
export type DataVisibility = "PUBLIC" | "INTERNAL" | "PRIVATE_QUANT" | "RESTRICTED";

export interface DataSourceLicense {
    id: string;
    /** Real, honest status -- "needs-verification" is a legitimate value, not a placeholder to resolve later and forget. */
    status: "confirmed-permitted" | "confirmed-restricted" | "needs-verification";
    /** What this source is actually confirmed/believed permitted for. Empty array if status is confirmed-restricted. */
    permittedPurposes: DataPurpose[];
    /** Which real environments this source may be used in at all -- checked before permittedPurposes even applies. Empty array if status is confirmed-restricted. */
    allowedEnvironments: DataEnvironment[];
    /** Real public/private boundary -- see DataVisibility's own docstring. Independent of permittedPurposes: a source can be internal-decision-authorized but still not PUBLIC-visible. */
    visibility: DataVisibility;
    /**
     * Real, granular authorization flags, distinct from the
     * broader permittedPurposes/allowedEnvironments checks above --
     * these track specific real-world rights a provider's terms may
     * or may not grant, independent of purpose/environment. null
     * means genuinely unknown (needs-verification), not "false" --
     * an unresearched flag should never silently read as a denial
     * OR a grant.
     */
    aiInferenceAllowed: boolean | null;
    storageAllowed: boolean | null;
    redistributionAllowed: boolean | null;
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
        allowedEnvironments: ["development", "testing"],
        visibility: "RESTRICTED",
        aiInferenceAllowed: false,
        storageAllowed: null,
        redistributionAllowed: false,
        notes: "NewsAPI's free Developer plan is for development/testing only and explicitly forbids production use -- confirmed via 3 independent sources this session, including the real $449/month Business tier price required to go live. News Analyst is excluded from every real capital-decision path (Quant Strategist, Batch Scanner) and from every public-facing view (/r/[slug] Share Cards), not just one or the other.",
        lastVerified: "2026-08",
    },
    finnhub: {
        id: "finnhub",
        status: "needs-verification",
        permittedPurposes: ["internal-display"],
        allowedEnvironments: ["development", "testing", "production"],
        visibility: "PUBLIC",
        aiInferenceAllowed: null,
        storageAllowed: null,
        redistributionAllowed: null,
        notes: "A third-party summary (not Finnhub's own official terms page) states the free tier is licensed for 'personal, non-commercial projects' and requires a paid plan 'the moment your app is monetized.' This app isn't currently monetized, but is explicitly being built toward eventual real-capital deployment, and Finnhub powers nearly every feature here including the now-public /r/[slug] and /education pages. allowedEnvironments includes production only because this app already uses Finnhub there today for internal-display -- not a confirmed legal clearance. visibility is PUBLIC reflecting honest current reality (real-time price already shows on public Share Cards and Market Pulse), which is exactly the tension this registry exists to surface, not hide: publicly-shown data whose license status for that use isn't confirmed. Confirm against Finnhub's actual official terms (finnhub.io/pricing / their ToS) before treating this as settled, and definitely before any real-money use.",
        lastVerified: "2026-08",
    },
    secEdgar: {
        id: "secEdgar",
        status: "confirmed-permitted",
        permittedPurposes: ["public-display", "internal-decision", "internal-display"],
        allowedEnvironments: ["development", "testing", "production"],
        visibility: "PUBLIC",
        aiInferenceAllowed: true,
        storageAllowed: true,
        redistributionAllowed: true,
        notes: "SEC EDGAR is public U.S. government data with no licensing restriction on use.",
        lastVerified: "2026-08",
    },
    alpaca: {
        id: "alpaca",
        status: "confirmed-permitted",
        permittedPurposes: ["internal-decision", "internal-display"],
        allowedEnvironments: ["development", "testing", "production"],
        visibility: "INTERNAL",
        aiInferenceAllowed: true,
        storageAllowed: true,
        redistributionAllowed: null,
        notes: "Alpaca's paper trading API and options/quote data are used under this app's own account credentials for its own trading activity -- not a third-party content-licensing situation the same way NewsAPI/Finnhub are. redistributionAllowed left null -- this app doesn't redistribute Alpaca data to third parties, so it's never been specifically checked against Alpaca's terms. visibility is INTERNAL (not PUBLIC) -- account/position/order data is only ever shown inside the authenticated Hedge Fund UI, never on a public page.",
        lastVerified: "2026-08",
    },
    currentsApi: {
        id: "currentsApi",
        status: "needs-verification",
        permittedPurposes: [],
        allowedEnvironments: ["development", "testing"],
        visibility: "INTERNAL",
        aiInferenceAllowed: null,
        storageAllowed: null,
        redistributionAllowed: null,
        notes: "Used elsewhere in this app's evidence pipeline, but its real license terms for production/commercial use haven't been directly researched this session -- flagged for the same real check Finnhub needs, not assumed safe by default. Real paid plans confirmed to start at $99/month, found while researching NewsAPI pricing this round -- useful context for Track B.",
        lastVerified: "2026-08",
    },
};

/**
 * Real, centralized authorization check -- what Track A's proposal
 * calls for: a function other code can call before using a data
 * source for a specific purpose, instead of relying on scattered
 * comments to remember the restriction correctly every time.
 *
 * Defaults to false for any source/purpose/environment not
 * explicitly listed as confirmed-permitted -- "needs-verification"
 * and "confirmed-restricted" both correctly fail closed here.
 *
 * environment defaults to this app's real current NODE_ENV
 * ("production" on the live Vercel deployment, "development"
 * locally) -- callers can override it explicitly (e.g. a real
 * scheduled job that always runs in production) but should not need
 * to most of the time.
 */
export function isDataSourceAuthorized(
    sourceId: string,
    purpose: DataPurpose,
    environment: DataEnvironment = (process.env.NODE_ENV === "production" ? "production" : "development")
): boolean {
    const entry = DATA_SOURCE_REGISTRY[sourceId];
    if (!entry) return false;
    if (entry.status !== "confirmed-permitted") return false;
    if (!entry.allowedEnvironments.includes(environment)) return false;
    return entry.permittedPurposes.includes(purpose);
}

/**
 * Real Public Output Firewall primitive -- the actual enforcement
 * mechanism for "never use UI visibility as security." Meant to be
 * called from a real public-facing server action or page (e.g.
 * /r/[slug]) before including anything derived from a given source
 * in its response -- not from client-side/React code, which is
 * exactly the presentation-layer check this exists to replace.
 *
 * Throws rather than returning a boolean, so a real caller can't
 * accidentally ignore a false return value and serve the data
 * anyway -- a public code path either gets past this or it doesn't
 * run at all.
 */
export function assertPublicSafe(sourceId: string): void {
    const entry = DATA_SOURCE_REGISTRY[sourceId];
    if (!entry || entry.visibility !== "PUBLIC") {
        throw new Error(`Data source "${sourceId}" is not authorized for public output (visibility: ${entry?.visibility ?? "unknown source"}).`);
    }
}
