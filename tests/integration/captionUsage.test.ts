import { describe, expect, it } from "vitest";

import {
  GUIDED_BEAT_BY_PHASE,
  GUIDED_CAPTION_BY_BEAT,
  getGuidedCaptionForPhase,
  getGuidedPresentation,
} from "../../src/guided/captionScript";
import type { SimulationPhase } from "../../src/sim";

const GUIDED_PHASES: SimulationPhase[] = [
  "idle",
  "context_intro",
  "vessel_zoom",
  "clot_identified",
  "injection",
  "navigation",
  "localization",
  "clot_interaction",
  "channel_opening",
  "success",
  "partial_failure",
  "results",
];

describe("guided caption usage", () => {
  it("resolves every guided phase through the centralized caption source", () => {
    for (const phase of GUIDED_PHASES) {
      const expectedCaption = GUIDED_CAPTION_BY_BEAT[GUIDED_BEAT_BY_PHASE[phase]];

      expect(getGuidedCaptionForPhase(phase)).toBe(expectedCaption);
      expect(getGuidedPresentation(phase).caption).toBe(expectedCaption);
    }
  });

  it("keeps the results caption aligned across the guided flow", () => {
    expect(getGuidedPresentation("partial_failure").caption).toBe(
      GUIDED_CAPTION_BY_BEAT.results,
    );
    expect(getGuidedPresentation("results").caption).toBe(
      GUIDED_CAPTION_BY_BEAT.results,
    );
  });
});
