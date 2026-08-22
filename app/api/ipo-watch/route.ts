import { NextResponse } from "next/server";
import { buildIpoWatchCompanies } from "@/engine/intelligence/buildIpoWatchCompanies";

export type { IPOWatchItem, IPOWatchCompany } from "@/engine/intelligence/buildIpoWatchCompanies";

export const revalidate = 3600;

export async function GET() {
    const result = await buildIpoWatchCompanies();
    return NextResponse.json(result);
}