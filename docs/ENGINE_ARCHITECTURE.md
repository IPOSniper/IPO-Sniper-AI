# IPO Sniper AI Engine Architecture

## Data Flow

Market Data
    ?
Evidence Engine
    ?
Knowledge Engine
    ?
Investigation Engine
    ?
Reasoning Engine
    ?
Intelligence Engine
    ?
Investment Brain
    ?
Investment Committee
    ?
Investment Thesis
    ?
Portfolio

---

## Engine Responsibilities

### Evidence Engine
Input:
- API Providers
- SEC Filings
- News
- Financial Statements

Output:
- EvidencePackage

---

### Knowledge Engine
Input:
- EvidencePackage

Output:
- KnowledgeReport
- KnowledgeFact[]

---

### Investigation Engine
Input:
- KnowledgeReport

Output:
- InvestigationReport

---

### Reasoning Engine
Input:
- InvestigationReport

Output:
- ReasoningResult

---

### Intelligence Engine
Input:
- ReasoningResult

Output:
- IntelligenceReport

---

### Investment Brain
Input:
- IntelligenceReport

Output:
- Investment Thesis

---

### Investment Committee
Input:
- Investment Thesis

Output:
- Buy / Hold / Sell Decision

---

### Portfolio Engine
Input:
- Committee Decision

Output:
- Portfolio Actions

## Canonical entrypoint (added 2026-08-02)

`engine/orchestration/InvestmentOrchestrator.ts` is the live
orchestration path — it's what `engine/services/ResearchService.ts`
and `engine/loaders/loadResearchObject.ts` actually call.

`engine/gen3/` is a separate, unwired design sketch for a possible
future agent-based orchestration layer. It is not connected to the
app (9 of its 10 files are empty placeholders, and the one
implemented file returns a hardcoded mock response). See
`engine/gen3/README.md` for status and a suggested integration
approach (adapter over the existing `Analyst` contract in
`engine/committee/contracts/Analyst.ts`, rather than a parallel
rewrite) if this direction gets picked back up.
