# HEDGE FUND LAYER 2 CLASSIFICATION
## REUSE / WIRE
Quant Now - getQuantFunnelSummary
Execution Funnel - existing decision/order/fill sources
Why Quant Is Not Trading - getRejectionBreakdown
Quant Activity - getActivityFeed
Open Positions - existing position/Alpaca sources
Fund Health - existing portfolio/account sources
Portfolio/Risk - existing risk/portfolio components
Quant Control - existing control state
Validation - quant_test_harness
Quant Memory - existing Quant Memory
Trade History - existing order/trade sources
## NEW CAPABILITY
Momentum Radar - price accel/RVOL/catalyst/stage, confirmed not to exist yet
## NEW / UNCONFIRMED
Current Opportunities - need a real reusable OpportunityEngine accessor
Strategy/Playbooks - no confirmed aggregate data
## RULE
Existing data: WIRE IT. Missing data: BUILD ONLY IF SOURCE IS EXPLICIT. Unknown: SHOW UNAVAILABLE. Never fabricate metrics.
