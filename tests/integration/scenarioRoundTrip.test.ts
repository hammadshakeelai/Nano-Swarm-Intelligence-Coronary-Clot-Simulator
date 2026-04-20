import { describe, expect, it } from "vitest";

import {
  deserializeScenarioConfig,
  exportScenarioDocument,
  serializeScenarioConfig,
} from "../../src/schema/scenarioIO";
import { collectReplaySnapshots, coronaryDefaultPreset } from "../../src/sim";

describe("scenario round trip", () => {
  it("preserves normalized config semantics and deterministic replay after export/import", () => {
    const source = {
      ...coronaryDefaultPreset,
      clot: {
        ...coronaryDefaultPreset.clot,
        size: 1.2,
      },
      playback: {
        speed: 3.8,
      },
      seed: 314.4,
    };

    const normalized = exportScenarioDocument(source);
    const restored = deserializeScenarioConfig(serializeScenarioConfig(source));

    expect(restored).toEqual(normalized);

    const originalRun = collectReplaySnapshots(normalized, 600);
    const restoredRun = collectReplaySnapshots(restored, 600);

    expect(restoredRun).toEqual(originalRun);
  });
});
