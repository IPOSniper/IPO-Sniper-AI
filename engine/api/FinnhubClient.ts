export class FinnhubClient {
  private readonly apiKey =
    process.env.FINNHUB_API_KEY;

  private readonly baseUrl =
    "https://finnhub.io/api/v1";

  async get<T>(path: string): Promise<T> {

    if (!this.apiKey) {
      throw new Error(
        "FINNHUB_API_KEY is missing."
      );
    }

    const separator =
      path.includes("?") ? "&" : "?";

    const url =
      `${this.baseUrl}${path}${separator}token=${this.apiKey}`;

    const response = await fetch(url, {
      cache: "no-store",
    });

    if (!response.ok) {
      throw new Error(
        `Finnhub Error ${response.status}`
      );
    }

    return response.json() as Promise<T>;
  }
}