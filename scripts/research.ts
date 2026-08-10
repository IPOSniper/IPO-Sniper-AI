import "dotenv/config";

import { ResearchEngine } from "../engine/research/researchEngine";

async function main() {
    const ticker = process.argv[2];

    if (!ticker) {
        console.error("Usage: npm run analyze <TICKER>");
        process.exit(1);
    }

    const engine = new ResearchEngine();

    const report = await engine.analyze({
        ticker,
    });

    console.log("================================");
console.log("RESEARCH REPORT");
console.log("================================");

console.log(JSON.stringify(report, null, 2));

console.log("================================");
}

main().catch((err) => {
    console.error(err);
    process.exit(1);
});
