export type EvidenceSourceType =
    | "SEC"
    | "Earnings Call"
    | "Interview"
    | "News"
    | "Investor Presentation"
    | "Patent"
    | "FDA"
    | "13F"
    | "Macro"
    | "Options"
    | "Internal";

export interface EvidenceReference {

    id: string;

    title: string;

    sourceType: EvidenceSourceType;

    organization: string;

    published: Date;

    retrieved: Date;

    url?: string;

    filing?: string;

    accessionNumber?: string;

    cik?: string;

    ticker?: string;

    page?: number;

    section?: string;

    timestamp?: string;

    quote?: string;

    confidence: number;

    freshness: number;

}
