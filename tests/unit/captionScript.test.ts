import { describe, expect, it } from "vitest";

import {
  GUIDED_BEAT_BY_PHASE,
  GUIDED_BEATS,
  GUIDED_CAPTION_BY_BEAT,
  GUIDED_CAPTION_SCRIPT,
  GUIDED_CAPTION_SEQUENCE,
} from "../../src/guided/captionScript";

describe("guided caption script", () => {
  it("matches the exact six approved SRS captions", () => {
    expect(GUIDED_CAPTION_SEQUENCE).toEqual([
      "A clot is blocking blood movement through a coronary artery segment.",
      "A microrobot-inspired swarm is introduced upstream.",
      "An external guidance field helps localize the swarm near the clot.",
      "The swarm coordinates near the clot surface and increases local interaction.",
      "The clot erodes and the vessel channel reopens.",
      "This result is illustrative and not a clinical prediction.",
    ]);
  });

  it("keeps the guided beats in the required order", () => {
    expect(GUIDED_BEATS).toEqual([
      "intro",
      "injection",
      "field",
      "interaction",
      "reopening",
      "results",
    ]);
    expect(GUIDED_CAPTION_SCRIPT.map((line) => line.beat)).toEqual(GUIDED_BEATS);
  });

  it("covers every simulation phase through a beat mapping", () => {
    expect(GUIDED_BEAT_BY_PHASE).toMatchObject({
      idle: "intro",
      context_intro: "intro",
      vessel_zoom: "intro",
      clot_identified: "intro",
      injection: "injection",
      navigation: "field",
      localization: "field",
      clot_interaction: "interaction",
      channel_opening: "reopening",
      success: "reopening",
      partial_failure: "results",
      results: "results",
    });

    expect(GUIDED_CAPTION_BY_BEAT[GUIDED_BEAT_BY_PHASE.results]).toBe(
      "This result is illustrative and not a clinical prediction.",
    );
  });
});
