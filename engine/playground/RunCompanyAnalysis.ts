import dotenv from "dotenv";

dotenv.config({ path: ".env.local" });

import { CompanyIntelligenceEngine } from "../company/CompanyIntelligenceEngine";

async function main() {

    console.log(
        "Finnhub Key:",
        process.env.FINNHUB_API_KEY
            ? "Loaded"
            : "Missing"
    );

    const engine =
        new CompanyIntelligenceEngine();

    const report =
        await engine.analyze("RKLB");

    console.log(JSON.stringify(report, null, 2));

}

main().catch(console.error);
