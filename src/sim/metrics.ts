import type { MetricsRecord, SimulationPhase } from "./types";

export const clamp = (min: number, max: number, value: number): number =>
  Math.min(max, Math.max(min, value));

export function computeSvpi(occlusionFraction: number): number {
  return 100 * Math.pow(1 - clamp(0, 1, occlusionFraction), 2.5);
}

export function computeCoordination(
  alignment: number,
  compactness: number,
): number {
  return clamp(0, 1, 0.5 * alignment + 0.5 * compactness);
}

export function makeMetricsRecord(
  timeSec: number,
  phase: SimulationPhase,
  clotBurden: number,
  localization: number,
  coordination: number,
  occlusionFraction: number,
): MetricsRecord {
  return {
    timeSec,
    phase,
    clotBurdenPct: 100 * clamp(0, 1, clotBurden),
    svpiPct: clamp(0, 100, computeSvpi(occlusionFraction)),
    localizationPct: 100 * clamp(0, 1, localization),
    coordinationScore: clamp(0, 1, coordination),
  };
}
