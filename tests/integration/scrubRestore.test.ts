import { describe, expect, it } from "vitest";

import { cloneScenarioConfig } from "../../src/schema/scenario";
import {
  ReplayController,
  coronaryDefaultPreset,
} from "../../src/sim";

describe("scrub restoration", () => {
  it("restores the same state repeatedly for the same scrub target", () => {
    const controller = new ReplayController(coronaryDefaultPreset);

    const firstRestore = controller.scrubToTick(180);
    controller.replay();
    const secondRestore = controller.scrubToTick(180);

    expect(secondRestore.simulation).toEqual(firstRestore.simulation);
    expect(secondRestore.timeline.currentTick).toBe(180);
    expect(secondRestore.replay.resolvedTick).toBe(180);
  });

  it("does not mutate the original scenario config during scrub restore", () => {
    const inputConfig = cloneScenarioConfig(coronaryDefaultPreset);
    const originalConfig = cloneScenarioConfig(coronaryDefaultPreset);
    const controller = new ReplayController(inputConfig);

    controller.scrubToTick(220);
    controller.scrubToTick(40);

    expect(inputConfig).toEqual(originalConfig);
  });
});
