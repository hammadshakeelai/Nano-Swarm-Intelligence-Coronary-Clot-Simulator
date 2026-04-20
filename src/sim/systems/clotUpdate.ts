import { clamp } from "../metrics";
import { SeededRng } from "../prng";
import type { ClotPhase, ClotState, ScenarioConfig, SwarmState } from "../types";

export interface ClotUpdateContext {
  config: ScenarioConfig;
  stepSec: number;
  swarmState: Pick<SwarmState, "localizationRatio" | "coordinationScore">;
  rng: SeededRng;
}

export interface ClotUpdateTerms {
  directedLocalization: number;
  erosionTerm: number;
  penetrationTerm: number;
  burdenDrop: number;
}

export interface ClotUpdateResult {
  clot: ClotState;
  terms: ClotUpdateTerms;
}

function cloneClotState(clot: ClotState): ClotState {
  return { ...clot };
}

export function createClotState(config: ScenarioConfig): ClotState {
  return {
    phase: "stable",
    initialBurden: 1,
    currentBurden: 1,
    occlusionFraction: config.clot.occlusionFraction,
    erosionFront: 0,
    channelRadius: 0.04,
    fragmentEventLevel: 0,
  };
}

export function resolveClotVisualPhase(
  clot: Pick<ClotState, "currentBurden">,
  burdenDrop: number,
): ClotPhase {
  if (clot.currentBurden <= 0.08) {
    return "cleared";
  }

  if (clot.currentBurden <= 0.2) {
    return "channel_opening";
  }

  if (burdenDrop > 0.0002) {
    return "erosion";
  }

  return "incomplete";
}

export function updateClotState(
  currentClot: ClotState,
  context: ClotUpdateContext,
): ClotUpdateResult {
  const { config, rng, stepSec, swarmState } = context;
  const directedLocalization =
    swarmState.localizationRatio * (0.65 + config.field.localizationAssist * 0.35);
  const erosionTerm =
    0.018 *
    directedLocalization *
    config.swarm.effectiveSwarmFactor *
    config.field.strength *
    (1 - config.clot.size * 0.25);
  const penetrationTerm =
    0.012 *
    directedLocalization *
    swarmState.coordinationScore *
    config.field.corkscrewIntensity *
    config.swarm.coordinationGain;
  const burdenDrop = stepSec * (erosionTerm + penetrationTerm);

  const nextClot = cloneClotState(currentClot);
  nextClot.currentBurden = clamp(0, 1, nextClot.currentBurden - burdenDrop);
  nextClot.occlusionFraction = clamp(
    0,
    1,
    config.clot.occlusionFraction * (0.15 + nextClot.currentBurden * 0.85),
  );
  nextClot.erosionFront = clamp(0, 1, 1 - nextClot.currentBurden);
  nextClot.channelRadius = clamp(
    0.04,
    0.4,
    0.04 + (1 - nextClot.currentBurden) * 0.34,
  );
  nextClot.fragmentEventLevel = clamp(
    0,
    0.2,
    penetrationTerm * 4 + rng.next() * 0.01,
  );
  nextClot.phase = resolveClotVisualPhase(nextClot, burdenDrop);

  return {
    clot: nextClot,
    terms: {
      directedLocalization,
      erosionTerm,
      penetrationTerm,
      burdenDrop,
    },
  };
}
