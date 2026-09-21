import { createHash } from "crypto";
import { createServiceRoleClient, isServiceRoleConfigured } from "@/lib/supabase/serviceRole";


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
    const canonical = canonicalStringify(snapshot);
    return createHash("sha256").update(canonical).digest("hex");
}

export async function recordResearchCall(research: LedgerInput): Promise<{ hash: string } | null> {
    if (!(await isServiceRoleConfigured())) {
        console.error("Ledger write skipped: service-role Supabase client is not configured");
        return null;
    }
    const supabase = await createServiceRoleClient();
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

/** Deterministic JSON: keys sorted at every depth, nothing filtered out.
 * (JSON.stringify with a key-array replacer silently drops nested fields
 * whose names are not also top-level keys, which weakened the hash.) */
function canonicalStringify(value: unknown): string {
    if (value === null || typeof value !== "object") return JSON.stringify(value) ?? "null";
    if (Array.isArray(value)) return "[" + value.map(v => canonicalStringify(v)).join(",") + "]";
    const obj = value as Record<string, unknown>;
    return "{" + Object.keys(obj).sort()
        .filter(k => obj[k] !== undefined)
        .map(k => JSON.stringify(k) + ":" + canonicalStringify(obj[k]))
        .join(",") + "}";
}