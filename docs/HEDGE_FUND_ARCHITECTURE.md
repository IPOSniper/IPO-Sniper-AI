# Hedge Fund Layer — Current State & Path Forward

Last updated: this session, in response to a direct request to "take a
look at it and update it." Honest status first: **there is no Hedge
Fund code anywhere in this repo.** `/hedge-fund` is a role-gated route
prefix string in `proxy.ts` — nothing else. No pages, no components,
no trade logic, no broker integration. This document is a plan, not
a changelog.

## What already exists that the Hedge Fund layer can build on

The "same brain, two consumers" architecture from the very first
session on this project holds up:

- `InvestmentDecisionBuilder` (`engine/investment/`) — real, working,
  wired into `analyzeFull()`. Produces `PortfolioImpact`,
  `CapitalRotation`, `RiskRadar`, `ScenarioAnalysis` from the same
  Evidence → Committee pipeline the research side uses. This is
  **research guidance** today (suggested allocation %, not live
  position sizing against a real portfolio) — see
  `PortfolioIntelligence.tsx`'s own on-screen caveat.
- Role model already supports this: `hedge_admin`/`admin` roles,
  `/hedge-fund` gated in `proxy.ts` from day one.
- `research_history` table pattern (append-only, RLS'd per-user) is
  a reasonable model for a future `trade_history`/`position_history`
  table.

## What "automated, get in and out of trades based on options
fundamentals" actually requires

Being direct about why none of this is built yet, and won't be built
today: this is the one part of the whole app where a bug doesn't
mean a wrong chart, it means real financial loss. Each layer below
is a real, separate body of work — not a checklist to speed through.

1. **Options data provider.** Free-tier APIs (Finnhub, NewsAPI, SEC)
   used everywhere else in this app do NOT include real options
   chains with Greeks, open interest, or implied volatility on their
   free tiers. Polygon.io has an options tier but it's paid. This is
   a real cost, not a wiring task.
2. **Broker integration.** Actually placing/closing trades needs a
   broker API (Alpaca, Interactive Brokers, Tradier are common
   choices for algo trading). Alpaca specifically offers a real
   **paper trading** environment with the same API shape as live
   trading — this is the right place to start, not live money.
3. **Position/portfolio state.** The app currently has zero concept
   of "what do I currently hold." Needs real tables: positions,
   entry price, size, current P&L — before any "get in and out"
   logic can mean anything.
4. **Risk engine with hard limits, enforced in code, not just
   suggested.** Max position size, max daily loss, max concurrent
   positions, circuit breakers. These need to be checks that BLOCK
   an order from being placed, not just numbers displayed in a UI.
5. **The decision loop itself** — this is the "smart and quick to
   respond" part. Realistically: a scheduled job (not a human
   clicking Analyze) that re-runs research on positions/watchlist,
   compares new conviction against entry thesis, and proposes
   (not executes) a change. Autonomous execution is a LATER stage
   after paper trading has run long enough to trust the loop.
6. **A kill switch reachable independently of the automation
   itself** — if the automated loop is misbehaving, there needs to
   be a way to stop it that doesn't depend on the same code path
   that might be broken.

## Recommended sequencing — paper first, always

This matches the gating principle from the very first architecture
discussion on this project ("risk-gated, paper-traded before real
money, and only ever automated within hard safety limits") — that
was the right call then and still is:

```
Real options data provider (Polygon paid tier or similar)
  -> Position/portfolio state (real tables, real P&L tracking)
  -> Risk engine (hard limits enforced in code)
  -> Paper trading via Alpaca's paper environment
  -> Run paper trading long enough to trust the conviction->action
     mapping against real market conditions
  -> Human-approval-gated real trades (small size)
  -> Only then: increasingly autonomous execution within the same
     hard limits, with an independent kill switch throughout
```

Skipping straight to "autonomous, gets in and out of trades" without
the paper-trading stage means the first time the logic is wrong,
it's wrong with real money.

## What I'd actually build first, when you're ready

Not autonomous trading. The lowest-risk, highest-value next piece:
render `PortfolioIntelligence` data (already real) as an actual
`/hedge-fund` page instead of a section within the research
Workstation — i.e., a real dashboard surface for the data that
already exists, with zero new trading logic. That's UI work on real
data, the same category as everything else built this session, not
a new safety-critical system.
