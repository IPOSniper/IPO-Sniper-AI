const BASE_URL =
    "https://finnhub.io/api/v1";

export async function finnhubFetch<T>(
    endpoint: string
): Promise<T> {

    const apiKey =
        process.env.FINNHUB_API_KEY;

    if (!apiKey) {
        throw new Error(
            "FINNHUB_API_KEY is not configured."
        );
    }

    const response =
        await fetch(
            `${BASE_URL}${endpoint}${endpoint.includes("?") ? "&" : "?"}token=${apiKey}`
        );

    if (!response.ok) {
        throw new Error(
            `Finnhub request failed: ${response.status}`
        );
    }

    return await response.json();

}
