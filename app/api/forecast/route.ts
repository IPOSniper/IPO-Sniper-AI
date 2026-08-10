import { NextResponse } from "next/server";

/**
 * Previously returned { success: true, forecasts: [] } — a
 * confidently-shaped fake response indistinguishable from "we
 * checked, there genuinely are no forecasts right now." There is no
 * forecast data source anywhere in this codebase (see
 * FinancialOverviewChart.tsx / ValuationSummary.tsx for the same
 * honest gap on the UI side). An empty array lies about that; a 501
 * doesn't.
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Not implemented — no forecast data source is wired in yet.",
      service: "Forecast API",
      timestamp: new Date().toISOString(),
    },
    { status: 501 }
  );
}
