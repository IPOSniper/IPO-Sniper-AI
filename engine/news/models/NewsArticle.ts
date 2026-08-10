export interface NewsArticle {
    id: string;
    ticker: string;
    headline: string;
    summary: string;
    source: string;
    author?: string;
    url: string;
    publishedAt: Date;
    sentiment?: number;
}
