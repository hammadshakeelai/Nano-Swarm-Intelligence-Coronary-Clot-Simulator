import { describe, expect, it } from "vitest";

import {
  ReplayController,
  coronaryDefaultPreset,
} from "../../src/sim";

describe("metrics determinism", () => {
  it("produces identical metric history for the same scenario and seed", () => {
    const controllerA = new ReplayController(coronaryDefaultPreset);
    const controllerB = new ReplayController(coronaryDefaultPreset);

    expect(controllerA.collectMetricsHistory(320)).toEqual(
      controllerB.collectMetricsHistory(320),
    );
  });

  it("reconstructs deterministic metric history for the same scrub target", () => {
    const controller = new ReplayController(coronaryDefaultPreset);

    controller.scrubToTick(210);
    const firstHistory = controller.getMetricsHistory();

    controller.replay();
    controller.scrubToTick(210);
    const secondHistory = controller.getMetricsHistory();

    expect(secondHistory).toEqual(firstHistory);
  });

  it("keeps metric history aligned with simulation tick order and current state", () => {
    const controller = new ReplayController(coronaryDefaultPreset);
    const runtime = controller.scrubToTick(160);
    const history = controller.getMetricsHistory();
    const latest = history[history.length - 1];

    expect(history).toHaveLength(161);
    expect(history.every((entry, index) => entry.tick === index)).toBe(true);
    expect(latest).toMatchObject(runtime.metrics.current);
    expect(latest?.tick).toBe(runtime.timeline.currentTick);
    expect(latest?.phase).toBe(runtime.simulation.snapshot.phase);
    expect(latest?.timeSec).toBe(runtime.simulation.snapshot.timeSec);
  });
});
