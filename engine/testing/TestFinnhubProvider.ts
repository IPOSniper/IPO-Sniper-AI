import dotenv from "dotenv";

dotenv.config({
  path: ".env.local",
});

const key = process.env.FINNHUB_API_KEY;

console.log("API Key Loaded:", !!key);
console.log("API Key Length:", key?.length ?? 0);

import { FinnhubFinancialStatementsProvider }
  from "../evidence/providers/FinnhubFinancialStatementsProvider";

async function main() {

  const provider =
    new FinnhubFinancialStatementsProvider();

  await provider.getFinancialStatements("MSFT");

}

main().catch(console.error);
