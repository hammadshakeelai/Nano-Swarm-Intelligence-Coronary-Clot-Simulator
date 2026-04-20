import { describe, expect, it } from "vitest";

import {
  KEYBOARD_SHORTCUTS,
  SHORTCUT_HINT_TEXT,
} from "../src/accessibility/keyboardMap";
import { GUIDED_CAPTION_SCRIPT } from "../src/guided/captionScript";
import {
  deserializeScenarioConfig,
  serializeScenarioConfig,
  validateScenarioConfig,
} from "../src/schema/scenario";
import {
  PRIMARY_METRIC_LABEL,
  PRIMARY_METRIC_TOOLTIP,
} from "../src/safety/bannedCopy";
import { MANDATORY_DISCLAIMER_TEXT } from "../src/safety/disclaimerText";
import { runSafetyAudit } from "../src/safety/safetyAudit";
import {
  collectReplaySnapshots,
  coronaryDefaultPreset,
  coronaryPresets,
  coronaryPartialFailurePreset,
} from "../src/sim";

describe("project compliance", () => {
  it("ships two built-in presets that validate successfully", () => {
    expect(coronaryPresets).toHaveLength(2);

    for (const preset of coronaryPresets) {
      const result = validateScenarioConfig(preset.config);
      expect(result.valid).toBe(true);
      expect(result.config?.vessel.preset).toBe(preset.id);
    }
  });

  it("round-trips JSON without breaking deterministic replay", () => {
    const originalJson = serializeScenarioConfig(coronaryDefaultPreset);
    const restored = deserializeScenarioConfig(originalJson);

    const originalRun = collectReplaySnapshots(coronaryDefaultPreset, 600);
    const restoredRun = collectReplaySnapshots(restored, 600);

    expect(restoredRun).toEqual(originalRun);
  });

  it("rejects unsupported scenario versions during import", () => {
    const invalid = {
      ...coronaryDefaultPreset,
      version: "1.0",
    };

    expect(() => deserializeScenarioConfig(JSON.stringify(invalid))).toThrow(
      /Unsupported scenario version/i,
    );
  });

  it("keeps the exact six guided captions from the SRS", () => {
    expect(GUIDED_CAPTION_SCRIPT.map((line) => line.caption)).toEqual([
      "A clot is blocking blood movement through a coronary artery segment.",
      "A microrobot-inspired swarm is introduced upstream.",
      "An external guidance field helps localize the swarm near the clot.",
      "The swarm coordinates near the clot surface and increases local interaction.",
      "The clot erodes and the vessel channel reopens.",
      "This result is illustrative and not a clinical prediction.",
    ]);
  });

  it("uses approved safety copy and avoids banned wording in shipped strings", () => {
    expect(PRIMARY_METRIC_LABEL).toBe("Simulated Vessel Patency Index (%)");
    expect(PRIMARY_METRIC_TOOLTIP).toBe(
      "Educational index of how open the simulated vessel appears. Not a measured blood-flow value.",
    );

    const findings = runSafetyAudit([
      { label: "disclaimer", text: MANDATORY_DISCLAIMER_TEXT },
      { label: "metric-label", text: PRIMARY_METRIC_LABEL },
      { label: "metric-tooltip", text: PRIMARY_METRIC_TOOLTIP },
      { label: "shortcut-hint", text: SHORTCUT_HINT_TEXT },
      ...GUIDED_CAPTION_SCRIPT.map((line) => ({
        label: `caption:${line.beat}`,
        text: line.caption,
      })),
      ...KEYBOARD_SHORTCUTS.map((shortcut) => ({
        label: `shortcut:${shortcut.keys}`,
        text: shortcut.description,
      })),
    ]);

    expect(findings).toEqual([]);
  });

  it("preserves the partial-failure preset through JSON serialization", () => {
    const restored = deserializeScenarioConfig(
      serializeScenarioConfig(coronaryPartialFailurePreset),
    );
    expect(restored.vessel.preset).toBe("lad_partial");
    expect(restored.vessel.curveVariant).toBe("straight");
  });
});
