import type { MetricsRecord, SimulationPhase } from "../schema/scenarioTypes";

export type { MetricsRecord, SimulationPhase } from "../schema/scenarioTypes";

export interface MetricFormulaInputs {
  timeSec: number;
  phase: SimulationPhase;
  clotBurden: number;
  localization: number;
  coordination: number;
  occlusionFraction: number;
}

export type MetricRecordKey = keyof MetricsRecord;
