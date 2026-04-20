import { describe, expect, it } from "vitest";

import {
  canTransition,
  CoronarySimulation,
  coronaryDefaultPreset,
  coronaryPartialFailurePreset,
  isTerminalPhase,
  type SimulationPhase,
} from "../../src/sim";

function collectPhaseSequence(
  simulation: CoronarySimulation,
  maxTicks = 1800,
): SimulationPhase[] {
  const phases: SimulationPhase[] = [simulation.getRenderState().snapshot.phase];

  while (phases.length <= maxTicks) {
    const snapshot = simulation.step();
    const lastPhase = phases[phases.length - 1];

    if (snapshot.phase !== lastPhase) {
      phases.push(snapshot.phase);
    }

    if (isTerminalPhase(snapshot.phase)) {
      break;
    }
  }

  return phases;
}

describe("phase progression integration", () => {
  it("follows only legal transitions for the default preset and reaches results", () => {
    const phases = collectPhaseSequence(
      new CoronarySimulation(coronaryDefaultPreset),
    );

    expect(phases[0]).toBe("idle");
    expect(phases).toContain("context_intro");
    expect(phases).toContain("navigation");
    expect(phases).toContain("localization");
    expect(phases).toContain("clot_interaction");
    expect(phases).toContain("channel_opening");
    expect(phases[phases.length - 1]).toBe("results");

    for (let index = 0; index < phases.length - 1; index += 1) {
      expect(canTransition(phases[index], phases[index + 1])).toBe(true);
    }
  });

  it("follows the legal partial-failure sequence for the partial preset", () => {
    const phases = collectPhaseSequence(
      new CoronarySimulation(coronaryPartialFailurePreset),
    );

    expect(phases).toEqual([
      "idle",
      "context_intro",
      "vessel_zoom",
      "clot_identified",
      "injection",
      "navigation",
      "localization",
      "clot_interaction",
      "channel_opening",
      "partial_failure",
      "results",
    ]);

    for (let index = 0; index < phases.length - 1; index += 1) {
      expect(canTransition(phases[index], phases[index + 1])).toBe(true);
    }
  });
});
