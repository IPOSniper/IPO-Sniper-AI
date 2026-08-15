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

## Options data (added this session — foundation only)

Real finding: Alpaca (already integrated for paper trading) has a real, documented options chain endpoint (`data.alpaca.markets/v1beta1/options/snapshots/{symbol}`) — strikes, expirations, bid/ask, implied volatility, and Greeks, using the SAME `ALPACA_API_KEY_ID`/`ALPACA_SECRET_KEY` already configured. No new vendor, no new key.

Built `AlpacaOptionsProvider.ts` + `OptionsChainPanel.tsx` (real near-the-money call/put for the nearest expiration, wired into the research page's Operations section) — NOT yet live-tested, field names need confirming against a real response.

**This is the data foundation only.** The broader "Adaptive Options Engine" proposal (Price Probability Engine, Volatility Engine, Options Valuation Engine, Strategy Engine, a real Learning Engine comparing predictions to stored trade outcomes, Model Governance) is a real, much larger body of work this does NOT build — it makes that work *possible*, since real options data now exists in this codebase, but every layer above raw data access is unbuilt.

## Options order execution (added this session)

Real finding: options orders go through the SAME Alpaca `/v2/orders` endpoint as equity orders — just with an OCC-format contract symbol instead of a plain ticker. Paper accounts have options trading enabled by default (confirmed via Alpaca's own docs). No new endpoint needed.

Extended `TradeOrderRequest` with `assetType: "equity" | "option"`. **Real correctness fix in `RiskEngine.ts`**: options contracts represent 100 shares of exposure each — every dollar-value calculation now multiplies by `OPTIONS_CONTRACT_MULTIPLIER` (100) when `assetType === "option"`, or every risk check would have silently understated real options risk by 100x. `actions.ts`'s `placeOrder` now routes price lookup correctly — Finnhub for equities, the specific option contract's real bid/ask via `AlpacaOptionsProvider` for options (Finnhub's `/quote` doesn't understand OCC symbols). UI (`PaperTradingPanel.tsx`) got an Asset Type toggle.

NOT yet live-tested. Also NOT built: a contract picker wired to the real `OptionsChainPanel` data — the contract symbol is currently a manually-typed text field, not a dropdown of real available contracts. A real, worthwhile next refinement.

## Quant Strategist — Phase 1 of the private Quant roadmap (added this session)

New `engine/quant/QuantStrategist.ts` + `QuantStrategistPanel.tsx`, wired onto the private (`hedge_admin`/`admin`-gated) Hedge Fund page. Deliberately scoped: real committee data → direction (call/put/none) + real committee confidence + real reasoning (from actual analyst theses) → standard, well-established options-trading risk parameters (35-45 DTE, 0.30-0.40 delta, 25% profit target, 40% stop loss). **No contract is selected** — that's Phase 2, explicitly deferred, per direct instruction ("no OCC symbol, no strike, no expiration, just the strategy").

Honesty discipline maintained: the DTE/delta/profit/stop numbers are clearly labeled as standard conventions, not AI-optimized-for-this-ticker values — no fabricated "strategy confidence" score exists separate from the real committee confidence. Reuses the exact same `ResearchService`/Committee pipeline as every other page — no duplicate research logic for Quant.

Phases 2-6 from the roadmap (Contract Selection Engine, Risk Committee approval flow, Execution Engine, Position Monitor, Learning Engine) are NOT built — Phase 1 only.

## Quant Strategist Phase 2: real contract selection + execution (added this session)

Extended Phase 1 (trade plan) with real contract matching: `QuantStrategist.selectContract()` filters the real live Alpaca chain to contracts matching the plan's real target DTE/delta ranges, picks the closest-to-midpoint match, returns `null` (not a guess) if nothing real qualifies. `suggestQuantity()` derives a starting quantity from real account equity × the plan's standard risk %. `executeTradePlan()` reuses the EXACT SAME `placeOrder`/RiskEngine path the manual order form uses — RiskEngine's real, portfolio-specific check remains the final authority regardless of what Quant suggests. One explicit click required; nothing auto-executes.

Also fixed in this round: `PortfolioRiskPanel` was analyzing only the manual "Research-Based Positions" list — real Alpaca positions (with real P/L) never had portfolio risk calculated against them. Now combines both real sources.

Still not built: Phase 3 (Risk Committee approval shown before execution, distinct from RiskEngine's order-time check), Phase 4 (fully automated execution pipeline), Phase 5 (live position monitoring — Greeks, thesis-still-valid checks), Phase 6 (trade outcome storage / Learning Engine), and a real deployed scheduler.

## Quant Memory — real decision logging, no learning logic yet (added this session)

Per direct instruction: "build IPO Sniper Quant Memory before Quant Intelligence" and "learning = collecting evidence... early on, do a lot of the first and very little of the second." New `quant_trade_decisions` Supabase table (migration `20260812000000_quant_trade_decisions.sql`) logs every real trade-plan decision — direction, committee confidence/agreement/evidence quality, the real decision checks, standard params used, and the selected contract snapshot, when one was found. **"No Trade" decisions are logged too**, not just executed trades — capturing why Quant declined is exactly the point.

Links to the resulting order via `broker_order_id` (not an internal foreign key, to avoid touching the existing `paper_trade_orders` insert path) when the user clicks Execute.

**Deliberately does NOT include**: outcome data (P&L, exit reason, win/loss) — that needs a real way to detect position closure (a scheduler, or a manual "record outcome" action), neither of which exists yet. Bolting nullable outcome columns onto this table now would blur "decision at the time" with "what happened after," which the roadmap explicitly wants kept separate. No code anywhere reads from this table to change behavior — pure data collection only, per the explicit "avoid self-modifying trading logic early on" instruction.

NOT run against a live database — written against documented Supabase/Postgres syntax, needs running via the Supabase SQL editor or CLI and verifying.

## Quant Phase 2A: batch autonomous paper trading (added this session)

Real batch scan across a real watchlist: builds a real trade plan per ticker (same QuantStrategist as the single-ticker panel), then evaluates against STRICTER auto-execution gates via `BatchScanner.ts` — real committee confidence ≥70%/agreement ≥60%/evidence ≥60% (stricter than the plan-formation thresholds of 60/50/45), real open-position count ≤5, real bid/ask spread ≤15%, real per-trade cost ≤2% of real account equity. Only tickers clearing every gate get a real paper order, capped at a real, enforced `maxAutoExecutionsThisRun` (the "kill switch" — a per-run parameter, since no scheduler exists to make it a persistent toggle).

**Two real, honest gaps, not hidden**: no open interest or trading volume data exists anywhere in this app (Alpaca serves OI via a separate endpoint not yet wired in) — those real liquidity gates from the original proposal are NOT implemented, only bid/ask spread is. And this is a manual, single-click batch run, not a persistent background process — "autonomous" here means "no per-ticker approval click within one run," not "runs while you're away."

Every outcome (execute/skip/reject/wait) logs to `quant_trade_decisions`, same table as the single-ticker flow. Real Daily Summary added, querying that same table for today's real counts.

## Opportunity Ranking + Market Regime + rename (added this session)

Renamed "Batch Scanner" -> "Daily AI Trading Session" per direct feedback (same underlying logic). Results now ranked by the already-computed `tradeQualityScore` (real, existed already — just wasn't used for ordering). New `engine/market/marketRegime.ts` extracts the real Risk-off/Risk-on/Cautious/Mixed classification out of `MarketPulseSection.tsx` (was a private local function) into a shared module — both Market Pulse and the Hedge Fund page now compute the identical real number from the identical real quotes, instead of two independent copies that could silently drift apart.

**Two real things NOT built, with reasons**: (1) Bull/Bear/High-Volatility/Low-Volatility regime categories from the original sketch — the real classifier only produces Risk-off/Risk-on/Cautious/Mixed; volatility-regime detection would need real VIX data, which has been unavailable all session (the Finnhub `/quote` index-symbol limitation found earlier). (2) "Scan the entire market" instead of a fixed watchlist — no real stock-universe list exists in this app, and running full research per ticker across a real market-wide universe would exhaust free-tier API rate limits almost immediately. A real screener is a separate, future infrastructure decision, not something to fake with a longer hardcoded list.

## Industry Exposure Tracking — Position Manager v1 continued (added this session)

Real portfolio-level industry concentration, computed from real Alpaca positions + real Finnhub industry classification (`finnhubIndustry`, cached 1hr). Deliberately labeled "Industry," not "Sector" — Finnhub's profile endpoint doesn't provide a real GICS-style broad sector taxonomy (Technology/Healthcare/Energy), only a granular industry classification (e.g. "Semiconductors"). Building a real Sector mapping would need either a GICS lookup table or an unverified new provider — rather than fabricate a "Sector" label over data that isn't actually that, this stays honestly scoped to what's real.

New `engine/portfolio/IndustryExposure.ts` (fetch + aggregate) and `IndustryExposurePanel.tsx`, wired onto the Hedge Fund page right after Portfolio Risk. Real percentage bars, real dollar values, real ticker lists per industry.

**Explicitly NOT done this round**: connecting this to RiskEngine as a real gate (e.g. "reject if industry exposure would exceed X% after this trade"). RiskEngine.check() is currently a pure, synchronous function with no network calls — wiring in a real industry check means either making it async (affects every order) or fetching industry data upstream in the caller. That's a real, separate architectural decision, not bundled into this round.

## Portfolio Equity Curve — Visual Dashboard Sprint 1 (added this session)

Real chart, using Alpaca's own real, documented portfolio history endpoint (`/v2/account/portfolio/history`) — confirmed via direct research before building, not guessed. Real parallel-array response format (`timestamp`/`equity`/`profit_loss`/`profit_loss_pct`), with defensive timestamp-unit handling (sources disagreed on seconds vs. milliseconds; detects magnitude rather than assuming either).

Real summary metrics shown alongside the chart: current equity, period return, max drawdown — all computed directly from the real series. **Deliberately does NOT show win rate** — that needs real per-trade outcome data (entry vs. exit), which doesn't exist yet (see the Quant Memory section above). An equity curve answers "is the account growing," which is a different real question from "how good are individual trades."

Placed at the top of the Hedge Fund page, above System Status — the confirmed "heartbeat of the dashboard" priority from the Visual Dashboard proposal. Uses `recharts` since this renders on-screen (not off-screen-captured like the Share Card), so the earlier DOM-measurement risk that caused a real bug there doesn't apply here.

NOT yet live-tested — same caveat as every new Alpaca endpoint integration this session.

## Visual Dashboard Sprint 2: Risk Gauges + Portfolio Allocation Donut (added this session)

Two real pieces batched into one round per direct request to reduce deploy-cycle overhead. Risk Gauges: converted "Top Risks" in PortfolioRiskPanel from raw numeric text to real visual bars, colored by real severity (red ≥75, amber ≥50, green below) — same real data, just visual. Portfolio Allocation Donut: new `PortfolioAllocationDonut.tsx`, genuinely different visual language from the existing "Concentration" horizontal bars (kept, not replaced — not redundant), same real `report.positions` market-value data.

**Deliberately excluded from this round**: Position Cards' mini price-chart requirement. Verified directly that `PriceChart.tsx` still shows "Price history unavailable — check FINNHUB_API_KEY / plan access to /stock/candle" — a real, confirmed, unresolved limitation from much earlier this session. Building new charts against the same uncertain data source risked the same failure; not attempted until that's resolved.

Applied the defensive-typing lesson from the equity curve's recharts bugs to the new donut chart's Tooltip formatter proactively (no narrow explicit type annotations, runtime `typeof` checks instead) — still genuinely unverified against a real build, same caveat as everything else this session.

## Visual Dashboard Sprint 3: Position Cards + Quant Activity (added this session)

Two more real pieces batched together. Position Cards: merges two already-fetched real sources by ticker (Alpaca TradingPosition for current/entry price and real P/L, PositionRiskResult for portfolio weight/committee recommendation/top risk) — neither source alone has everything a card needs. Deliberately no mini price chart, since `PriceChart.tsx`'s real candle-data limitation is still unresolved.

Quant Activity: extended `getDailySummary()` with a real `executed` count (rows where `broker_order_id IS NOT NULL` — an actually-accepted order, not just a formed plan) and widened the window from same-day to 7 days, since a freshly-deployed app could show near-zero same-day activity even with real decisions already logged. Given a new, more prominent panel near the top of the page, not just the small summary buried in Batch Scanner (which still shows the same real numbers too).

No new external API calls in this round — both pieces reuse already-fetched real data (positions, quant_trade_decisions), keeping deploy risk low relative to new provider integrations.

## Visual Dashboard Sprint 4: Conviction on cards, Trade Timeline, richer Market Regime (added this session)

Three real pieces batched together, all reusing already-fetched real data — no new external calls. Added real `conviction` score (already computed, wasn't shown yet) to Position Cards. New `TradeTimeline.tsx` — real visual execution history from the same real order data `PaperTradingPanel`'s flat list already shows, just a different (vertical timeline) treatment. Extended `classifyMarketRegime()` with real underlying metrics (avg equity change, gold/bonds change, real breadth — count of DIA/SPY/QQQ/IWM currently up) — backward compatible, verified both existing consumers (Market Pulse, Batch Scanner) still compile against the extended type.

## Portfolio Summary Cards — completes Sprint 1 (added this session)

Real, one-glance summary of 7 metrics: Portfolio Value, Cash, Buying Power, Total Unrealized P/L, Open Positions, Largest Position, Risk Budget Remaining (all computed from real account/position data already fetched, no new API calls). Risk Budget Remaining reuses the exact same `DEFAULT_RISK_LIMITS.maxPositionSizePercent` (10%) the real cumulative-exposure RiskEngine fix uses — same real number, not a second calculation.

**Win Rate deliberately omitted** — shown as an honest "—" with a note explaining why (needs real closed-trade entry/exit tracking, which doesn't exist since no closure-detection is built). "Today's P/L" relabeled to "Total Unrealized P/L" — `TradingPosition` only has cumulative unrealized P/L since entry, not an isolated daily change; showing it under the more accurate label rather than mislabeling it.

This completes the originally-scoped "Sprint 1 – Visual Trading Workstation" from the Visual Dashboard proposal, except the TradingView chart, which remains blocked by the same unresolved `PriceChart.tsx` candle-data limitation.

## Sprint 2 (partial, honestly scoped): AI Activity Feed + Position Health Score (added this session)

Of the 4 requested Sprint 2 pieces, 2 built real, 1 explicitly declined, 1 skipped as redundant:

**AI Activity Feed** — new `getActivityFeed()`, merges real `quant_trade_decisions` + `paper_trade_orders` (both real, already-existing tables) into one chronological feed. Verified every column name against the real migration files before writing the query, not assumed. Real event types only (trade plan formed/no-trade, order submitted/filled) — no fabricated events like "Committee upgraded X" or "SEC filing detected," which aren't real logged events anywhere in this system.

**Position Health Score** — added to Position Cards, honestly composed of exactly 3 real components (recommendation-derived score, real conviction, inverse average risk severity) — NOT the originally-proposed 6 (Trend/Volatility/Liquidity excluded, since all three depend on the same broken candle-data source flagged repeatedly this session; a genuine 6th field, "Evidence Quality," doesn't exist separately at this data layer either — `PositionRiskResult` only carries recommendation/conviction/risks).

**Scheduler Status was explicitly NOT built** — no real scheduler exists (System Status already correctly states this), and showing a fake "Next Market Scan: 13 min" countdown would fabricate progress toward a job that will never fire. This is the same category of thing this app has avoided since round 1 (no fake "engines running" animations, no fake live timers).

**Trade Lifecycle Timeline was skipped** — largely redundant with the existing Trade Timeline, since "Approved / Monitoring / Exit Suggested" aren't real distinct tracked states (no position monitoring service exists yet).

## Shared Contract Selection Engine (added this session)

Promoted `QuantStrategist.selectContract()`'s real matching logic into a standalone, module-level `findMatchingContract()` — genuinely reusable without requiring a full committee-gated `TradePlan` first. `selectContract()` kept as a thin wrapper for the two existing callers (Quant Strategist, Batch Scanner) — verified both still work unchanged, same real behavior, just delegating now.

New "Find Best Contract" tool in the manual Place Order form: real ticker + strategy (Call/Put) in, real matching contract out — same real `STANDARD_PARAMS` (35-45 DTE, 0.30-0.40 delta) already used elsewhere, same real quantity-suggestion formula. Shows a real Contract Recommendation Card (symbol, strike/expiration, delta/IV, bid/ask, real estimated cost) with a "Use This Contract" button that fills the OCC symbol in automatically — the user never has to type or construct it manually, even in the manual trading flow.

Deliberately does NOT require committee agreement — a human choosing to trade on their own judgment isn't blocked by the committee, which is the actual point of a separate manual flow existing. Broker-agnostic translation (the Broker Gateway vision) remains explicitly out of scope — that's tied to the still-deferred Multi-Broker vision document, not bundled into this.

## Finnhub rate-limit fix (added this session)

Real, confirmed production issue: running the Daily AI Trading Session repeatedly in quick succession triggered real Finnhub 429s across every ticker in the watchlist. Found while investigating that `engine/api/FinnhubClient.ts` was already built but genuinely never imported anywhere — meaning none of the 10 real files calling Finnhub directly had any retry/backoff or shared request handling at all.

New `engine/api/fetchWithRetry.ts` — real exponential backoff (1s/2s/4s) on 429s specifically, up to 3 retries, returns the last real response rather than throwing so existing `if (!response.ok)` error handling in every caller stays unchanged. Migrated the 5 core files hit during a real research run: `CompanyBuilder.ts`, `FinnhubQuoteProvider.ts` (both real call sites — quote and market cap), `FinnhubFinancialStatementsProvider.ts`, `FinnhubEstimatesProvider.ts`, `FinnhubCandleProvider.ts`.

**Honest limitation, not glossed over**: this does NOT include a cross-request cache. An in-memory cache would be unreliable on Vercel's serverless functions — each invocation can be a fresh, stateless instance, so a cache "hit" provides no guarantee across a real batch scan. A genuinely reliable cache would need a shared store (Supabase table with a TTL check, or Vercel KV/Redis) — separate, larger infrastructure, not bundled into this fix.

Also added a real 30-second cooldown on the "Run Trading Session" button after each run (success or failure), with a visible countdown — directly prevents the rapid-re-click pattern that caused the original issue, rather than only relying on retry/backoff to absorb it after the fact.

Remaining 5 Finnhub-calling files not yet migrated (`FinnhubFinancialProvider.ts`, `FinnhubIPOProvider.ts`, `fetchMarketHeadlines.ts`, `IndustryExposure.ts`, and `FinnhubClient.ts` itself, still unused) — lower priority since they're not part of the core per-ticker research path a batch scan triggers repeatedly.

## Real compliance fix: /r/[slug] News exclusion + QR code connected to the real publish flow (added this session)

Found during the QR-code loose-end check: `/r/[slug]` (a pre-existing, already-public, unauthenticated page — confirmed via proxy.ts's whitelisted `/r/` prefix) showed the RAW committee recommendation/score/confidence/agreement plus four free-text AI-generated sections (executiveSummary, catalysts, risks, committee.summary) with zero News Analyst exclusion — unlike the Share Card, which was specifically built with this exclusion for real NewsAPI/Currents ToS reasons.

**Fix**: recommendation/score/confidence/agreement now recomputed via the same real `excludeAnalysts()` function the Share Card already uses — not a second, parallel implementation. The four free-text sections are REMOVED entirely (not filtered) — there's no reliable way to verify free-text AI synthesis is clean of News-derived content after the fact, so the safe choice is not displaying it, replaced with the same structured, already-vetted Facts + per-analyst-score presentation the Share Card uses. Added a visible "Public Research Snapshot" label and disclosure line, matching the Share Card's own disclosure pattern.

**Real, already-existing infrastructure discovered and reused, not duplicated**: a full "Publish Report" flow (`publishResearchAction`, `PublishReportButton.tsx`, already wired into `CommandBar.tsx`) already existed and already generates the correct `${siteUrl}/r/${slug}` URL. The Share Card's QR code was pointing at `/research/${ticker}` (auth-gated) instead of reusing this real, working flow — fixed to call the same `publishResearchAction()` and encode its real `shareUrl`.

**Real, stated side effect**: generating a Share Card now also publishes the research (`is_public: true`) if not already published, since a QR code that dead-ends at a private page isn't useful. Shown explicitly in the UI, not done silently.

Confirmed via direct code inspection (not assumed): `/r/[slug]` has zero navigation paths into any authenticated route (only links to `/` and `/#disclosures`, both public), and the slug query is scoped to exactly one research snapshot with no broader access.

## Real chain diagnostics on Find Best Contract "no match" (added this session)

Real fix for a real, honest "no match" case (e.g. IREN's live chain not having anything in the standard 35-45 DTE / 0.30-0.40 delta window). Instead of just stating no match, now shows real diagnostics computed from the actual fetched chain: real count of contracts of that direction, real delta range that DOES exist, real available expirations — so the user understands why and can go pick a specific real contract manually via the Options Chain panel instead.

**Not addressed this round**: company-name input (e.g. "Iris Energy" instead of "IREN"). That needs a real ticker-lookup/resolution step, a separate capability not bundled into this fix — ticker-only for now.

## Fix real silent QR failure (added this session)

Real regression found via direct user report: after round56 wired the QR code to the real publish flow, the QR section started disappearing from the Share Card entirely with zero indication why. Root cause: `generateQRCode()`'s bare `catch { return null; }` silently swallowed any real failure, and even `publishResearchAction`'s own structured `{success: false, error: string}` result was being discarded rather than surfaced — same silent-failure anti-pattern already fixed once this session for `AnthropicClient.ts`.

Fixed: `generateQRCode()` now returns `{dataUrl, reason}` instead of a bare nullable string, surfacing the real failure reason (from `publishResearchAction`'s own error message, or the real caught exception) in the UI as an amber notice when the card generates successfully but the QR specifically doesn't. Next real failure will show an actual reason instead of the QR section just silently vanishing.

## Real root cause found for the QR failure: missing RLS UPDATE policy (added this session)

Round60's error-surfacing fix worked exactly as intended — the real cause was a genuine Postgres RLS violation: `research_history`'s original migration deliberately had no UPDATE policy (append-only snapshots by design), but `publishResearchAction`'s real `.upsert()` needs to UPDATE an existing row whenever the same ticker is re-published. Two features built with genuinely incompatible assumptions about the same table.

**New migration** `20260813000000_research_history_update_policy.sql` — adds a real UPDATE policy scoped identically to the existing insert/select policies (`auth.uid() = user_id`), not a broad re-opening of the table. **Requires running this migration against the live Supabase database** (via SQL editor or CLI) — code alone can't fix an RLS policy; the database itself needs the new policy applied.

## Real earnings-date awareness + bull/base/bear scenario display on Quant Strategist (added this session)

Two real gaps confirmed by direct code review, both fixed. **News-Analyst exclusion confirmed deliberate, not accidental** — checked QuantStrategist.ts directly, found this was explicitly scoped ("Same News-Analyst exclusion used throughout this app for anything that could inform a real capital decision") for the same real NewsAPI production-use restriction as the public Share Card, not an oversight. NOT reopened.

**Earnings-date awareness (new, real)**: reuses `FinnhubEarningsCalendarProvider` (already built and used elsewhere) — a completely separate, safe data source from the News exclusion (scheduling facts, not restricted content). Checks the actual selected contract's real expiration date when available (most precise), falling back to the plan's target DTE range otherwise. Flags with a real warning when an upcoming earnings report falls within the plan's holding period — a real gap-risk source the standard DTE/Delta parameters don't otherwise account for.

**Bull/base/bear probability display (new, real)**: exposes `investmentDecision.scenarios`, already computed elsewhere in the research pipeline (same real data the Share Card's probability chips use) but never surfaced on the Quant Strategist panel — shown regardless of which single direction the plan picked, giving real visibility into both sides.

## Fix real inconsistency: UpcomingEvents now shows real earnings dates (added this session)

Real, confirmed contradiction found via direct user report: "Upcoming Events" claimed "no earnings calendar... data source is wired in yet" while the separate Earnings Preview panel on the SAME research page showed real Finnhub earnings data for the same ticker. UpcomingEvents.tsx's own docstring was accurate when originally written, just stale once FinnhubEarningsCalendarProvider was later built for Earnings Preview.

Made UpcomingEvents async, reuses the same real provider (not a second implementation) to show the real next earnings date alongside the existing real lock-up calculation. Product launches/investor days remain honestly omitted — genuinely still no real data source for those.

## Market Pulse made genuinely public + real QR code added (added this session)

Real fix, same category as the research Share Card's earlier QR problem: added `/education` and `/api/education/` to `proxy.ts`'s `PUBLIC_PREFIXES`, after verifying (not assuming) zero auth dependency anywhere in the real chain (page, `MarketPulseSection.tsx`, `market-pulse/route.ts` all checked directly, all clean).

New real QR code on the Market Pulse share image, pointing at `/education` — genuinely public now. Deliberately switched `share-image/route.tsx` OFF Edge Runtime (was `export const runtime = "edge"`) to standard Node.js runtime first, since `qrcode`'s real Edge Runtime compatibility is genuinely uncertain (researched directly — Buffer support was added to Edge Runtime in 2023, but that's not a guarantee for this specific library) and this app already got burned once this session by a QR code that looked fine but silently failed at runtime. Standard Node.js runtime guarantees identical, already-proven behavior instead of gambling on partial Edge compatibility. `next/og`'s `ImageResponse` works fine on either runtime, so this wasn't a functional tradeoff.

Also fixed a small, real pre-existing inaccuracy while in this file — the CTA text said "See the full AI committee," which doesn't apply to a market-wide card (that's a per-company research concept).

**Real, honest note not swept under the rug**: `/education` lives inside `app/(app)/`, wrapped by the same authenticated `AppShell` (full sidebar/nav) as the rest of the app. An unauthenticated visitor now sees that chrome too, even though every other nav link still correctly redirects to login. Not a security issue — verified the security boundary itself is intact, no protected data is exposed — just a real UX inconsistency worth a genuinely separate public layout (mirroring what `/r/[slug]` has) as a future, bigger follow-up if it matters enough to fix.

## Genuinely public /education layout (added this session)

Real fix for the real UX gap found last round: `/education` moved from `app/(app)/education/page.tsx` to `app/education/page.tsx` (same URL — Next.js route groups don't affect the URL path, only which layout wraps it). Old file removed to avoid a routing conflict. Content itself unchanged, only the layout/access shell.

New `app/education/layout.tsx` — genuinely separate from `AppShell` (confirmed no Context dependency before detaching, not assumed). Lean public header (`IPO Sniper AI | Education | Sign In`) — **deliberately left out "Research" and "About"** from the originally suggested nav, since neither has a real destination yet (no general `/research` index page exists; public research snapshots only exist per-slug at `/r/[slug]`, not as a browsable list). Linking to something that doesn't exist would be a real UX bug, not a shortcut worth taking.

Real detail handled correctly: an already-signed-in user can still reach this page via the authenticated sidebar, so the header checks real Supabase auth state server-side and shows "Back to App" (→ `/workstation`, verified as the real home destination) instead of a confusing "Sign In" button when a session exists.

No `proxy.ts` changes needed for the move itself — middleware matches on URL path, not file location, and `/education` was already in `PUBLIC_PREFIXES` from the prior round.

## System Status collapsed + moved to bottom of Hedge Fund page (added this session)

Real, explicitly-flagged top-priority UI change: "Move System Status much lower... probably the biggest UI change I'd make." SystemStatusPanel now client-side, collapsed by default to a compact one-line badge (real per-stage dot indicators, real "5/7 live" count), expandable on click to the original full detail view. Moved from the top of the Hedge Fund page to the very bottom, after Industry Exposure — preserves full transparency (nothing hidden or removed, same real stage data) without letting operational documentation dominate the page's primary visual space.

## Quant Activity visual upgrade (added this session)

Real visual upgrade to Quant Activity's 4 numbers — larger (3xl), color-coded cards for an "instant system read" per direct feedback. Kept the existing real labels (Decisions/Trade Plans/Executed/No Trade) rather than the originally-suggested Approved/Rejected/Pending — confirmed there's no clean, structured way to query that specific breakdown from `quant_trade_decisions` (only the batch flow embeds outcome type in free-text reasoning, not a real column). Deliberately did NOT add a Risk Used/Available row here even though requested — that real number already lives in Portfolio Summary Cards ("Risk Budget Remaining"), and duplicating it risked the exact "two numbers for the same thing in different places" issue an earlier audit this session found and fixed.

## Trade Timeline enriched + Portfolio Allocation includes real Cash (added this session)

**Trade Timeline**: now built from `paper_trade_orders` directly (not just Alpaca's order history), since this app's own audit table captures something Alpaca's history structurally cannot — real risk-blocked attempts that never reach Alpaca at all (no `broker_order_id`). Real color-coded types (Filled/Broker Rejected/Risk Blocked/Pending) and a real "AI" badge, using an honest heuristic (checked against both real reasoning prefixes this app actually writes: `"Quant Strategist:"` and `"Batch Scanner (autonomous):"` — caught and fixed a real bug in my own draft that only checked the first, which would have silently misclassified every autonomous batch-executed trade as manual).

**Portfolio Allocation Donut**: now includes a real Cash slice, fixing the same "excludes cash" limitation an earlier audit flagged on `PositionRiskResult.weight`. Every slice's % (including Cash) computed against the same real total (positions + cash), not mixing two different denominators.

## Fix real silent DB-write failure: paper_trade_orders insert (added this session)

Real, confirmed production issue found via direct user report: Trade Timeline (new this session, queries `paper_trade_orders`) showed "No orders yet" while real, successful orders clearly existed in Alpaca's own order history. Root cause found by reading the actual insert code: **Supabase JS's `.insert()` does not throw on database-level errors (RLS violations, constraint failures) — it returns `{data, error}`.** The previous code never checked `.error`, so a failed insert wouldn't even reach the `catch` block — it failed completely silently, with zero trace anywhere. Confirmed via direct code read that `logOrderAttempt()` is genuinely called on the real successful-order path (not a control-flow gap) — ruling that out before assuming the DB-write itself was the issue.

Fixed: explicit `error` check on the insert result, logged via `console.error` (the real reason will now be visible in Vercel's function logs on the next order, instead of vanishing). This is a fire-and-forget audit-log call with no direct UI feedback path, so server-side logging is the most that's reasonably achievable here.

**Most likely underlying cause, not yet confirmed**: same category as the `research_history` UPDATE-policy bug found earlier this session — the `paper_trade_orders` migration may have been written but never actually run against the live Supabase database. Needs direct verification (`select count(*) from paper_trade_orders` in Supabase's SQL Editor) before assuming this is the actual cause.

## Decision Funnel + Execution Breakdown — real "Automation" measurement (added this session)

Two real pieces from a much larger proposed dashboard, both genuinely buildable with existing data, no new infrastructure needed. **Execution Breakdown**: real 3-way categorization (Manual/Assisted/Autonomous) using the same reasoning-prefix heuristic already built for Trade Timeline — "Assisted" (`"Quant Strategist:"` prefix) means a human reviewed and clicked Execute; "Autonomous" (`"Batch Scanner (autonomous):"` prefix) means zero human click. Only counts orders that actually reached Alpaca (real `broker_order_id`), not risk-blocked attempts. **Decision Funnel**: same real `getDailySummary()` data QuantActivityPanel already shows, given a funnel visual with real conversion percentages between stages.

**Explicitly NOT built from the larger proposal**: win rate, expectancy, profit factor, avg winner/loser, analyst effectiveness, agreement-vs-win-rate correlation, RiskEngine "prevented loss," position monitoring effectiveness, benchmark/alpha comparison, per-trade "Why did Quant trade" outcome panel. All of these require real trade-closure detection and entry/exit price tracking, which doesn't exist. This is the same missing piece that's blocked Win Rate everywhere else it's been shown as "—" this session (Portfolio Summary Cards, etc.) — building any of these now would mean fabricating numbers.

## Fix real build failure: exported sync helper in a "use server" file (added this session)

Real, confirmed build error: `"use server"` files treat every exported function as a Server Action, and Server Actions must be async — even a pure, synchronous helper with no `await` calls. `classifyExecutionSource()` (added for Execution Breakdown) was exported unnecessarily; it's only ever used internally within the same file. Removed the `export` keyword rather than forcing it `async` for no real reason. Proactively checked every other `"use server"` file in the codebase for the same mistake — found none.

## Decision Funnel honesty clarification (added this session)

Real, important clarification added directly to Decision Funnel: "Trade Plans Formed → Executed" isn't an automatic gate for the single-ticker Quant Strategist flow — execution requires an explicit human click by design (Assisted mode). A 0% conversion here means plans are awaiting review, not that a hidden filter is rejecting them. Added after a proposal suggested this gap represented an automatic rejection process, which isn't accurate for this specific flow — Batch Scanner's autonomous path is the one with real, automatic gates. Also confirmed directly (not assumed) that "No Trade" and "Trade Plans Formed" are already correctly mutually-exclusive real categories in `getDailySummary()` — a proposal suggested this distinction didn't exist yet; it already did, just wasn't labeled clearly enough to be obvious.

## Quant Control: real, server-enforced Kill Switch + Autonomous Mode state (added this session)

Phase 1D + 1E of the Autonomous Operations roadmap, built independent of the Vercel Pro decision. New `quant_control_state` table (append-only log, same real pattern as `quant_trade_decisions`/`paper_trade_orders` — current state is the most recent row) with 5 real states: `OFF`, `ASSISTED`, `AUTONOMOUS`, `SAFE_MODE`, `EMERGENCY_STOP`.

**Real, server-side enforcement, not just a UI toggle**: `checkAutonomousExecutionAllowed()` is called directly inside `executeTradePlan()` (Quant Strategist) and inside Batch Scanner's real per-attempt execution loop — both check the real current state before placing any order, and reject with a real, specific reason if not allowed. This can't be bypassed by calling either server action directly, since the check lives inside the action itself, not the UI.

**Real, deliberate design decision, stated explicitly in code**: this does NOT gate the fully-manual order form. Only AI-driven execution paths are checked. A human explicitly submitting their own order (including to close a position during an emergency) isn't "autonomous trading" and isn't blocked by a control meant to govern autonomous behavior.

**Real semantics connected to the existing `ExecutionSource` categorization**: `AUTONOMOUS` state allows both assisted (human-click-Execute) and autonomous (Batch Scanner, zero human click) execution. `ASSISTED` state allows only assisted — Batch Scanner's autonomous execution is blocked even in this state. `OFF`/`SAFE_MODE`/`EMERGENCY_STOP` block both.

**Important, real behavioral consequence of the safe default**: defaults to `OFF` for any user with no state row yet. This means Quant Strategist's Execute button and Batch Scanner's autonomous execution will both be blocked immediately after this deploys, until the state is explicitly set to `ASSISTED` or `AUTONOMOUS` via the new Quant Control panel (now at the very top of the Hedge Fund page, above the Equity Curve, given its safety-critical nature).

**Requires the real migration to run against the live database** before any of this works — code alone can't create the table.

## Fix confusing epoch timestamp display on Quant Control (added this session)

Real, quick fix per direct feedback: the "never set" default state was showing the raw Unix epoch date (`12/31/1969, 6:00:00 PM`), which looked like a broken timestamp rather than an intentional "no history yet" indicator. Now detects this specific case (`new Date(0)`) and shows "No previous state recorded — system defaults to OFF." instead, matching what a real state change (`Set {date} — "{reason}"`) looks like once one actually exists.

## Real fill-price capture — foundational piece for trade-closure tracking (added this session)

Real, confirmed prerequisite that multiple proposals this session have depended on (Win Rate, Expectancy, Profit Factor, Position Lifecycle Tracking, Experiment Ledger). Confirmed directly against Alpaca's own official API docs before building anything — a real order response example genuinely includes `filled_avg_price`, `filled_qty`, `filled_at`.

**Real, honest nuance handled explicitly, not glossed over**: these fields are often `null` immediately after order submission, since market orders take a moment to actually fill. A `placeOrder()` response may have all three null even for a fully successful order — that's expected. `listOrders()` (called on the page's 20-second auto-refresh) is more likely to have real, non-null values once Alpaca has actually filled the order.

**New migration** adds `filled_avg_price`, `filled_qty`, `filled_at` columns to `paper_trade_orders`. `TradeOrderResult` extended with the same 3 real fields, both real Alpaca provider call sites (`placeOrder`, `listOrders`) updated to extract them from Alpaca's actual response, `logOrderAttempt()` updated to store them.

**Explicitly, deliberately NOT built this round**: any logic to detect when a position closes (net-zero quantity per ticker), match buys against sells, or compute realized P&L. This round is the foundational data-capture piece only — closure detection is a real, separate, substantial next step that depends on this existing first.

## Real closed-trade tracking: Win Rate finally has real data (added this session)

Real, substantial piece completing what round75's fill-data capture was the prerequisite for. New `engine/trading/lifecycle/PositionLifecycle.ts` — real FIFO matching (oldest open buy closes first, a real and standard but not the only possible convention, stated explicitly). Manually tested against 5 real edge cases before wiring in (simple match, split-lot FIFO matching, out-of-order input, unmatched sell, missing fill data) — all passed.

New `getClosedTradesSummary()` groups a user's real filled orders by ticker, runs the matcher per ticker, aggregates into real Win Rate / Realized P/L / Avg Win / Avg Loss. New `ClosedTradesPanel` displays this, including a real per-trade list (entry → exit, real P/L).

**Portfolio Summary Cards' "Win Rate" now shows the real number** once at least one real closed trade exists — previously permanently showed "—". Correctly distinguishes a genuine 0% win rate (real data, just no wins yet) from "no data at all" (still shows "—" until the first real closed trade).

**Real, stated limitations, not glossed over**: only orders with real, captured fill data count (historical orders from before round75 are excluded). Short positions (sell before any matching buy) aren't handled — this app is long-only. FIFO is a real, defensible, but not the only possible lot-matching convention.

## Real "Check real price" on the manual order form (added this session)

Confirmed via direct code read: the "Contract Symbol" field mismatch reported (`AAPL260320C00220000` sitting in the field) is almost certainly placeholder text, not a real bug — the input has no `disabled`/`readOnly` attribute, it's a normal editable field. That exact string is the placeholder shown when empty. Flagged for the user to verify directly rather than assumed fixed with no evidence.

**Real, new feature**: a "Check real price" link next to the Ticker field for equity orders, using the same real `FinnhubQuoteProvider` already used elsewhere in this app — on-demand (not fetched per keystroke, which would mean an API call per character typed), shows real price + % change. Stale quotes are cleared automatically when the ticker changes, so an old price can't linger misleadingly next to a new ticker.

**Explicitly NOT built**: a per-contract options quote. `AlpacaOptionsProvider` only has `getOptionChain()` (the full chain), not a single-contract lookup — a real, separate gap. The form now says so directly, pointing to "Find Best Contract" and the Options Chain panel (both already show real bid/ask) as the current real alternative.

## Real, browsable contract picker (added this session)

Real fix for a real gap: the only way to select a contract outside the standard 35–45 DTE / 0.30–0.40 delta range was to manually copy a raw 21-character OCC symbol from a separate page. New `browseOptionChain()` fetches the real chain, sorted near-the-money first (closest |delta| to 0.5 — a reasonable, stated default, not the only possible sort), capped at 15 results (a form picker, not a full chain browser — that's what the Options Chain panel already is).

New inline UI: "Browse real chain" button appears when the standard match fails, showing a real, clickable list (strike, expiration, real bid/ask, real delta) — clicking one auto-fills the Contract Symbol field and switches Asset Type to Option, same real pattern as the existing "Use This Contract" flow. Deliberately does NOT auto-fill a suggested quantity (unlike the standard-match flow, which has a real risk-sized estimate) — `browseOptionChain()` doesn't do risk-based sizing, so fabricating a qty number here would misrepresent it as a real calculation.

## Real Quant Run Ledger (added this session)

Real, persisted answer to "did the autonomous batch scanner actually run, and what happened" — not just the transient in-page results table, which disappears on navigation. New `quant_runs` table, one real row per `runBatchScan()` invocation.

Counts computed directly from that run's real `BatchRunResult[]` — not a second, independent calculation that could drift from what the UI shows. `riskApprovedCount` specifically uses `outcome === "execute"`, which is only ever set after clearing every real gate including round73's Quant Control check — it genuinely means risk-approved, not just attempted.

Wrapped the existing function body in an outer try/catch (existing per-ticker error handling untouched) so a real, unexpected run-level failure gets logged with `status: 'failed'` and the actual error message before re-throwing — verified the caller (`BatchScannerPanel.tsx`) already handles a rejected promise gracefully, so this doesn't introduce new failure-mode risk.

New `getRecentRuns()` + `RunHistoryPanel` shows the last 10 real runs with real counts, status, and error (when failed).

**Explicitly NOT built this round**: the full per-run drill-down tree (click a run ID to see every ticker's individual decision path), and the separate "Autonomous Runs vs. Completed Trade Cycles" dual-counter distinction for the 100-cycle experiment. This round is the foundational run-level logging only.

## 100-Cycle Validation Progress: real, explicitly separate counters (added this session)

Real completion of the "Autonomous Runs vs. Completed Trade Cycles" distinction flagged as not-yet-built last round. New `getTotalRunsCount()` (efficient row count via `count: "exact", head: true`, no row data fetched) + reuses the already-real `getClosedTradesSummary()`. New `ValidationProgressPanel`, placed prominently right after Quant Control given it answers the central "how close are we to validating autonomy" question this session has repeatedly returned to.

Deliberately kept as two separate progress bars, not combined into one number — a system that ran 50 times and correctly found no opportunity each time is behaving completely differently from a system that only ran 5 times because it kept failing to run at all. The same "5 trades" total would mean opposite things depending on which is true; only tracking them separately distinguishes them.

## Better error hint for company-name-instead-of-ticker mistakes (added this session)

Real, small fix for a real, direct report: searching "TESLA" (company name) instead of "TSLA" (ticker) failed with an unhelpful raw error. Confirmed the error message propagates directly to the UI (`research/[ticker]/page.tsx`'s catch block shows `error.message` verbatim, no truncation) before improving it. Added a simple, honest heuristic hint (most real US tickers are 1-5 characters, so a longer input is a real, common sign of a company name) — not a full company-name-to-ticker resolution system, which remains a separate, larger, not-built feature already flagged elsewhere in this app.
