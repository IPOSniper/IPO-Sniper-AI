# IPO Sniper AI — Session Synopsis (checkpoint after commit 82d4636)

Written as a standalone reference in case this chat session ends and work needs to resume elsewhere. 34 commits total, all on top of the v4.00 "Project Genesis" foundation (git-initialized canonical repo, dead-code archived, 0 type-check errors).

## What's COMPLETE and confirmed working (real user testing, not just type-check)

- **News pipeline**: Two real sources merged (NewsAPI.org + Currents API), a real query bug fixed (company legal-name suffix broke keyword matching), recency+magnitude weighting added. **Confirmed live**: RIOT's real Anthropic $9.1B deal headline showed up correctly after the fix.
- **Equity paper trading**: Real Alpaca connection, real risk gating (RiskEngine), real order placement. **Confirmed live**: a real "buy 101 IREN" order was accepted by Alpaca, shown in Recent Orders with a real timestamp.
- **Committee avatars**: 15 real photos (cropped from a submitted image), names fully omitted per explicit instruction, "AI [Role]" labels only, guaranteed-unique assignment (no duplicate faces), disclosure banner always visible.
- **Share Card (both formats)**: Full "Committee Research Snapshot" and a second, feed-optimized "Standard Card" — real hero recommendation, real committee avatars, real evidence gauge, real per-analyst score bars (recharts replaced with plain CSS bars after diagnosing a real off-screen-rendering bug), real QR code (via the `qrcode` npm library) linking to the full report when `NEXT_PUBLIC_SITE_URL` is configured. Config-driven News-Analyst exclusion (`config/shareCardDisclosure.ts`) so the ToS-safe default can be changed later without touching render logic.
- **Market Pulse**: Sentiment gauge, market breadth, real concept glossary, expanded share-image card (7 instruments + real headlines), view-before-download fixed.
- **Hedge Fund page**: Honest System Status panel (4 of 7 stages genuinely "Live," rest honestly "Not built" with real reasons), live Alpaca account/positions/orders with real 20s auto-refresh.
- **Workstation**: Mission Control header, AI Verdict row, Committee avatar row with click-through Analyst Workspace (real evidence/assumptions/risks/unknowns/monitoring per analyst), Snapshot panel (market cap, shares out, beta, 52w range, volume via Finnhub), Insider Activity panel (real SEC Form 4 filings), sidebar shrunk 69% with clickable expanded news.

## What's BUILT but NOT YET LIVE-TESTED (real code, unverified against a live response)

- **Options data & execution** (this round): `AlpacaOptionsProvider.ts` (real chain endpoint), `OptionsChainPanel.tsx` (shows on research pages), and real order placement extended into the Hedge Fund trading form (Asset Type toggle, 100x contract multiplier correctly applied in RiskEngine). **Equity orders confirmed still working after this refactor. Options-specific path (contract symbol parsing, options pricing via Alpaca bid/ask) has NOT been tested with a real order yet** — this was the very next step when the session paused.
- Finnhub `/stock/metric` field names (beta, 52WeekHigh, etc.) — written against documented shape, not confirmed against a live response.
- SEC Form 4 XML parsing — written against the documented schema, not confirmed against a real filing's actual XML.

## What's EXPLICITLY DEFERRED (real reasons documented in code/matrix, not silently dropped)

- **Full Workstation mission-control redesign** (sector performance widgets, evidence terminal, institutional flow chart) — the 112-file panel registry is real risk territory; only additive pieces were built (nothing was restructured/removed).
- **"What changed vs yesterday" on the Share Card** — no real historical research snapshot is stored/populated anywhere yet.
- **Options contract picker UI** — contract symbol is currently a manually-typed field, not a dropdown wired to real chain data.
- **The broader "Adaptive Options Engine" proposal** (Prediction/Volatility/Valuation/Strategy/Learning/Governance engines) — only the data foundation (real chain + execution) exists. Everything above raw data access is unbuilt.
- **FRED (economic calendar) integration** — researched (real finding: no blanket commercial-use restriction, unlike NewsAPI/Currents, but per-series copyright needs checking) but not built.

## Known real gaps, not oversights

- NewsAPI.org: 24h delay, forbids commercial use, localhost-only CORS (documented, confirmed via their own terms).
- Currents API: free tier is documented as non-commercial/dev use only — confirm directly with them before this app goes fully public.
- No production scheduler exists — everything only runs when a user is actively on the page (Windows Task + `npm run dev` only, no Vercel Cron/Supabase Scheduled Function yet).

## Immediate next step when resuming

Test a real options order end-to-end: Workstation → real ticker → Options Chain panel → copy a real OCC contract symbol → Hedge Fund page → Asset Type: Option → paste symbol → submit small qty → confirm Alpaca accepts it and the risk-engine math (100x multiplier) looks right in the result.
