import type { CommitteeReport } from "../committee/contracts/CommitteeReport";
import type { EvidencePackage } from "../evidence/package";

export interface ResearchReport {
  ticker: string;
  companyName: string;

  recommendation: string;
  conviction: number;
  confidence: number;

  committee: CommitteeReport;
  evidence: EvidencePackage;

  executiveSummary: string;

  // True only when ExecutiveSummarySynthesizer's real API call
  // succeeded; false when it fell back to committee.summary (no
  // ANTHROPIC_API_KEY configured, or the call failed). Exists so the
  // UI can accurately disclose which one a user is looking at,
  // rather than guessing from the text alone.
  executiveSummaryIsAIGenerated: boolean;

  catalysts: string[];
  risks: string[];

  generatedAt: Date;
}
