import { buildBrain } from "./ai/brain";

const API_KEY = process.env.FINNHUB_API_KEY;

interface FinnhubIPO {
  symbol: string;
  name: string;
  exchange: string;
  date: string;
  price?: number;
  numberOfShares?: number;
  totalSharesValue?: number;
}

interface FinnhubIPOResponse {
  ipoCalendar: FinnhubIPO[];
}

export async function getUpcomingIPOs() {
  const response = await fetch(
    `https://finnhub.io/api/v1/calendar/ipo?from=2026-07-01&to=2026-08-31&token=${API_KEY}`,
    {
      cache: "no-store",
    }
  );

  if (!response.ok) {
    console.log("HTTP Status:", response.status);
    console.log("Status Text:", response.statusText);

    const body = await response.text();
    console.log("Response Body:");
    console.log(body);

    return [];
  }

  const data: FinnhubIPOResponse = await response.json();

  console.log("Finnhub response:");
  console.log(JSON.stringify(data, null, 2));

  return await Promise.all(
    (data.ipoCalendar ?? [])
      .filter((ipo: FinnhubIPO) => ipo.symbol)
      .map(async (ipo: FinnhubIPO) => {
        const ai = await buildBrain({
          company: ipo.name,
          ticker: ipo.symbol,
          exchange: ipo.exchange,
          price: ipo.price ? `$${ipo.price}` : "TBD",
          shares: ipo.numberOfShares,
          value: ipo.totalSharesValue,
        });

        return {
          company: ipo.name,
          ticker: ipo.symbol,
          date: ipo.date,
          exchange: ipo.exchange,
          price: ipo.price ? `$${ipo.price}` : "TBD",
          shares: ipo.numberOfShares,
          value: ipo.totalSharesValue,
          analysis: ai.analysis,
        };
      })
  );
}