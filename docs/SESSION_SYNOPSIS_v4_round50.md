# IPO Sniper AI — Session Synopsis (checkpoint after commit 97eeb26)

Supersedes docs/SESSION_SYNOPSIS_v4_round28.md, which is now well out of date. 50 commits total.

## Biggest update since round28: REAL PRODUCTION DEPLOYMENT, CONFIRMED WORKING

This app is now live at **https://ipo-sniper-ai.vercel.app** — the first time it has ever run anywhere except a local machine. Confirmed via real user testing, not just a successful build:
- Real research pipeline works in production (Finnhub, SEC EDGAR, News APIs, Supabase, Anthropic env vars all correctly configured)
- Real Alpaca account/positions load on the Hedge Fund page in production (Alpaca + Supabase auth both working)
- `NEXT_PUBLIC_SITE_URL` is set, so the Share Card QR code should now link somewhere real (not independently re-confirmed working, worth a quick check)

**Real deployment debugging story, worth knowing if this ever recurs**: the first production build failed on a genuine TypeScript error in `SECForm4Provider.ts` that had passed local `tsc --noEmit` throughout development — Next.js 16's build-time checker is stricter. A first fix attempt (literal ternary values) looked correct but did NOT actually work — confirmed via three separate real deploy attempts, including one with caching explicitly disabled. The real fix needed an explicit type assertion (`as "A" | "D" | null`) because TypeScript widens string literals back to `string` in expression positions like an anonymous `.map()` callback's returned object literal, when no contextual type flows in from outside. Real lesson: `next build`'s type checking can catch things `tsc --noEmit` alone doesn't — worth remembering before assuming a clean local type-check means a clean deploy.

**Known real limitation on the current Hobby-tier Vercel plan**: Cron jobs are capped at once-per-day with imprecise (within-the-hour) timing, and — more urgent — **functions have only a 10-second execution timeout** (vs 60s+ on Pro). The ARK Invest overnight-watch cron job processes tickers sequentially by real design (avoiding SEC EDGAR/NewsAPI rate limits) — for more than a couple of watched tickers, this will likely time out on Hobby tier. Not yet fixed; worth checking Vercel's cron logs once it's actually fired to confirm.

## Major features added since round28 (all real, all verified in some form)

- **Quant Strategist Phase 1+2** (`engine/quant/QuantStrategist.ts`): real committee data → structured trade plan (direction, standard DTE/delta/risk parameters — explicitly labeled as industry conventions, not AI-optimized) → real contract selection from the live Alpaca options chain → real one-click paper execution through the same RiskEngine path as manual orders. Includes a transparent decision checklist (3 real gates: confidence/agreement/evidence quality) and a documented, non-ML Trade Quality score.
- **Quant Phase 2A — Batch Scanning** ("Daily AI Trading Session"): real batch scan across a configurable watchlist, stricter separate auto-execution gates (real committee/evidence thresholds, real open-position count, real bid/ask spread, real portfolio-risk %), capped auto-execution (a real, enforced per-run "kill switch," since no persistent scheduler exists). Results ranked by real Trade Quality score. Two explicit, honest gaps: no open-interest/volume data anywhere in the app, and this is a manual single-click run, not persistent background autonomy.
- **Quant Memory** (`quant_trade_decisions` Supabase table): every trade-plan decision — including "No Trade" — logs real committee scores, decision checks, and (when applicable) the selected contract. Confirmed working end-to-end via direct SQL verification against the real database before this deployment happened. Deliberately pure data collection — no learning/self-modifying logic reads from it yet.
- **Real Market Regime indicator**: extracted from Market Pulse's local function into `engine/market/marketRegime.ts`, shared by both Market Pulse and the Hedge Fund page so they report identical numbers. Real labels: Risk-off/Risk-on/Cautious/Mixed — NOT Bull/Bear/High-Vol/Low-Vol, since volatility-regime detection would need real VIX data, which has been unavailable all session (a real, documented Finnhub `/quote` limitation on index-level symbols).
- **Real options chain data + execution** (`AlpacaOptionsProvider.ts`, real order placement with the correct 100x contract multiplier applied in RiskEngine).
- **Share Card**: full redesign + a second, feed-optimized "Standard Card" format, real QR code (omitted honestly when no public URL is configured — now it is), config-driven News-Analyst exclusion for ToS safety.
- **Real audit-driven fixes**: PortfolioRiskPanel was silently analyzing only an always-empty manual position list instead of real Alpaca positions (fixed); a duplicate-labeled confidence number was found and consolidated; `.env.example` was discovered to have never actually been version-controlled due to a `.gitignore` bug (fixed); two security-sensitive env vars (`CRON_SECRET`, `SUPABASE_SERVICE_ROLE_KEY`) were used in real code but undocumented (fixed).

## Explicitly NOT built, with real reasons (not silently deferred)

- Scan-the-entire-market "Opportunity Discovery" — no real stock-universe list exists in this app, and full research per ticker at market-wide scale would exhaust free-tier API rate limits almost immediately. A real screener integration is separate future infrastructure.
- Position Manager, Portfolio Manager, Execution Agent, Performance Analyst (the broader multi-agent autonomy vision) — each is its own substantial design problem, intentionally not scoped yet.
- Trade outcome storage (P&L, exit reason, win/loss) — needs a real way to detect position closure (a scheduler or a manual action), neither of which exists yet.
- A real, deployed scheduler beyond the one existing ARK Invest cron job (which has its own real Hobby-tier limitations, above).

## Immediate next steps when resuming

1. Confirm the Share Card QR code actually renders/scans now that `NEXT_PUBLIC_SITE_URL` is set.
2. Check Vercel's cron logs (once the ARK Invest job has actually fired) to see if the Hobby-tier 10-second timeout is a real problem in practice.
3. Decide on the next Quant phase — the honest options are Position Monitoring (Greeks/thesis-still-valid tracking on open positions), Trade outcome logging (needs closure detection first), or continuing to harden what already exists before adding more surface area.
