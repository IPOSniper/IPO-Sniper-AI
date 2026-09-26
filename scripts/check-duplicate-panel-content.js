#!/usr/bin/env node
/**
 * Real, standalone dev-time guard: scans every real panel component
 * for literal JSX text strings that appear verbatim in more than one
 * file. This is exactly the class of bug that shipped tonight
 * (Institutional Ownership rendered from two different files with
 * identical text) - this script would have caught that automatically
 * instead of requiring a person to notice it in a screen recording.
 *
 * Run with: node scripts/check-duplicate-panel-content.js
 * Real, deliberate scope: flags STATIC text only (things a developer
 * actually typed), not computed/dynamic values - a real duplicate
 * verdict like "SELL" is expected to repeat and is not a bug.
 */
const fs = require("fs");
const path = require("path");

const PANELS_DIR = path.join(__dirname, "..", "components", "workstation", "panels");
const MIN_LENGTH = 40;

function walk(dir) {
    let files = [];
    for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files = files.concat(walk(full));
        else if (entry.name.endsWith(".tsx")) files.push(full);
    }
    return files;
}

function extractStaticStrings(source) {
    // Matches JSX text between tags, e.g. >Not currently held...< --
    // a real, simple heuristic, not a full JSX parser.
    const matches = [...source.matchAll(/>([^<>{}\n]{40,})</g)];
    return matches.map(m => m[1].trim()).filter(s => s.length >= MIN_LENGTH);
}

const files = walk(PANELS_DIR);
const seen = new Map();

for (const file of files) {
    const source = fs.readFileSync(file, "utf8");
    for (const str of extractStaticStrings(source)) {
        if (!seen.has(str)) seen.set(str, []);
        seen.get(str).push(path.relative(process.cwd(), file));
    }
}

let foundDuplicates = false;
for (const [str, fileList] of seen) {
    const uniqueFiles = [...new Set(fileList)];
    if (uniqueFiles.length > 1) {
        foundDuplicates = true;
        console.log("\nReal, static duplicate text found in " + uniqueFiles.length + " files:");
        console.log("  \"" + str.slice(0, 80) + (str.length > 80 ? "..." : "") + "\"");
        for (const f of uniqueFiles) console.log("    - " + f);
    }
}

if (!foundDuplicates) {
    console.log("No real, static duplicate panel text found.");
    process.exit(0);
} else {
    console.log("\nReal duplicates found - see above. Each one is a candidate for the same class of bug fixed tonight (Institutional Ownership rendered twice).");
    process.exit(1);
}