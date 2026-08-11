# Migration Matrix

Master checklist. Every migration into this repository is recorded here —
source, destination, owner, status, and whether it's been validated. The
question is never "which folder has the newest version" — it's "has
capability X been migrated, and did it clear the three gates in
`IPO_SNIPER_OS.md`."

Status values: **Native** (already lives here, not a migration — still
needs the Release Readiness Review's status, see the relevant row),
**Pending** (not yet migrated), **In Progress**, **Migrated**, **Review**
(migrated or native, needs validation before it counts as done).

| Capability | Source | Destination | Owner | Status | Validation |
|---|---|---|---|---|---|
| Workstation | Original App | Core | Core | Native | Required — Release Readiness Review |
| AI Committee | Original App | Executive Layer | Core | Native | Required — audit per §"AI Committee" in the review (are votes real, is confidence evidence-backed, any decorative members) |
| Committee UI (avatars) | Original App | Executive Layer | Core | Review | Confirm abstract-icon pattern already matches the no-photorealistic-portraits decision |
| ShareCard | Original App | Core | Core | Migrated | Extended to match `institutional_research_card.html` — facts grid, evidence quality, bull/bear case (real per-analyst thesis text), probability chips (when `investmentDecision` exists). 12-month target price and time-horizon text NOT included — no real field computes either; would have been fabricated. Needs a real render check. |
| Pre-earnings share card | Original App | Market Intelligence | Core | Migrated | New `EarningsPreviewShareCard` + button, reusing `EarningsPreviewPanel`'s existing real API/types. Real countdown added (days-until-report, computed). Options-implied move / IV rank from the mockup NOT included — no options data source exists anywhere in this codebase. Needs a real render check. |
| Market Pulse share-image card (`/api/education/share-image`) | Original App | Market Intelligence | Core | Migrated | Re-skinned to match `share_card_v2.html` — real Finnhub data throughout, no fabricated "root cause"/"winners" narrative (deliberately replaced with real best/worst-performer numbers, since the AI-free edge route can't honestly generate that commentary). Needs a real render check — `npm run dev` and load `/api/education/share-image` directly in a browser. |
| Institutional Research / Hedge Fund page | Original App | Portfolio Management | Core | Review | Needs the regulatory-naming decision resolved (see `IPO_SNIPER_OS.md`) before Migrated |
| Market Pulse full-page redesign | `market_pulse_exact_replica.html` mockup | Market Intelligence | Core | Migrated (partial, honest scope) | Added: sentiment gauge and market breadth (both computed from the 7 quotes already fetched, zero new API calls), a real concept glossary (6 static definitions), real internal "Related Reading" links. Deliberately NOT added — no real data source exists for any of them: sector performance bars (no per-sector feed wired in), winners/losers stock movers (no market-movers/screener endpoint), 30-day trend chart (Finnhub candle access is plan-restricted, confirmed earlier this session), and a specific-event economic calendar (this app only has a per-ticker earnings calendar, not a general FOMC/jobs-report calendar). Needs a real render check. |
| Live header (real-time market status pill, `lib/marketHours.ts`) | Infrastructure branch | Market Intelligence / UI | Core | Pending | Required |
| Alpaca paper trading (`engine/trading/`, live panel on `/hedge-fund`) | Infrastructure branch | Trading Desk | Trading | Migrated | Moved into the main `/hedge-fund` page directly (not a hidden sub-page) with real auto-refresh (real re-fetch every 20s, not decoration). Added `SystemStatusPanel` — an honest live/not-built status per conceptual pipeline stage, replacing the mockup's simulated "Running" animation/scrolling log, since no scheduler exists to make that real yet. Still never run against a live Alpaca account from this sandbox — needs a real local test. |
| Similarity Engine | Quant Lab | Quant Research Lab | Quant | Pending | Required |
| Regime Signal | Quant Lab | Quant Research Lab | Quant | Pending | Required — currently a single-factor SPY classifier, v1 only |
| Experiment Registry (`ExperimentRecorder`, `experiments` table + migrations) | Quant Lab | Quant Research Lab | Quant | Pending | Required |
| IntradayOptionsLedger + BlackScholes | Quant Lab | Quant Research Lab | Quant | Pending | Required — models near-0DTE option behavior, not standard monthly options, see engine's own docs |
| Paired-comparison framework (seeded RNG, delta stats) | Quant Lab | Quant Research Lab | Quant | Pending | Required |
| Workstation navy/violet color consistency | Original App | Core | Core | Migrated | Fixed 8 files with leftover cyan/blue accents from the earlier mass retheme script that missed them (`CommandBar`, `NewsRail`, `UpcomingEarnings`, `CatalystPanel`, `ResearchTarget`, `PublishReportButton`, `EarningsPreviewPanel`, `ProgressRing`). `StatusBadge`'s `color="blue"` option deliberately left alone — it's a distinct semantic status color a caller picks, not primary-accent debris, and changing it risks altering meaning for whatever calls it with `color="blue"`. |
| Workstation mission-control structural redesign (AI committee avatar grid, evidence terminal, sector performance widgets, institutional flow chart, breadcrumb, live header pill inside the shell) | Infrastructure branch (header pill) / `workstation_merged_navy.html` (the rest) | Core | Core | **Partial — Group A items landing** | `AIVerdictRow`, `CommitteeAvatarRow` (now 15/15 real photos, zero Bot-icon fallback needed), `MissionControlHeader`, `AnalystWorkspace`, `SnapshotPanel` (market cap + shares outstanding only — no real volume/beta/52w-range data source exists), `WhatCouldChangeThisPanel` (real catalysts + real risks) all landed. Sidebar shrunk `w-64`→`w-20` (icon-only, ~69% width reduction) to free real space for these. Deliberately NOT built from the mockup: Sector performance, Institutional flow (5d), Options pricing ("What are options traders pricing in?" — no options data source anywhere in this codebase), the "How did the AI get here" pipeline visualization, the scrolling "AI research terminal" log, and the "Live research time" countdown — the last three all imply continuous live processing that doesn't exist (research runs once per request, not continuously). |

## Not yet started

- `ValidatedStrategy` contract — not implemented anywhere, blocks the Lab → Trading Desk handoff
- `TradeOutcome` contract — not implemented anywhere, blocks the learning loop back to Memory
- `Strategy` / `StrategyRegistry` — not implemented, the Experiment/Strategy lifecycle split has no code yet
- Production scheduler (Vercel Cron / Supabase Scheduled Function) — still Windows Task + `localhost` only

## News data sourcing (added this session)

Real, verified finding: NewsAPI.org's free Developer tier has a documented 24-hour article delay, forbids commercial use, and restricts CORS to localhost only. Confirmed live via a real breaking story (RIOT/Anthropic deal, Aug 10 2026) not appearing in this app's feed for hours after major outlets had it.

Added `CurrentsAPIProvider.ts` as a second source, merged with NewsAPI.org's results in `NewsBuilder.ts` (deduplicated by URL, sorted by real publish date, each provider allowed to fail independently). **Before relying on this commercially**: Currents' own documentation states their free tier is for "development, open-source, and non-commercial use" — several third-party blog posts claim otherwise but are contradicted by Currents' own first-party docs. Confirm commercial terms directly with Currents, or budget for their Builder plan ($69/mo), before this is used for real public-facing content.

## Other data source research (this session)

- **Finnhub `/stock/metric?metric=all`** — already confirmed accessible on this account (used by `FinnhubFinancialProvider.ts`). Extended `SnapshotPanel.tsx` to also pull real beta, 52-week range, and 10-day average volume from it — NOT yet live-tested; confirm the exact field names (`beta`, `52WeekHigh`, `52WeekLow`, `10DayAverageTradingVolume`) match a real response the first time this runs.
- **SEC Form 4 (insider trading)** — new `SECForm4Provider.ts`, built on the existing `SECEdgarProvider.ts` foundation (CIK lookup + filing history already worked). Parses real Form 4 XML for real insider buy/sell/grant transactions. Zero commercial-use ambiguity — this is U.S. government public data. NOT yet live-tested; the XML tag-name regex needs verification against a real filing's actual XML the first time it runs.
- **FRED (Federal Reserve Economic Data)** — read FRED's actual, complete Terms of Use directly (not a summary). Real finding: unlike NewsAPI.org/Currents, FRED does **not** broadly forbid commercial use. The real restriction is narrower — specific series marked "Copyright" in their notes (third-party-sourced data) need separate permission beyond personal use; core Fed/BLS/Treasury-originated series (unemployment, GDP, CPI, Fed funds rate, 10Y yield) are U.S. government data, not third-party copyrighted. A real, required attribution notice applies: *"This product uses the FRED® API but is not endorsed or certified by the Federal Reserve Bank of St. Louis."* Not yet built — a real macro-calendar panel using core series is a good next step.

## Share Card QR code + second format (added this session)

Real `qrcode` npm library added (not a hand-rolled encoder — QR encoding has real failure modes, like a code that renders but doesn't scan, that can't be caught without live testing). QR links to `${NEXT_PUBLIC_SITE_URL}/research/{ticker}` — **omitted entirely** when `NEXT_PUBLIC_SITE_URL` isn't configured, since a QR pointing at localhost or nothing would be worse than no QR at all. This env var needs setting once the app has a real public domain.

Second format added: `ShareCardCompact.tsx`, a genuinely separate ~600px-wide component (not a conditional inside the full card) with only the essentials — hero recommendation, price, committee avatars, evidence gauge, top bull/bear line, QR. `ShareCardButton.tsx` now offers both formats as separate buttons.
