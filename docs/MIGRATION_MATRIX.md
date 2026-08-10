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
| Workstation mission-control structural redesign (AI committee avatar grid, evidence terminal, sector performance widgets, institutional flow chart, breadcrumb, live header pill inside the shell) | Infrastructure branch (header pill) / `workstation_merged_navy.html` (the rest) | Core | Core | **Partial — 2 of ~8 sections migrated** | Added `AIVerdictRow` (3 real cards: AI Verdict, Evidence Quality, Risk Level — the mockup's 4th card, "Upside potential"/target price, deliberately omitted, no real field computes either) and `CommitteeAvatarRow` (real colored-ring avatar row + vote tally, built as a NEW panel alongside the existing `CommitteePanel.tsx` text list, not a replacement — both present the same real `committee.reports` data two ways). Both added at the top of `ResearchSession.tsx`, purely additive — nothing existing was removed or restructured. Sector performance, institutional flow, evidence terminal, and the rest of the mockup's mid/lower sections still not attempted — same real-risk reasoning as before applies to anything that would require restructuring rather than adding. |

## Not yet started

- `ValidatedStrategy` contract — not implemented anywhere, blocks the Lab → Trading Desk handoff
- `TradeOutcome` contract — not implemented anywhere, blocks the learning loop back to Memory
- `Strategy` / `StrategyRegistry` — not implemented, the Experiment/Strategy lifecycle split has no code yet
- Production scheduler (Vercel Cron / Supabase Scheduled Function) — still Windows Task + `localhost` only
