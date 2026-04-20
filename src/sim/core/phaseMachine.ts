import { SIMULATION_PHASES, type ClotState, type SimulationPhase } from "../types";
import {
  CHANNEL_OPENING_BURDEN_THRESHOLD,
  PARTIAL_FAILURE_BRANCH_TIME_SEC,
  resolveOutcomeBranch,
  shouldAdvanceToResults,
} from "../systems/outcomeResolver";

export const ORDERED_PHASES: readonly SimulationPhase[] = [...SIMULATION_PHASES];

export const PHASE_MACHINE_COMMANDS = ["advance", "replay", "reset"] as const;
export type PhaseMachineCommand = (typeof PHASE_MACHINE_COMMANDS)[number];

export interface PhaseEvaluationContext {
  timeSec: number;
  clotBurden: number;
}

export interface PhaseTransitionResult {
  from: SimulationPhase;
  requested: SimulationPhase;
  phase: SimulationPhase;
  valid: boolean;
  reason?: string;
}

type PhaseGuard = (context: PhaseEvaluationContext) => SimulationPhase | null;

export const ALLOWED_PHASE_TRANSITIONS: Record<
  SimulationPhase,
  readonly SimulationPhase[]
> = {
  idle: ["context_intro"],
  context_intro: ["vessel_zoom"],
  vessel_zoom: ["clot_identified"],
  clot_identified: ["injection"],
  injection: ["navigation"],
  navigation: ["localization"],
  localization: ["clot_interaction"],
  clot_interaction: ["channel_opening"],
  channel_opening: ["success", "partial_failure"],
  success: ["results"],
  partial_failure: ["results"],
  results: ["injection", "idle"],
};

const PHASE_ADVANCE_GUARDS: Record<SimulationPhase, PhaseGuard> = {
  idle: ({ timeSec }) => (timeSec > 0 ? "context_intro" : null),
  context_intro: ({ timeSec }) => (timeSec >= 2 ? "vessel_zoom" : null),
  vessel_zoom: ({ timeSec }) => (timeSec >= 4 ? "clot_identified" : null),
  clot_identified: ({ timeSec }) => (timeSec >= 6 ? "injection" : null),
  injection: ({ timeSec }) => (timeSec >= 9 ? "navigation" : null),
  navigation: ({ timeSec }) => (timeSec >= 18 ? "localization" : null),
  localization: ({ timeSec }) => (timeSec >= 28 ? "clot_interaction" : null),
  clot_interaction: ({ timeSec, clotBurden }) =>
    clotBurden <= CHANNEL_OPENING_BURDEN_THRESHOLD ||
    timeSec > PARTIAL_FAILURE_BRANCH_TIME_SEC
      ? "channel_opening"
      : null,
  channel_opening: ({ timeSec, clotBurden }) => {
    return resolveOutcomeBranch({ timeSec, clotBurden });
  },
  success: ({ timeSec }) =>
    shouldAdvanceToResults("success", timeSec) ? "results" : null,
  partial_failure: ({ timeSec }) =>
    shouldAdvanceToResults("partial_failure", timeSec) ? "results" : null,
  results: () => null,
};

export function canTransition(
  from: SimulationPhase,
  to: SimulationPhase,
): boolean {
  return ALLOWED_PHASE_TRANSITIONS[from].includes(to);
}

export function tryTransitionPhase(
  from: SimulationPhase,
  to: SimulationPhase,
): PhaseTransitionResult {
  if (canTransition(from, to)) {
    return {
      from,
      requested: to,
      phase: to,
      valid: true,
    };
  }

  return {
    from,
    requested: to,
    phase: from,
    valid: false,
    reason: `Illegal phase transition from "${from}" to "${to}".`,
  };
}

export function getAdvanceTarget(
  currentPhase: SimulationPhase,
  context: PhaseEvaluationContext,
): SimulationPhase | null {
  return PHASE_ADVANCE_GUARDS[currentPhase](context);
}

export function advancePhase(
  currentPhase: SimulationPhase,
  context: PhaseEvaluationContext,
): SimulationPhase {
  const requestedPhase = getAdvanceTarget(currentPhase, context);

  if (!requestedPhase) {
    return currentPhase;
  }

  return tryTransitionPhase(currentPhase, requestedPhase).phase;
}

export function resolveNextPhase(
  currentPhase: SimulationPhase,
  timeSec: number,
  clot: Pick<ClotState, "currentBurden">,
): SimulationPhase {
  return advancePhase(currentPhase, {
    timeSec,
    clotBurden: clot.currentBurden,
  });
}

export function replayPhase(currentPhase: SimulationPhase): SimulationPhase {
  return tryTransitionPhase(currentPhase, "injection").phase;
}

export function resetPhase(currentPhase: SimulationPhase): SimulationPhase {
  return tryTransitionPhase(currentPhase, "idle").phase;
}

export function isTerminalPhase(phase: SimulationPhase): boolean {
  return phase === "results";
}
