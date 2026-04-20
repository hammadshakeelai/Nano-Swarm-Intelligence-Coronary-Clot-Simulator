import { CENTRALIZED_DISCLAIMER_COPY } from "../safety/disclaimerText";
import type { CameraMode, ScenarioConfig } from "../sim";

export interface ViewportPngSource {
  exportPng(): string;
}

export interface ViewportPngOptions {
  camera: CameraMode;
  overlay: ScenarioConfig["view"]["overlay"];
  disclaimerText?: string;
  decorateDataUrl?: (
    dataUrl: string,
    disclaimerText: string,
  ) => Promise<string>;
}

export interface ViewportPngExport {
  mimeType: "image/png";
  dataUrl: string;
  camera: CameraMode;
  overlay: ScenarioConfig["view"]["overlay"];
  disclaimerApplied: boolean;
}

export class ViewportPngExportError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ViewportPngExportError";
  }
}

const PNG_DATA_URL_PREFIX = "data:image/png";

function isPngDataUrl(value: string): boolean {
  return value.startsWith(PNG_DATA_URL_PREFIX);
}

function decodeBase64(base64: string): number[] {
  if (typeof atob === "function") {
    const decoded = atob(base64);
    return Array.from(decoded, (character) => character.charCodeAt(0));
  }

  if (typeof Buffer !== "undefined") {
    return Array.from(Buffer.from(base64, "base64"));
  }

  throw new ViewportPngExportError(
    "PNG export could not decode base64 image data in this environment.",
  );
}

function dataUrlToBlob(dataUrl: string): Blob {
  const match = dataUrl.match(/^data:([^;,]+)(;base64)?,(.*)$/);
  if (!match) {
    throw new ViewportPngExportError(
      "Viewport PNG export did not produce a valid data URL.",
    );
  }

  const [, mimeType, base64Marker, payload] = match;

  if (base64Marker) {
    return new Blob([Uint8Array.from(decodeBase64(payload))], {
      type: mimeType,
    });
  }

  return new Blob([decodeURIComponent(payload)], { type: mimeType });
}

function loadImageFromDataUrl(dataUrl: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    if (typeof Image === "undefined") {
      reject(new ViewportPngExportError("Image decoding is unavailable."));
      return;
    }

    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () =>
      reject(new ViewportPngExportError("Failed to prepare PNG export."));
    image.src = dataUrl;
  });
}

function wrapCanvasText(
  context: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
): string[] {
  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const candidate = currentLine ? `${currentLine} ${word}` : word;
    if (context.measureText(candidate).width <= maxWidth || !currentLine) {
      currentLine = candidate;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) {
    lines.push(currentLine);
  }

  return lines;
}

export async function decorateViewportPngWithFooter(
  dataUrl: string,
  disclaimerText: string = CENTRALIZED_DISCLAIMER_COPY.text,
): Promise<string> {
  if (
    typeof document === "undefined" ||
    typeof Image === "undefined" ||
    !disclaimerText
  ) {
    return dataUrl;
  }

  const image = await loadImageFromDataUrl(dataUrl);
  const footerPadding = Math.max(22, Math.round(image.width * 0.028));
  const fontSize = Math.max(14, Math.round(image.width * 0.018));
  const lineHeight = Math.round(fontSize * 1.45);
  const footerCanvas = document.createElement("canvas");
  const context = footerCanvas.getContext("2d");

  if (!context) {
    return dataUrl;
  }

  context.font = `${fontSize}px "Trebuchet MS", "Segoe UI", sans-serif`;
  const disclaimerLines = wrapCanvasText(
    context,
    disclaimerText,
    image.width - footerPadding * 2,
  );
  const footerHeight = footerPadding * 2 + lineHeight * disclaimerLines.length;

  footerCanvas.width = image.width;
  footerCanvas.height = image.height + footerHeight;

  context.fillStyle = "#071118";
  context.fillRect(0, 0, footerCanvas.width, footerCanvas.height);
  context.drawImage(image, 0, 0);
  context.fillStyle = "#071118";
  context.fillRect(0, image.height, image.width, footerHeight);
  context.strokeStyle = "rgba(126, 230, 225, 0.26)";
  context.lineWidth = 2;
  context.beginPath();
  context.moveTo(footerPadding, image.height + 1);
  context.lineTo(image.width - footerPadding, image.height + 1);
  context.stroke();
  context.font = `${fontSize}px "Trebuchet MS", "Segoe UI", sans-serif`;
  context.fillStyle = "#effffc";

  disclaimerLines.forEach((line, index) => {
    context.fillText(
      line,
      footerPadding,
      image.height + footerPadding + fontSize + index * lineHeight,
    );
  });

  return footerCanvas.toDataURL("image/png");
}

export async function exportViewportPng(
  source: ViewportPngSource,
  options: ViewportPngOptions,
): Promise<ViewportPngExport> {
  const baseDataUrl = source.exportPng();
  if (!isPngDataUrl(baseDataUrl)) {
    throw new ViewportPngExportError(
      "Viewport PNG export did not produce a valid PNG data URL.",
    );
  }

  const disclaimerText = options.disclaimerText ?? CENTRALIZED_DISCLAIMER_COPY.text;
  let dataUrl = baseDataUrl;
  let disclaimerApplied = false;

  if (disclaimerText) {
    const decorateDataUrl =
      options.decorateDataUrl ?? decorateViewportPngWithFooter;

    try {
      dataUrl = await decorateDataUrl(baseDataUrl, disclaimerText);
      disclaimerApplied = dataUrl !== baseDataUrl;
    } catch {
      dataUrl = baseDataUrl;
      disclaimerApplied = false;
    }
  }

  if (!isPngDataUrl(dataUrl)) {
    throw new ViewportPngExportError(
      "Viewport PNG export did not produce a valid PNG data URL.",
    );
  }

  return {
    mimeType: "image/png",
    dataUrl,
    camera: options.camera,
    overlay: options.overlay,
    disclaimerApplied,
  };
}

export async function createViewportPngBlob(
  source: ViewportPngSource,
  options: ViewportPngOptions,
): Promise<Blob> {
  return dataUrlToBlob((await exportViewportPng(source, options)).dataUrl);
}
