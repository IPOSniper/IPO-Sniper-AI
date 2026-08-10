import type { BrainResult } from "../brain/BrainResult";

export class BrainDiagnostics {

    static print(result: BrainResult): void {

        console.log("=================================");
        console.log(" IPO Sniper AI Brain Diagnostics ");
        console.log("=================================");

        console.log(`Analyzers Run : ${result.analyzerCount}`);
        console.log(`Execution ms  : ${result.executionTimeMs.toFixed(2)}`);
        console.log(`Confidence    : ${result.confidence.toFixed(2)}`);
        console.log(`Findings      : ${result.findings.length}`);

        console.log("");

        for (const finding of result.findings) {

            console.log(`• ${finding.title}`);
            console.log(`  Score      : ${finding.score}`);
            console.log(`  Confidence : ${finding.confidence}`);
            console.log(`  Summary    : ${finding.summary}`);
            console.log("");

        }

    }

}
