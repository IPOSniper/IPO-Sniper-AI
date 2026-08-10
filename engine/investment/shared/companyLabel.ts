import type { Company } from "../../models/Company";

/**
 * Company.sector is always "Unknown" today — Finnhub's profile2
 * endpoint (the only company-profile source wired in) doesn't return
 * a GICS sector, only an industry classification (see CompanyBuilder.ts).
 * Concatenating "TICKER — Unknown" into user-facing text reads like a
 * bug rather than a known gap — this falls back to industry alone
 * when sector isn't real, which usually IS populated.
 */
export function sectorOrIndustryLabel(company: Company): string {
    if (company.sector && company.sector !== "Unknown") {
        return company.sector;
    }
    return company.industry || "Unknown";
}
