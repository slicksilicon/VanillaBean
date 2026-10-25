import type { Range } from "../Query/Types/Range";

/**
 * Returns a simple in-range score for a raw feature value using a min/max range.
 */
export function calculateScore(value: number, range: Range): number {
    if (!Number.isFinite(value)) return 0.0;
    return value >= range.min && value <= range.max ? 1.0 : 0.0;
}


