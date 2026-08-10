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
| Market Pulse (breadth bar, glossary, countdown) | Infrastructure branch | Market Intelligence | Core | Pending | Required — build didn't exist in this repo as of this snapshot |
| Live header (real-time market status pill, `lib/marketHours.ts`) | Infrastructure branch | Market Intelligence / UI | Core | Pending | Required |
| Alpaca paper trading (`engine/trading/`, `/hedge-fund/paper-trading`) | Infrastructure branch | Trading Desk | Trading | Pending | Required — never run against a live Alpaca account yet |
| Similarity Engine | Quant Lab | Quant Research Lab | Quant | Pending | Required |
| Regime Signal | Quant Lab | Quant Research Lab | Quant | Pending | Required — currently a single-factor SPY classifier, v1 only |
| Experiment Registry (`ExperimentRecorder`, `experiments` table + migrations) | Quant Lab | Quant Research Lab | Quant | Pending | Required |
| IntradayOptionsLedger + BlackScholes | Quant Lab | Quant Research Lab | Quant | Pending | Required — models near-0DTE option behavior, not standard monthly options, see engine's own docs |
| Paired-comparison framework (seeded RNG, delta stats) | Quant Lab | Quant Research Lab | Quant | Pending | Required |

## Not yet started

- `ValidatedStrategy` contract — not implemented anywhere, blocks the Lab → Trading Desk handoff
- `TradeOutcome` contract — not implemented anywhere, blocks the learning loop back to Memory
- `Strategy` / `StrategyRegistry` — not implemented, the Experiment/Strategy lifecycle split has no code yet
- Production scheduler (Vercel Cron / Supabase Scheduled Function) — still Windows Task + `localhost` only
