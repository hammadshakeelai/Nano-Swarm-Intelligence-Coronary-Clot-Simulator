import type { SimulationPhase, SimulationSnapshot } from "../sim";
import {
  GUIDED_BEAT_BY_PHASE,
  GUIDED_BEATS,
  getGuidedPresentation,
  type GuidedBeat,
  type GuidedPresentation,
} from "./captionScript";

export interface GuidedSequenceStep {
  phase: SimulationPhase;
  beat: GuidedBeat;
  presentation: GuidedPresentation;
}

export function resolveGuidedSequenceStep(
  phase: SimulationPhase,
): GuidedSequenceStep {
  return {
    phase,
    beat: GUIDED_BEAT_BY_PHASE[phase],
    presentation: getGuidedPresentation(phase),
  };
}

export function collectGuidedSequenceSteps(
  phases: readonly SimulationPhase[],
): GuidedSequenceStep[] {
  const steps: GuidedSequenceStep[] = [];
  let previousBeat: GuidedBeat | null = null;

  for (const phase of phases) {
    const step = resolveGuidedSequenceStep(phase);
    if (step.beat !== previousBeat) {
      steps.push(step);
      previousBeat = step.beat;
    }
  }

  return steps;
}

export function collectGuidedSequenceFromSnapshots(
  snapshots: readonly SimulationSnapshot[],
): GuidedSequenceStep[] {
  return collectGuidedSequenceSteps(snapshots.map((snapshot) => snapshot.phase));
}

export function includesAllGuidedBeats(
  steps: readonly GuidedSequenceStep[],
): boolean {
  const beats = new Set(steps.map((step) => step.beat));
  return GUIDED_BEATS.every((beat) => beats.has(beat));
}
