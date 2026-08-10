# IPO Sniper AI — Operating System

The reference document. When anyone (human or AI) asks "where should this
go," the answer comes from here — not from memory, not from whichever
folder happens to be open.

---

## Mission

An AI-powered investment research platform, positioned as augmenting human
analysts rather than replacing them, evidence-based and institutional-grade
rather than a chatbot bolted onto finance data. Trust story: *the AI tells
you exactly what it knows, what it doesn't, and never fakes the
difference.*

---

## Departments

Every capability belongs to exactly one department. One owner, one
responsibility, one data flow, one place in the system.

| Department | Role | Owns |
|---|---|---|
| **Executive Layer** | Makes decisions | AI Committee, Investment Brain, Conviction Engine, Recommendation Engine |
| **Research Department** | Finds opportunities | Financial/SEC/News/Macro/IPO Analysts, Evidence Engine, Research Reports |
| **Quant Research Lab** | Proves ideas | Experiment Registry, Strategy Registry, Similarity Engine, Regime Engine, Behavior Database, Black-Scholes, Validation |
| **Trading Desk** | Executes | Broker adapters, paper/live trading, position management, order routing, risk controls |
| **Portfolio Management** | Monitors | Allocation, exposure, drawdown, attribution, P/L, heat maps |
| **Market Intelligence** | Observes | Market Pulse, earnings, IPO calendar, lockups, economic calendar, news |
| **Memory Department** | Learns | Trade outcomes, committee outcomes, behavior database, calibration, confidence updates |

The Workstation is not "a dashboard" — it's the window into this system,
the way a Bloomberg terminal is a window into many internal systems, not a
collection of unrelated pages.

---

## Core contracts

| Contract | Status |
|---|---|
| `ResearchReport` | ✅ Exists |
| `InvestmentDecision` | ✅ Exists |
| `ValidatedStrategy` | ⬜ Defined, not yet implemented |
| `TradeOutcome` | ⬜ Defined, not yet implemented |
| `Strategy` | ⬜ Not yet defined |
| `Experiment` | ⬜ Exists informally (`experiments` table + `ExperimentRecorder`), needs a formal shared contract |
| `CatalystObservation` | ⬜ Exists informally (`catalyst_observations`), needs a formal contract |
| `BehaviorObservation` | ⬜ Not yet defined |
| `MarketRegime` | ⬜ Exists informally (`RegimeSignal.ts`), needs promoting to a shared interface |
| `LearningRecord` | ⬜ Not yet defined |

### `ValidatedStrategy`
```ts
interface ValidatedStrategy {
    id: string;
    version: string;
    hypothesis: string;
    evidenceQuality: "low" | "moderate" | "high";
    minimumConfidence: number;
    allowedRegimes: MarketRegime[];
    expectedHoldingPeriod: Duration;
    riskProfile: RiskProfile;
    execute(signal: Signal): TradeDecision;
}
```

### `TradeOutcome`
```ts
interface TradeOutcome {
    strategyId: string;
    signalId: string;
    marketRegime: MarketRegime;
    catalystId?: string;
    prediction: Prediction;
    execution: ExecutionResult;
    pnl: number;
    maxDrawdown: number;
    holdingPeriod: number;
    exitedBecause: "target" | "stop" | "time" | "manual" | "invalidated";
    confidenceBeforeTrade: number;
    confidenceAfterEvaluation?: number;
    lessons: Lesson[];
}
```

---

## Strategy lifecycle

Experiments produce evidence. Strategies consume it. Different entities,
different lifecycles.

```
Experiment → Evidence → Strategy Candidate → Paper Testing → Validated
           → Active → Monitoring → Retired
```

**Promotion criteria** (explicit, measurable): minimum observations,
minimum confidence, minimum evidence quality, maximum drawdown, maximum
expected loss, minimum calibration.

**Retirement criteria** (symmetric — a strategy that worked last year
failing this year needs the same rigor as promotion): confidence decay,
evidence deterioration, repeated underperformance, risk drift, market
regime mismatch.

The Quant Research Lab runs continuously — always validating, always
learning — but stays execution-isolated. It never places a trade itself.
It only ever produces a `ValidatedStrategy` the Trading Desk consumes.
Trade outcomes flow back to the Memory Department, which feeds the Lab.

---

## Migration gates

Nothing enters this repository from the Quant Lab or Infrastructure
donor branches without clearing three gates:

1. **Compile** — does it build?
2. **Validation** — does it actually work?
3. **Architecture** — does it belong here (which department owns it)?

If the answer to any gate is no, it stays in its donor branch (the Lab)
until it clears.

Dead code is never deleted immediately on migration:
`Migrated → Verified → Referenced nowhere → Archive → Delete`

---

## Release standards

Versioning: v4.00 = production release, v4.01 = bug fixes, v4.10 = new
features, v5.00 = major architectural changes.

Roadmap:
- **v4.00 — Institutional Core**: one repository, one architecture, one
  workstation, one design system.
- **v4.10** — complete the Research Department.
- **v4.20** — complete Market Intelligence.
- **v4.30** — complete Portfolio Management.
- **v4.40** — bring the Quant Research Lab fully online.
- **v5.00** — enable autonomous execution using only validated strategies.

Naming: the "Hedge Fund" page is being reconsidered — that name carries
regulatory/expectation baggage for what's currently a research/demo view.
Candidates: "Institutional Research" or "Strategy Lab."

Committee UI (refined, superseding the earlier "abstract icon only"
version): visual avatars are fine and can be premium/gradient-styled —
what's non-negotiable is that every label explicitly says "AI [Role]"
(never a bare human-sounding name + role, e.g. "AI Revenue Analyst" not
"Marcus Williams, Revenue Analyst"), and a prominent, always-visible
disclosure states these are AI personas, not real people. Photorealistic
human photos are still out — an actual photo next to an "AI"-labeled
name is the exact ambiguity this rule exists to prevent, even with the
label present.

**Runtime infrastructure gap, dev vs. production:**

| Component | Dev (current) | Production (needed) |
|---|---|---|
| Scheduler | Windows Scheduled Task hitting `localhost` | Vercel Cron / Supabase Scheduled Function / worker |
| Memory | Local | Supabase |
| Strategy Registry | ❌ | Needed |
| Outcome Registry | ❌ | Needed |
| Experiment Registry | Partial | Needed |
