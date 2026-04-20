import { describe, expect, it } from "vitest";

import {
  ReplayController,
  coronaryDefaultPreset,
  type SimulationSnapshot,
} from "../../src/sim";

function collectStepSequence(controller: ReplayController, ticks: number) {
  const snapshots: SimulationSnapshot[] = [];

  for (let index = 0; index < ticks; index += 1) {
    snapshots.push(controller.step().simulation.snapshot);
  }

  return snapshots;
}

describe("replay controller", () => {
  it("replay returns to a seed-consistent state", () => {
    const controller = new ReplayController(coronaryDefaultPreset);

    collectStepSequence(controller, 120);
    controller.replay();

    const replayedSequence = collectStepSequence(controller, 90);
    const freshSequence = collectStepSequence(
      new ReplayController(coronaryDefaultPreset),
      90,
    );

    expect(replayedSequence).toEqual(freshSequence);
  }, 10000);

  it("camera and overlay changes do not alter simulation truth", () => {
    const controller = new ReplayController(coronaryDefaultPreset);
    controller.scrubToTick(140);

    const before = controller.getRuntime();
    const after = controller.setPresentationView({
      camera: "fluoro",
      overlay: "fluoro",
    });

    expect(after.simulation).toEqual(before.simulation);
    expect(after.timeline).toEqual(before.timeline);
    expect(after.presentation).toEqual({
      camera: "fluoro",
      overlay: "fluoro",
    });
  });
});
