import { describe, expect, it } from "vitest";

import {
  GUIDED_CAPTION_BY_BEAT,
  GUIDED_CAPTION_SEQUENCE,
  GUIDED_RUNTIME_WINDOW_SEC,
} from "../../src/guided/captionScript";
import {
  collectGuidedSequenceFromSnapshots,
  includesAllGuidedBeats,
} from "../../src/guided/guidedSequence";
import {
  CoronarySimulation,
  coronaryDefaultPreset,
  type SimulationSnapshot,
} from "../../src/sim";

function runGuidedMode(
  config = coronaryDefaultPreset,
  maxTicks = 2000,
): SimulationSnapshot[] {
  const simulation = new CoronarySimulation(config);
  const snapshots = [simulation.getRenderState().snapshot];

  while (
    snapshots[snapshots.length - 1]?.phase !== "results" &&
    snapshots.length < maxTicks
  ) {
    snapshots.push(simulation.step());
  }

  return snapshots;
}

describe("guided mode validation", () => {
  it("emits centralized captions for all major guided beats in the correct order", () => {
    const snapshots = runGuidedMode();
    const guidedSteps = collectGuidedSequenceFromSnapshots(snapshots);

    expect(includesAllGuidedBeats(guidedSteps)).toBe(true);
    expect(guidedSteps.map((step) => step.beat)).toEqual([
      "intro",
      "injection",
      "field",
      "interaction",
      "reopening",
      "results",
    ]);
    expect(guidedSteps.map((step) => step.presentation.caption)).toEqual(
      GUIDED_CAPTION_SEQUENCE,
    );

    for (const step of guidedSteps) {
      expect(step.presentation.caption).toBe(GUIDED_CAPTION_BY_BEAT[step.beat]);
    }
  });

  it("reaches results end-to-end and ends on the final illustrative caption", () => {
    const snapshots = runGuidedMode();
    const finalSnapshot = snapshots[snapshots.length - 1];
    const guidedSteps = collectGuidedSequenceFromSnapshots(snapshots);

    expect(finalSnapshot?.phase).toBe("results");
    expect(finalSnapshot?.timeSec).toBeGreaterThanOrEqual(
      GUIDED_RUNTIME_WINDOW_SEC.min,
    );
    expect(finalSnapshot?.timeSec).toBeLessThanOrEqual(
      GUIDED_RUNTIME_WINDOW_SEC.max,
    );
    expect(guidedSteps[guidedSteps.length - 1]?.presentation.caption).toBe(
      GUIDED_CAPTION_BY_BEAT.results,
    );
  });

  it("remains deterministic under the same guided seed and config", () => {
    const runA = collectGuidedSequenceFromSnapshots(runGuidedMode());
    const runB = collectGuidedSequenceFromSnapshots(runGuidedMode());

    expect(runA).toEqual(runB);
  });
});
