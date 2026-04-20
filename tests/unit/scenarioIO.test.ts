import { describe, expect, it } from "vitest";

import {
  ScenarioIOError,
  deserializeScenarioConfig,
  exportScenarioDocument,
  parseScenarioConfigDocument,
  serializeScenarioConfig,
} from "../../src/schema/scenarioIO";
import { coronaryDefaultPreset } from "../../src/sim";

describe("scenarioIO", () => {
  it("includes the schema version in exported JSON", () => {
    const payload = JSON.parse(serializeScenarioConfig(coronaryDefaultPreset));

    expect(payload.version).toBe("2.0");
    expect(payload.scenarioId).toBe(coronaryDefaultPreset.scenarioId);
  });

  it("imports a valid scenario and normalizes recoverable values", () => {
    const imported = deserializeScenarioConfig(
      JSON.stringify({
        ...coronaryDefaultPreset,
        playback: {
          speed: 4.5,
        },
        seed: 42.8,
      }),
    );

    expect(imported.playback.speed).toBe(3);
    expect(imported.seed).toBe(43);
  });

  it("fails invalid imported scenarios with a useful validation error", () => {
    expect(
      () =>
        deserializeScenarioConfig(
          JSON.stringify({
            ...coronaryDefaultPreset,
            version: "1.0",
          }),
        ),
    ).toThrow(/version: Unsupported scenario version/i);
  });

  it("fails malformed JSON with a dedicated IO error", () => {
    expect(() => deserializeScenarioConfig("{")).toThrow(ScenarioIOError);
    expect(() => deserializeScenarioConfig("{")).toThrow(
      /could not be parsed/i,
    );
  });

  it("preserves the normalized config across export and import", () => {
    const source = {
      ...coronaryDefaultPreset,
      field: {
        ...coronaryDefaultPreset.field,
        directionDeg: 220,
      },
      swarm: {
        ...coronaryDefaultPreset.swarm,
        visibleCount: 22,
      },
    };

    const normalized = exportScenarioDocument(source);
    const roundTripped = parseScenarioConfigDocument(
      JSON.parse(serializeScenarioConfig(source)),
    );

    expect(roundTripped).toEqual(normalized);
  });
});
