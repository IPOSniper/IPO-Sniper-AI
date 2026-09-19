/**
 * IPO Sniper AI visualization rules.
 *
 * These helpers intentionally do NOT manufacture data.
 * A visualization is rendered only from supplied, real values.
 */

export type VisualizationKind =
    | "metric"
    | "bar"
    | "distribution"
    | "trend"
    | "range"
    | "table"
    | "timeline"
    | "status";

export function hasSeries(values: unknown): values is number[] {
    return (
        Array.isArray(values) &&
        values.length >= 2 &&
        values.every((value) => typeof value === "number" && Number.isFinite(value))
    );
}

export function hasDistribution(values: unknown): values is number[] {
    return (
        Array.isArray(values) &&
        values.length > 0 &&
        values.every((value) => typeof value === "number" && Number.isFinite(value))
    );
}

export function chooseVisualization({
    series,
    distribution,
    range,
    table,
}: {
    series?: unknown;
    distribution?: unknown;
    range?: unknown;
    table?: unknown;
}): VisualizationKind {
    if (hasSeries(series)) return "trend";
    if (range && typeof range === "object") return "range";
    if (hasDistribution(distribution)) return "distribution";
    if (Array.isArray(table) && table.length > 0) return "table";
    return "metric";
}
