import { NextResponse } from "next/server";

/**
 * Same issue as ../route.ts — previously returned a fake-but-
 * confident { success: true, earnings: [] }. No earnings data
 * source exists anywhere in this codebase yet (see EarningsPanel.tsx
 * for the same honest gap on the UI side).
 */
export async function GET() {
  return NextResponse.json(
    {
      success: false,
      error: "Not implemented — no earnings data source is wired in yet.",
      generatedAt: new Date().toISOString(),
    },
    { status: 501 }
  );
}
