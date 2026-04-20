import { describe, expect, it } from "vitest";

import {
  advancePhase,
  canTransition,
  replayPhase,
  resetPhase,
  resolveNextPhase,
  tryTransitionPhase,
} from "../../src/sim/core/phaseMachine";

describe("phaseMachine", () => {
  it("allows the legal forward transitions from idle to results", () => {
    expect(canTransition("idle", "context_intro")).toBe(true);
    expect(canTransition("context_intro", "vessel_zoom")).toBe(true);
    expect(canTransition("vessel_zoom", "clot_identified")).toBe(true);
    expect(canTransition("clot_identified", "injection")).toBe(true);
    expect(canTransition("injection", "navigation")).toBe(true);
    expect(canTransition("navigation", "localization")).toBe(true);
    expect(canTransition("localization", "clot_interaction")).toBe(true);
    expect(canTransition("clot_interaction", "channel_opening")).toBe(true);
    expect(canTransition("channel_opening", "success")).toBe(true);
    expect(canTransition("success", "results")).toBe(true);
  });

  it("supports the success branch", () => {
    expect(
      resolveNextPhase("channel_opening", 35, { currentBurden: 0.07 }),
    ).toBe("success");
    expect(resolveNextPhase("success", 36.1, { currentBurden: 0.07 })).toBe(
      "results",
    );
  });

  it("supports the partial-failure branch", () => {
    expect(
      resolveNextPhase("channel_opening", 42.1, { currentBurden: 0.12 }),
    ).toBe("partial_failure");
    expect(
      resolveNextPhase("partial_failure", 45.1, { currentBurden: 0.12 }),
    ).toBe("results");
  });

  it("rejects invalid transitions safely", () => {
    const attempt = tryTransitionPhase("idle", "navigation");

    expect(attempt.valid).toBe(false);
    expect(attempt.phase).toBe("idle");
    expect(attempt.reason).toMatch(/illegal phase transition/i);
  });

  it("supports reset back to idle", () => {
    expect(resetPhase("results")).toBe("idle");
  });

  it("supports replay back to injection and resumes the flow", () => {
    const replayedPhase = replayPhase("results");

    expect(replayedPhase).toBe("injection");
    expect(
      advancePhase(replayedPhase, {
        timeSec: 9.1,
        clotBurden: 1,
      }),
    ).toBe("navigation");
  });
});
