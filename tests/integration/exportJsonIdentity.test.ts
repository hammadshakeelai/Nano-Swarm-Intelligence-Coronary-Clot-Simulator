import { describe, expect, it } from "vitest";

import {
  exportScenarioJson,
  exportScenarioJsonDocument,
  importScenarioJson,
} from "../../src/export/exportJson";
import { normalizeScenarioConfig } from "../../src/schema/scenario";
import {
  collectReplaySnapshots,
  coronaryPartialFailurePreset,
} from "../../src/sim";

describe("JSON export/import identity", () => {
  it("preserves normalized scenario semantics across export/import", () => {
    const denormalizedScenario = {
      ...coronaryPartialFailurePreset,
      seed: -12,
      playback: {
        ...coronaryPartialFailurePreset.playback,
        speed: 7,
      },
      field: {
        ...coronaryPartialFailurePreset.field,
        directionDeg: 270,
      },
      swarm: {
        ...coronaryPartialFailurePreset.swarm,
        visibleCount: 12,
      },
    };

    const exportedDocument = exportScenarioJsonDocument(denormalizedScenario);
    const restored = importScenarioJson(exportScenarioJson(denormalizedScenario));

    expect(restored).toEqual(exportedDocument);
    expect(restored).toEqual(normalizeScenarioConfig(denormalizedScenario));
  });

  it("keeps imported scenarios deterministic-ready for replay", () => {
    const payload = exportScenarioJson(coronaryPartialFailurePreset);
    const restored = importScenarioJson(payload);

    expect(collectReplaySnapshots(restored, 600)).toEqual(
      collectReplaySnapshots(coronaryPartialFailurePreset, 600),
    );
  });
});
