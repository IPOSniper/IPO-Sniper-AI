import { NextResponse } from "next/server";

export async function GET(request: Request) {
    const apiKey = process.env.NEWS_API_KEY;
    if (!apiKey) {
        return NextResponse.json({ error: "NEWS_API_KEY not configured." });
    }

    const { searchParams } = new URL(request.url);
    const q = searchParams.get("q");
    if (!q) {
        return NextResponse.json({ error: "Pass ?q=your+query in the URL." });
    }

    try {
        const from = new Date();
        from.setDate(from.getDate() - 60);

        const params = new URLSearchParams({
            q,
            from: from.toISOString().slice(0, 10),
            sortBy: "publishedAt",
            language: "en",
            pageSize: "5",
            apiKey,
        });

        const response = await fetch(`https://newsapi.org/v2/everything?${params.toString()}`, { cache: "no-store" });
        const data = await response.json();

        return NextResponse.json({
            query: q,
            httpStatus: response.status,
            newsApiStatus: data.status,
            newsApiCode: data.code ?? null,
            newsApiMessage: data.message ?? null,
            totalResults: data.totalResults ?? 0,
            firstHeadlines: (data.articles ?? []).slice(0, 3).map((a: { title: string; source?: { name?: string }; publishedAt: string }) => ({
                title: a.title,
                source: a.source?.name,
                publishedAt: a.publishedAt,
            })),
        });
    } catch (err) {
        return NextResponse.json({ error: err instanceof Error ? err.message : "Unknown error" });
    }
}
