import { describe, expect, it } from "vitest";

import { CoronarySimulation, coronaryPartialFailurePreset } from "../../src/sim";

function runSimulation(config: ConstructorParameters<typeof CoronarySimulation>[0]) {
  const simulation = new CoronarySimulation(config);
  const snapshots = [simulation.getRenderState().snapshot];

  while (
    snapshots[snapshots.length - 1]?.phase !== "results" &&
    snapshots.length < 2200
  ) {
    snapshots.push(simulation.step());
  }

  return snapshots;
}

describe("clot and outcome flow integration", () => {
  it("keeps clot burden decreasing monotonically in a supportive success-oriented run", () => {
    const supportiveConfig = {
      ...coronaryPartialFailurePreset,
      scenarioId: "coronary_supportive_success",
      clot: {
        ...coronaryPartialFailurePreset.clot,
        size: 0.2,
        occlusionFraction: 0.45,
      },
      flow: {
        ...coronaryPartialFailurePreset.flow,
        speed: 0,
      },
      swarm: {
        ...coronaryPartialFailurePreset.swarm,
        visibleCount: 1000,
        effectiveSwarmFactor: 1,
        concentrationFactor: 1,
        cohesionGain: 1,
        coordinationGain: 1,
      },
      field: {
        ...coronaryPartialFailurePreset.field,
        strength: 1,
        localizationAssist: 1,
        corkscrewIntensity: 1,
      },
      seed: 211,
    };
    const snapshots = runSimulation(supportiveConfig);

    for (let index = 1; index < snapshots.length; index += 1) {
      expect(snapshots[index]?.clot.currentBurden).toBeLessThanOrEqual(
        snapshots[index - 1]?.clot.currentBurden ?? 1,
      );
    }

    expect(snapshots.some((snapshot) => snapshot.phase === "success")).toBe(
      true,
    );
    expect(snapshots[snapshots.length - 1]?.outcome).toBe("success");
  });

  it("keeps partial failure reachable under weak settings", () => {
    const snapshots = runSimulation(coronaryPartialFailurePreset);

    expect(
      snapshots.some((snapshot) => snapshot.phase === "partial_failure"),
    ).toBe(true);
    expect(snapshots[snapshots.length - 1]?.outcome).toBe("partial_failure");
  });

  it("remains deterministic over repeated runs with the same seed and config", () => {
    const weakConfig = {
      ...coronaryPartialFailurePreset,
      seed: 314,
    };

    expect(runSimulation(weakConfig)).toEqual(runSimulation(weakConfig));
  });
});
