import { describe, expect, it } from "vitest";

import { exportViewportPng } from "../../src/export/exportPng";
import { ReplayController, coronaryDefaultPreset } from "../../src/sim";

const SAMPLE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAggG2WQAAAABJRU5ErkJggg==";

describe("PNG export integration", () => {
  it("does not mutate simulation state while exporting", async () => {
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

  it("keeps repeated exports stable for the same rendered state", async () => {
    const controller = new ReplayController(coronaryDefaultPreset);
    const runtime = controller
      .scrubToTick(80)
      .presentation;

    const source = { exportPng: () => SAMPLE_PNG_DATA_URL };
    const options = {
      camera: runtime.camera,
      overlay: runtime.overlay,
      decorateDataUrl: async (dataUrl: string) => dataUrl,
    };

    await expect(exportViewportPng(source, options)).resolves.toEqual(
      await exportViewportPng(source, options),
    );
  });
});
