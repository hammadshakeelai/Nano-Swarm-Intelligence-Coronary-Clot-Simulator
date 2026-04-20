import { describe, expect, it } from "vitest";

import {
  ReplayController,
  coronaryPartialFailurePreset,
} from "../../src/sim";

function runReplayCycle() {
  const controller = new ReplayController(coronaryPartialFailurePreset);

  return [
    controller.scrubToTick(90),
    controller.replay(),
    controller.scrubToTick(210),
    controller.reset(),
    controller.scrubToTick(135),
  ].map((runtime) => ({
    replay: runtime.replay,
    timeline: runtime.timeline,
    snapshot: runtime.simulation.snapshot,
  }));
}

describe("replay determinism", () => {
  it("keeps repeated replay and scrub cycles deterministic", () => {
    expect(runReplayCycle()).toEqual(runReplayCycle());
  });
});
