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
