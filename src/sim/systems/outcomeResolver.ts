import type {
  ClotState,
  SimulationOutcome,
  SimulationPhase,
} from "../types";

export const CHANNEL_OPENING_BURDEN_THRESHOLD = 0.18;
export const SUCCESS_BURDEN_THRESHOLD = 0.08;
export const PARTIAL_FAILURE_BRANCH_TIME_SEC = 42;
export const SUCCESS_RESULTS_TIME_SEC = 36;
export const PARTIAL_FAILURE_RESULTS_TIME_SEC = 45;

export interface OutcomeResolutionContext {
  timeSec: number;
  clotBurden: number;
}

export function resolveOutcomeBranch(
  context: OutcomeResolutionContext,
): SimulationOutcome | null {
  if (context.clotBurden <= SUCCESS_BURDEN_THRESHOLD) {
    return "success";
  }

  if (context.timeSec > PARTIAL_FAILURE_BRANCH_TIME_SEC) {
    return "partial_failure";
  }

  return null;
}

export function shouldAdvanceToResults(
  outcome: SimulationOutcome,
  timeSec: number,
): boolean {
  return outcome === "success"
    ? timeSec > SUCCESS_RESULTS_TIME_SEC
    : timeSec > PARTIAL_FAILURE_RESULTS_TIME_SEC;
}

export function resolveSnapshotOutcome(
  phase: SimulationPhase,
  timeSec: number,
  clot: Pick<ClotState, "currentBurden">,
): SimulationOutcome | null {
  if (phase === "success") {
    return "success";
  }

  if (phase === "partial_failure") {
    return "partial_failure";
  }

  if (phase === "results") {
    return resolveOutcomeBranch({
      timeSec,
      clotBurden: clot.currentBurden,
    });
  }

  return null;
}
