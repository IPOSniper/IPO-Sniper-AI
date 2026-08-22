# IPO SNIPER AI - UNIFIED COMMAND CENTER

## PRIMARY OBJECTIVE

Merge the three existing user experiences:

1. Workstation
2. Research
3. Hedge Fund / Quant

into ONE coherent financial command center.

Do not rebuild the underlying systems.

Do not create a fourth dashboard.

The canonical dashboard is:

    /workstation

Research and Hedge Fund remain available as drill-down/detail routes,
but the most important live information from both must be surfaced
inside the Workstation.

====================================================
EXISTING ARCHITECTURE TO REUSE
====================================================

Reuse existing:

- FeedEvent
- live-feed route
- IPO Watch
- IPO Filed / SEC
- IPO Radar
- Market Feed
- earnings calendar
- Market Movers
- Market Context
- OpportunityEngine
- OpportunityAdapter
- ObservationCycle
- QuantOrchestrator
- BatchScanner
- RiskEngine
- Quant Control
- Alpaca execution
- position management
- exit engine
- research pipeline
- AI committee
- existing Workstation components

Do NOT create replacements for these.

====================================================
CANONICAL WORKSTATION
====================================================

The Workstation becomes the primary command center.

Required hierarchy:

1. Live Status
2. What Matters Now
3. IPO Intelligence
4. Market Intelligence
5. Quant Live Desk
6. Execution Monitor
7. Research Spotlight
8. Live Intelligence
9. Supporting feeds

====================================================
1. LIVE STATUS
====================================================

Show:

- current session
- Quant Control state
- intelligence state
- last data update
- events monitored
- new events
- IPO developments
- Quant opportunities
- active positions

Example:

MARKET OPEN
QUANT AUTONOMOUS
INTELLIGENCE LIVE

Last update: 14 sec ago
487 monitored
18 new events
7 IPO developments
4 opportunities
2 active positions

Do NOT fabricate counts.

Only display numbers from real existing data.

====================================================
2. WHAT MATTERS NOW
====================================================

Create a compact priority stream from existing normalized events.

Examples:

- S-1 filed
- IPO development
- strategic investment
- major contract
- institutional filing
- important earnings event
- unusual market movement
- Quant opportunity

Each item must include:

- time
- company
- event type
- headline
- source
- link
- attention
- why it matters where available

Do not invent summaries.

====================================================
3. IPO INTELLIGENCE
====================================================

One unified IPO center.

Tabs/states:

Emerging
Watch
Filed
Scheduled
Post-IPO
Lock-Up

Current baseline values such as:

Scheduled 1
Filed 10
Watch 0

must reflect real API data.

Do NOT hide provider failure by converting it to NO SIGNAL.

Use:

NO SIGNAL
UNAVAILABLE
PROVIDER QUOTA EXHAUSTED
DEVELOPING
FILED
SCHEDULED
POST-IPO
LOCK-UP

The user must be able to distinguish:

"nothing found"

from:

"could not check."

====================================================
4. MARKET INTELLIGENCE
====================================================

Combine:

- market regime
- SPY
- QQQ
- VIX if available
- movers
- earnings
- important market events

Remove large empty regions.

Use compact dense information cards.

Percentages must clearly say:

% CHANGE = change from previous/reference close

Attention must clearly say:

ATTENTION = feed priority, NOT a trade recommendation

====================================================
5. QUANT LIVE DESK
====================================================

Bring existing Hedge Fund information onto Workstation.

Display:

- Quant Control
- current run
- decisions
- plans formed
- passed auto gates
- orders submitted
- filled
- open positions
- completed trades
- rejection reasons
- current opportunities

Example:

AUTONOMOUS

Decisions: 311
Plans: 91
Passed auto gates: 0
Orders: 0
Filled: 0
Open positions: 2
Completed: 0

All values must come from existing Quant state.

====================================================
6. EXECUTION MONITOR
====================================================

Reuse existing Hedge Fund execution metrics.

Show:

Discovery
Decision
Risk
Order
Fill
Position
Exit
Completed Trade

Visually represent the funnel.

Do not rename "trade plans" as executed candidates.

====================================================
7. RESEARCH SPOTLIGHT
====================================================

Show a compact preview of recent/high-priority research.

Example:

RFAI
SELL
Model confidence: 74%
Committee agreement: 40%
Evidence verified: 28%
Risk: HIGH

[VIEW RESEARCH]

Do not embed the entire Research page.

Research remains the detailed drill-down.

====================================================
8. LIVE INTELLIGENCE
====================================================

Reuse existing FeedEvent/live-feed.

Merge:

