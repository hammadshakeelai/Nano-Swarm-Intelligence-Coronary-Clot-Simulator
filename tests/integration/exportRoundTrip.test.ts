import { describe, expect, it } from "vitest";

import { exportMetricsHistoryCsv } from "../../src/export/exportCsv";
import {
  exportScenarioJson,
  exportScenarioJsonDocument,
  importScenarioJson,
} from "../../src/export/exportJson";
import { exportViewportPng } from "../../src/export/exportPng";
import { normalizeScenarioConfig } from "../../src/schema/scenario";
import {
  ReplayController,
  collectReplaySnapshots,
  coronaryDefaultPreset,
  coronaryPartialFailurePreset,
} from "../../src/sim";

const SAMPLE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAggG2WQAAAABJRU5ErkJggg==";

describe("export round-trip integration", () => {
  it("preserves normalized scenario semantics and deterministic replay across JSON round-trip", () => {
    const denormalizedScenario = {
      ...coronaryPartialFailurePreset,
      seed: -44,
      playback: {
        ...coronaryPartialFailurePreset.playback,
        speed: 9,
      },
      field: {
        ...coronaryPartialFailurePreset.field,
        directionDeg: -260,
      },
      swarm: {
        ...coronaryPartialFailurePreset.swarm,
        visibleCount: 1204,
      },
    };

    const exportedDocument = exportScenarioJsonDocument(denormalizedScenario);
    const restored = importScenarioJson(exportScenarioJson(denormalizedScenario));

    expect(restored).toEqual(normalizeScenarioConfig(denormalizedScenario));
    expect(restored).toEqual(exportedDocument);
    expect(collectReplaySnapshots(restored, 180)).toEqual(
      collectReplaySnapshots(exportedDocument, 180),
    );
  });

  it("keeps CSV output ordered and deterministic for repeated seeded runs", () => {
    const first = new ReplayController(coronaryDefaultPreset);
    const second = new ReplayController(coronaryDefaultPreset);

    for (let step = 0; step < 18; step += 1) {
      first.step();
      second.step();
    }

    const firstHistory = first.getMetricsHistory();
    const secondHistory = second.getMetricsHistory();
    const firstCsv = exportMetricsHistoryCsv(firstHistory);
    const secondCsv = exportMetricsHistoryCsv(secondHistory);
    const rows = firstCsv.split("\n");

    expect(firstCsv).toBe(secondCsv);
    expect(rows).toHaveLength(firstHistory.length + 1);

    firstHistory.forEach((entry, index) => {
      expect(rows[index + 1]).toBe(
        [
          entry.tick,
          entry.timeSec.toFixed(3),
          entry.phase,
          entry.clotBurdenPct.toFixed(3),
          entry.svpiPct.toFixed(3),
          entry.localizationPct.toFixed(3),
          entry.coordinationScore.toFixed(3),
        ].join(","),
      );
    });

    expect(secondHistory).toEqual(firstHistory);
  });

  it("leaves runtime state unchanged during PNG export", async () => {
    const controller = new ReplayController(coronaryDefaultPreset);
    controller.scrubToTick(140);

    const before = controller.getRuntime();

    await exportViewportPng(
      { exportPng: () => SAMPLE_PNG_DATA_URL },
      {
        camera: before.presentation.camera,
        overlay: before.presentation.overlay,
        decorateDataUrl: async (dataUrl) => dataUrl,
      },
    );

    expect(controller.getRuntime()).toEqual(before);
  });

  it("keeps runtime truth intact across mixed JSON, CSV, and PNG export usage", async () => {
    const controller = new ReplayController(coronaryDefaultPreset);
    controller.scrubToTick(96);

    const beforeRuntime = controller.getRuntime();
    const beforeHistory = controller.getMetricsHistory();
    const beforeSourceConfig = controller.getSourceConfig();

    const jsonPayload = exportScenarioJson(beforeSourceConfig);
    const restoredScenario = importScenarioJson(jsonPayload);
    const csvPayload = exportMetricsHistoryCsv(beforeHistory);
    const pngExport = await exportViewportPng(
      { exportPng: () => SAMPLE_PNG_DATA_URL },
      {
        camera: beforeRuntime.presentation.camera,
        overlay: beforeRuntime.presentation.overlay,
        decorateDataUrl: async (dataUrl) => dataUrl,
      },
    );

    expect(csvPayload.split("\n")).toHaveLength(beforeHistory.length + 1);
    expect(pngExport.dataUrl).toBe(SAMPLE_PNG_DATA_URL);
    expect(controller.getRuntime()).toEqual(beforeRuntime);
    expect(controller.getMetricsHistory()).toEqual(beforeHistory);
    expect(controller.getSourceConfig()).toEqual(beforeSourceConfig);
    expect(collectReplaySnapshots(restoredScenario, 160)).toEqual(
      collectReplaySnapshots(beforeSourceConfig, 160),
    );
  });
});
