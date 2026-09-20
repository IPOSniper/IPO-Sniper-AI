import { createHash } from "crypto";
import { createClient } from "@/lib/supabase/server";


interface LedgerSnapshot {
    ticker: string;
    companyName: string;
    recommendation: string;
    conviction: number;
    confidence: number;
    agreement: number;
    analysts: {
        analyst: string;
        recommendation: string;
        confidence: number;
        thesis: string;
    }[];
    generatedAt: string;
}

interface LedgerInput {
    company: { ticker: string; name: string };
    report: { recommendation: string; conviction: number; confidence: number };
    committee: { agreement: number; reports: { analyst: string; recommendation: string; confidence: number; thesis: string }[] };
}

function buildDeterministicSnapshot(research: LedgerInput): LedgerSnapshot {
    return {
        ticker: research.company.ticker,
        companyName: research.company.name,
        recommendation: research.report.recommendation,
        conviction: research.report.conviction,
        confidence: research.report.confidence,
        agreement: research.committee.agreement,
        analysts: research.committee.reports
            .map(r => ({
                analyst: r.analyst,
                recommendation: r.recommendation,
                confidence: r.confidence,
                thesis: r.thesis,
            }))
            .sort((a, b) => a.analyst.localeCompare(b.analyst)),
        generatedAt: new Date().toISOString(),
    };
}

function hashSnapshot(snapshot: LedgerSnapshot): string {
    const canonical = JSON.stringify(snapshot, Object.keys(snapshot).sort());
    return createHash("sha256").update(canonical).digest("hex");
}

export async function recordResearchCall(research: LedgerInput): Promise<{ hash: string } | null> {
    const supabase = await createClient();
    if (!supabase) return null;

    const snapshot = buildDeterministicSnapshot(research);
    const hash = hashSnapshot(snapshot);

    const { error } = await supabase.from("research_calls_ledger").insert({
        ticker: snapshot.ticker,
        company_name: snapshot.companyName,
        recommendation: snapshot.recommendation,
        conviction: snapshot.conviction,
        confidence: snapshot.confidence,
        agreement: snapshot.agreement,
        committee_snapshot: snapshot,
        content_hash: hash,
    });

    if (error) {
        console.error("Failed to record research call to ledger:", error.message);
        return null;
    }

    return { hash };
}

export function verifySnapshotHash(snapshot: LedgerSnapshot, expectedHash: string): boolean {
    return hashSnapshot(snapshot) === expectedHash;
}
