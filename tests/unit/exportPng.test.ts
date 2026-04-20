import { describe, expect, it } from "vitest";

import {
  ViewportPngExportError,
  createViewportPngBlob,
  exportViewportPng,
} from "../../src/export/exportPng";

const SAMPLE_PNG_DATA_URL =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVQImWNgYGD4DwABBAEAggG2WQAAAABJRU5ErkJggg==";

describe("PNG export module", () => {
  it("returns a PNG-oriented export object and blob", async () => {
    const source = {
      exportPng: () => SAMPLE_PNG_DATA_URL,
    };

    const exported = await exportViewportPng(source, {
      camera: "overview",
      overlay: "clean",
      decorateDataUrl: async (dataUrl) => dataUrl,
    });
    const blob = await createViewportPngBlob(source, {
      camera: "overview",
      overlay: "clean",
      decorateDataUrl: async (dataUrl) => dataUrl,
    });

    expect(exported.mimeType).toBe("image/png");
    expect(exported.dataUrl).toBe(SAMPLE_PNG_DATA_URL);
    expect(exported.camera).toBe("overview");
    expect(exported.overlay).toBe("clean");
    expect(blob.type).toBe("image/png");
  });

  it("preserves active camera and overlay metadata in the export path", async () => {
    const exported = await exportViewportPng(
      { exportPng: () => SAMPLE_PNG_DATA_URL },
      {
        camera: "fluoro",
        overlay: "fluoro",
        decorateDataUrl: async (dataUrl) => dataUrl,
      },
    );

    expect(exported.camera).toBe("fluoro");
    expect(exported.overlay).toBe("fluoro");
  });

  it("fails cleanly on empty or invalid capture output", async () => {
    await expect(
      exportViewportPng(
        {
          exportPng: () => "",
        },
        {
          camera: "overview",
          overlay: "clean",
        },
      ),
    ).rejects.toThrowError(ViewportPngExportError);
  });
});
