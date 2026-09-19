# IPO Sniper AI — Workstation Design Contract

Data Representation - Visualization Map - Research Flow - Research Index - Definition of Done

## Session status (verified by clean type-check + build, this worktree)

DONE:
- Committee votes -> distribution bar, all 15 analysts visible (ConsensusBar + original CommitteeAvatarRow/AnalystLayer)
- Evidence coverage -> coverage bars (EvidenceModule.tsx)
- Risk factors -> severity bars (RiskModule.tsx)
- Earnings actual vs estimate -> side-by-side bars (EarningsComparisonChart.tsx)
- Cash/debt -> metric cards only, correctly not charted as trend (FinancialModule.tsx)
- Price history -> correctly left unbuilt; EVTL has 1 trading day, rule says never fabricate history

NOT YET BUILT:
- Valuation ranges/scenarios
- Institutional holdings bars
- Insider trade timeline
- Options strike ladder visualization
- News sentiment timeline (donut already exists in original code)
- Catalysts/events timeline
- Comparable companies bars
- Market context relative-performance lines
- Research Index anchor-jump + active-section highlight (index exists, active-highlight behavior not verified)

## Non-negotiable rules
- Real data only, no decorative numbers
- Additive, not destructive - never remove existing intelligence
- Data before chart - identify dataset first, then pick visual
- Chart must match the data used by the analysis
- Explanation must match what the visual actually shows
- Traceability - visuals link back to source/period/timestamp/verification
- Missing data is not bearish
- Density without chaos - no giant empty cards, no forced stretch
- No forced infinite scroll - Research Index gives direct navigation
- Progressive detail - fast view first, evidence/explanation deeper, source-level on drill-down
- Responsive - same hierarchy across screen sizes

## Data -> Visualization Map (summary; full table in original .docx)
Price history: line/candlestick+volume, RSI/MACD only if real series exists, never fabricate
Revenue/net income: bars + growth line, use actual periods only
Margin: trend line only w/ multiple periods, else metric
Cash/debt: metric cards, chart only if comparison meaningful
Committee votes: bullish/neutral/bearish distribution bar, all 15 analysts visible
Analyst conviction: compact meters/bars
Evidence coverage: coverage bars, not a bearish score
Risk factors: severity bars mapped to real risk metadata
Earnings actual vs estimate: side-by-side bars, clearly labeled
Earnings history: line/bar trend across available quarters
Valuation scenarios: range/band, only if real valuation engine exists
Institutional holdings: horizontal bars/table, use filing date
Insider trades: timeline + table, use disclosed Form 4 data
Options chain: strike ladder/compact chain, never imply prediction
News sentiment: donut/bar + methodology disclosure
News over time: timeline, every article attributable
Catalysts: timeline/markers, don't convert possibility into certainty
Upcoming events: timeline/calendar strip, source-backed dates
Comparable companies: horizontal bars/table, same measurement period
Thesis factors: bull/bear distribution reflecting real factors
Market context: relative performance lines, period/source explicit
Single factual value: metric card, never chart just for appearance

## Acceptance checklist (definition of done)
Reads as one coherent narrative; Research Index makes navigation seamless;
key facts evaluable without a wall of text; visuals use real data and agree
with written analysis; explanations match visuals; evidence traceable;
missing data explicit; no intelligence removed; no dead space; no module
stretched by a taller neighbor; works for data-rich AND data-poor tickers;
feels like a workstation, not a static report.

## Central question for every future change
"Does this make the factual research easier for an analyst/client to
understand, evaluate, navigate, and fact-check?" If no, don't add it
just to look more impressive.