- IPO
- SEC
- News
- Strategic
- Institutional
- Earnings
- Market
- Quant

Newest/highest-value events should appear first.

Do not create another feed.

====================================================
9. RESEARCH PAGE
====================================================

Keep:

/research/[ticker]

as a deep analysis page.

But make it visually consistent with the Workstation shell.

New listings should explicitly display:

NEW LISTING
INSUFFICIENT HISTORY

when data coverage is low.

Do not force unavailable analysts into false precision.

Recommendation confidence must be distinguishable from:

- committee agreement
- evidence quality
- data coverage

====================================================
10. HEDGE FUND PAGE
====================================================

Keep:

/hedge-fund

as the deep Quant control and execution page.

But its key state must be visible from Workstation.

The Hedge Fund page should no longer be the only place where
the user can see whether Quant is active.

Make it operational, not decorative.

Show:

- session
- autonomous state
- opportunity activity
- latest decisions
- risk gates
- orders
- positions
- exits
- validation progress

====================================================
11. VISUAL "ALIVE" REQUIREMENT
====================================================

Do not manufacture motion.

The UI should feel alive because data changes.

Use:

- last update timers
- event timestamps
- counters
- changing opportunity rankings
- new-event highlights
- current session state
- Quant activity
- active positions
- changing feeds

No excessive animations.

====================================================
12. EMPTY-STATE REQUIREMENT
====================================================

Never allow huge dead panels.

If no data exists:

Use compact truthful states:

NO DATA
UNAVAILABLE
NO ACTIVE POSITIONS
NO NEW EVENTS

Do not leave giant blank cards.

====================================================
13. RESPONSIVE DENSITY
====================================================

Use the large desktop viewport efficiently.

Priority information should appear above the fold.

Avoid:

- enormous empty IPO cards
- oversized market context
- duplicate feed panels
- repeated navigation
- giant blank regions

====================================================
14. NAVIGATION
====================================================

The user should feel like there is ONE application.

Primary nav:

Dashboard
IPO Intelligence
Research
Quant
Watchlist
Alerts

The routes remain available.

But the Workstation is the command center.

====================================================
15. DATA ARCHITECTURE
====================================================

Do not create a new data layer.

Reuse existing APIs and normalized contracts.

Existing flow:

providers
    ↓
existing API routes
    ↓
existing FeedEvent / domain contracts
    ↓
Workstation

Quant flow remains:

OpportunityEngine
    ↓
OpportunityAdapter
    ↓
ObservationCycle
    ↓
QuantOrchestrator
    ↓
BatchScanner
    ↓
RiskEngine
    ↓
existing execution

====================================================
16. GDELT COMPATIBILITY
====================================================

GDELT must enter the existing intelligence stream.

Do NOT create a GDELT dashboard.

Required:

GDELT
    ↓
FeedEvent
    ↓
Live Intelligence
    ↓
What Matters Now

And where appropriate:

GDELT
    ↓
normalized catalyst
    ↓
OpportunityEngine

====================================================
17. IMPLEMENTATION RULE
====================================================

Before changing any file:

1. Inspect it.
2. Identify existing components.
3. Reuse them.
4. Modify only the minimum required.
5. Do not duplicate logic.
6. Do not replace working APIs.
7. Do not change Quant execution behavior in the Dashboard merge.

====================================================
18. ACCEPTANCE TEST
====================================================

The build is NOT complete because the page merely looks different.

Complete only when:

[ ] One Workstation is the canonical command center
[ ] IPO Intelligence is visible
[ ] Filed uses real SEC data
[ ] Watch distinguishes signal from unavailable
[ ] Live Intelligence contains multiple event types
[ ] Market Intelligence is dense and useful
[ ] Quant activity is visible
[ ] Execution funnel is visible
[ ] Research preview is visible
[ ] Research deep page still works
[ ] Hedge Fund deep page still works
[ ] No duplicate backend engines were created
[ ] No major empty regions remain
[ ] Data updates visibly without page reload when supported
[ ] Existing Quant execution logic is unchanged

====================================================
19. DEFINITION OF DONE
====================================================

The user should be able to open ONE page and understand:

WHAT IS HAPPENING
WHAT MATTERS
WHAT IS HAPPENING IN IPOs
WHAT THE MARKET IS DOING
WHAT QUANT IS DOING
WHAT RESEARCH SAYS
WHAT HAS BEEN TRADED
WHAT NEEDS ATTENTION

without navigating between three disconnected dashboards.

The goal is:

ONE APPLICATION
ONE COMMAND CENTER
MULTIPLE SPECIALIZED ENGINES
ONE CONSISTENT EXPERIENCE
