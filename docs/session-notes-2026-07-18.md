# Session Progress

## Completed
- Cleaned duplicate Next.js routes
- Renamed (marketing) route group
- App compiles successfully
- Removed duplicate BusinessFundamentalsCard
- Modernized BusinessFundamentalsWidget
- Preparing DashboardGrid integration

## Next Task
- Wire BusinessFundamentalsWidget into DashboardGrid
- Fix any compile errors
- Build Company Intelligence page
- Connect widget to reasoning engine
1. Product Vision

IPO Sniper AI is no longer just an IPO tracker.

It is an AI-powered Investment Intelligence Platform.

Its purpose is to answer:

What happened? Why did it happen? What does it mean? What should an investor do next?

2. Core Philosophy

These principles should guide every feature:

Evidence over opinion.
Explain before recommending.
Challenge every investment thesis (bull and bear cases).
The AI should reason transparently ("Glass Box AI").
Every score should be backed by evidence.
3. The Reasoning Engine

This is the heart of the application.

Market Event
      │
      ▼
What Happened
      │
      ▼
Why
      │
      ▼
Who Benefits
      │
      ▼
Who Gets Hurt
      │
      ▼
Second Order Effects
      │
      ▼
Investor Actions
      │
      ▼
What To Watch

Everything eventually feeds into this pipeline.

4. Engine Architecture
engine/

evidence/
fundamentals/
ipo/
portfolio/
reasoning/
scoring/
sec/
thesis/
types/

Each engine has one responsibility.

5. UI Philosophy

Every backend engine must have a visible home.

Instead of building backend code first and UI later:

Engine
↓

Widget

↓

Company Page

↓

Dashboard

↓

Portfolio

Every new engine should immediately appear somewhere users can interact with it.

6. Dashboard Vision

The dashboard is an executive briefing, not a collection of stock tickers.

Example layout:

Hero

AI Market Brief

Business Fundamentals

IPO Weather

Portfolio Intelligence

Upcoming IPOs

Market Story

Cause & Effect
7. Company Intelligence Page

This becomes the flagship page.

Company

Business Fundamentals

Investment Thesis

Bull Case

Bear Case

Evidence

Reasoning Chain

Financial Trends

SEC Analysis

Portfolio Fit
8. Development Workflow

This is probably the biggest change we've made.

Instead of giant refactors:

Sprint

↓

Build

↓

Compile

↓

Commit

↓

Repeat

One feature at a time.

9. Current Status
Completed
Fixed duplicate dashboard route.
Fixed (marketing) route group.
Dashboard architecture is clean.
DashboardHome is componentized.
DashboardGrid is componentized.
Removed duplicate BusinessFundamentalsCard.
Modernized BusinessFundamentalsWidget.
App compiled successfully before the last changes.
Next Sprint
Wire BusinessFundamentalsWidget into DashboardGrid.
Resolve any compile errors.
Create mock Fundamentals data.
Display the widget on the dashboard.
Build the Company Intelligence page.
Connect it to the Reasoning Engine.
10. One More Recommendation

I think we've reached the point where we should create a proper project guide in your repository.

For example:

docs/

architecture.md
roadmap.md
development-workflow.md
vision.md
session-notes.md

That way, the project becomes the source of truth, not the chat history. Any new conversation can pick up by reading those documents, and you'll have a lasting record of the architecture, philosophy, and roadmap.

My recommendation

Rather than trying to preserve a huge conversation indefinitely, let's make the repository self-documenting. We can create a concise architecture and roadmap in docs/, then use future chats to build features sprint by sprint. That approach scales much better as IPO Sniper AI grows.