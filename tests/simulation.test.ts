import { describe, expect, it } from "vitest";

import { GUIDED_RUNTIME_WINDOW_SEC } from "../src/guided/captionScript";
import {
  CoronarySimulation,
  coronaryDefaultPreset,
  coronaryPartialFailurePreset,
} from "../src/sim";

describe("CoronarySimulation", () => {
  it("replays deterministically with the same seed and parameters", () => {
    const simA = new CoronarySimulation(coronaryDefaultPreset);
    const simB = new CoronarySimulation(coronaryDefaultPreset);

    const runA = simA.runForTicks(1000);
    const runB = simB.runForTicks(1000);

    expect(runA).toEqual(runB);
  });

  it("keeps all metrics within required bounds across a long run", () => {
    const sim = new CoronarySimulation(coronaryDefaultPreset);
    const run = sim.runForTicks(1500);

    for (const snapshot of run) {
      expect(snapshot.metrics.clotBurdenPct).toBeGreaterThanOrEqual(0);
      expect(snapshot.metrics.clotBurdenPct).toBeLessThanOrEqual(100);
      expect(snapshot.metrics.svpiPct).toBeGreaterThanOrEqual(0);
      expect(snapshot.metrics.svpiPct).toBeLessThanOrEqual(100);
      expect(snapshot.metrics.localizationPct).toBeGreaterThanOrEqual(0);
      expect(snapshot.metrics.localizationPct).toBeLessThanOrEqual(100);
      expect(snapshot.metrics.coordinationScore).toBeGreaterThanOrEqual(0);
      expect(snapshot.metrics.coordinationScore).toBeLessThanOrEqual(1);
      expect(snapshot.clot.currentBurden).toBeGreaterThanOrEqual(0);
      expect(snapshot.clot.currentBurden).toBeLessThanOrEqual(1);
      expect(snapshot.clot.occlusionFraction).toBeGreaterThanOrEqual(0);
      expect(snapshot.clot.occlusionFraction).toBeLessThanOrEqual(1);
    }
  });

  it("progresses through the state machine and reaches results", () => {
    const sim = new CoronarySimulation(coronaryDefaultPreset);
    const run = sim.runForTicks(1600);
    const phases = new Set(run.map((snapshot) => snapshot.phase));

    expect(phases.has("context_intro")).toBe(true);
    expect(phases.has("navigation")).toBe(true);
    expect(phases.has("localization")).toBe(true);
    expect(
      phases.has("clot_interaction") || phases.has("channel_opening"),
    ).toBe(true);
    expect(run[run.length - 1]?.phase).toBe("results");
  });

  it("completes the default guided preset within the 40 to 60 second window", () => {
    const sim = new CoronarySimulation(coronaryDefaultPreset);
    let snapshot = sim.getRenderState().snapshot;

    while (snapshot.phase !== "results" && snapshot.tick < 2000) {
      snapshot = sim.step();
    }

    expect(snapshot.phase).toBe("results");
    expect(snapshot.timeSec).toBeGreaterThanOrEqual(
      GUIDED_RUNTIME_WINDOW_SEC.min,
    );
    expect(snapshot.timeSec).toBeLessThanOrEqual(GUIDED_RUNTIME_WINDOW_SEC.max);
  });

  it("supports a built-in partial-failure preset", () => {
    const sim = new CoronarySimulation(coronaryPartialFailurePreset);
    const run = sim.runForTicks(1600);
    const phases = new Set(run.map((snapshot) => snapshot.phase));

    expect(phases.has("partial_failure")).toBe(true);
    expect(run[run.length - 1]?.phase).toBe("results");
  });
});
