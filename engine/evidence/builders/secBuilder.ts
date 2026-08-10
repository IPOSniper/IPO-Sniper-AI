import { EvidenceBuilder } from "../types";
import { SecEvidence } from "../package";
import { SECEdgarProvider } from "../providers/SECEdgarProvider";
import { ProspectusExtractor } from "../extractors/ProspectusExtractor";

/**
 * Real SEC EDGAR evidence: looks up the company's CIK, finds its
 * most recent S-1/424B4 (IPO prospectus) or 10-K if no IPO filing
 * exists, then runs heuristic extraction on the filing text. See
 * ProspectusExtractor's own doc comment for the honest limitations
 * of that extraction.
 */
export class SecBuilder
    implements EvidenceBuilder<SecEvidence> {

    private readonly provider = new SECEdgarProvider();
    private readonly extractor = new ProspectusExtractor();

    async build(ticker: string): Promise<SecEvidence> {

        const now = new Date();
        const source = "SEC" as const;

        try {
            const cik = await this.provider.getCIK(ticker);

            if (!cik) {
                throw new Error(`No SEC CIK found for ticker ${ticker}.`);
            }

            const filing = await this.provider.findLatestFiling(
                cik,
                ["424B4", "S-1", "S-1/A", "10-K"]
            );

            if (!filing) {
                throw new Error(`No relevant SEC filing found for ${ticker}.`);
            }

            const text = await this.provider.getFilingText(cik, filing);

            const underwriters = this.extractor.extractUnderwriters(text);
            const riskFactorCount = this.extractor.countRiskFactorParagraphs(text);

            return {

                latestFiling: {
                    value: {
                        formType: filing.formType,
                        filedAt: filing.filedAt,
                        accessionNumber: filing.accessionNumber,
                        url: this.provider.buildFilingUrl(cik, filing),
                    },
                    source,
                    confidence: 100,
                    verified: true,
                    collectedAt: now,
                },

                underwriters: {
                    value: underwriters,
                    source,
                    // Heuristic extraction, not a structured field
                    // SEC provides — moderate confidence even on a hit.
                    confidence: underwriters.length > 0 ? 60 : 0,
                    verified: underwriters.length > 0,
                    collectedAt: now,
                },

                riskFactorCount: {
                    value: riskFactorCount,
                    source,
                    confidence: riskFactorCount > 0 ? 50 : 0,
                    verified: riskFactorCount > 0,
                    collectedAt: now,
                },

            };

        } catch {
            // No CIK match, no filing found, SEC_EDGAR_USER_AGENT
            // missing, or the request failed — honestly unverified.
            return {
                latestFiling: { value: null, source, confidence: 0, verified: false, collectedAt: now },
                underwriters: { value: [], source, confidence: 0, verified: false, collectedAt: now },
                riskFactorCount: { value: 0, source, confidence: 0, verified: false, collectedAt: now },
            };
        }

    }

}
