import type { CameraMode, ScenarioConfig } from "../sim";

export type KeyboardActionId =
  | "togglePlayback"
  | "step"
  | "replay"
  | "reset"
  | "toggleReducedMotion"
  | "openDisclaimer"
  | "closeDisclaimer"
  | "toggleOverlay"
  | "setCameraOverview"
  | "setCameraFollowSwarm"
  | "setCameraClotCloseup"
  | "setCameraFluoro";

export type PrimaryKeyboardControl =
  | "play"
  | "pause"
  | "reset"
  | "replay"
  | "step"
  | "camera"
  | "overlay"
  | "disclaimer";

export interface KeyboardShortcut {
  action: KeyboardActionId | "cameraKeys";
  keys: string;
  description: string;
  scope: "global" | "explore" | "modal";
  covers: PrimaryKeyboardControl[];
}

export interface KeyboardShortcutContext {
  modalOpen: boolean;
  mode: ScenarioConfig["mode"];
  activeTag?: string | null;
}

export interface KeyboardEventLike {
  key: string;
  code?: string;
}

export interface KeyboardShortcutHandlers {
  togglePlayback(): void;
  step(): void;
  replay(): void;
  reset(): void;
  toggleReducedMotion(): void;
  openDisclaimer(): void;
  closeDisclaimer(): void;
  toggleOverlay(): void;
  setCamera(camera: CameraMode): void;
}

export interface KeyboardDispatchResult {
  action: KeyboardActionId | null;
  handled: boolean;
}

export const REQUIRED_PRIMARY_KEYBOARD_CONTROLS: PrimaryKeyboardControl[] = [
  "play",
  "pause",
  "reset",
  "replay",
  "step",
  "camera",
  "overlay",
  "disclaimer",
];

export const KEYBOARD_SHORTCUTS: KeyboardShortcut[] = [
  {
    action: "togglePlayback",
    keys: "Space",
    description: "Play or pause the simulation.",
    scope: "global",
    covers: ["play", "pause"],
  },
  {
    action: "step",
    keys: "S or Right Arrow",
    description: "Advance one simulation step.",
    scope: "global",
    covers: ["step"],
  },
  {
    action: "replay",
    keys: "R",
    description: "Replay the current seeded scenario from the beginning.",
    scope: "global",
    covers: ["replay"],
  },
  {
    action: "reset",
    keys: "Home",
    description: "Reset the simulation to the current preset start state.",
    scope: "global",
    covers: ["reset"],
  },
  {
    action: "cameraKeys",
    keys: "1-4",
    description: "Switch camera modes while in Explore mode.",
    scope: "explore",
    covers: ["camera"],
  },
  {
    action: "toggleOverlay",
    keys: "F",
    description: "Toggle the fluoro overlay while in Explore mode.",
    scope: "explore",
    covers: ["overlay"],
  },
  {
    action: "toggleReducedMotion",
    keys: "M",
    description: "Toggle reduced motion mode.",
    scope: "global",
    covers: [],
  },
  {
    action: "openDisclaimer",
    keys: "D",
    description: "Open the disclaimer and help modal.",
    scope: "global",
    covers: ["disclaimer"],
  },
  {
    action: "closeDisclaimer",
    keys: "Escape",
    description: "Close the disclaimer modal.",
    scope: "modal",
    covers: ["disclaimer"],
  },
];

function isFormFieldTag(activeTag?: string | null): boolean {
  return ["INPUT", "SELECT", "TEXTAREA"].includes(
    activeTag?.toUpperCase() ?? "",
  );
}

export function buildShortcutHint(shortcuts = KEYBOARD_SHORTCUTS): string {
  return shortcuts
    .map((shortcut) => `${shortcut.keys} ${shortcut.description}`)
    .join(" ");
}

export function getCameraForKeyboardAction(
  action: KeyboardActionId,
): CameraMode | null {
  switch (action) {
    case "setCameraOverview":
      return "overview";
    case "setCameraFollowSwarm":
      return "followSwarm";
    case "setCameraClotCloseup":
      return "clotCloseup";
    case "setCameraFluoro":
      return "fluoro";
    default:
      return null;
  }
}

export function resolveKeyboardShortcutAction(
  event: KeyboardEventLike,
  context: KeyboardShortcutContext,
): KeyboardActionId | null {
  if (context.modalOpen) {
    return event.key === "Escape" ? "closeDisclaimer" : null;
  }

  if (isFormFieldTag(context.activeTag)) {
    return null;
  }

  if (event.code === "Space" || event.key === " ") {
    return "togglePlayback";
  }

  if (event.key === "ArrowRight" || event.key.toLowerCase() === "s") {
    return "step";
  }

  if (event.key.toLowerCase() === "r") {
    return "replay";
  }

  if (event.key === "Home") {
    return "reset";
  }

  if (event.key.toLowerCase() === "m") {
    return "toggleReducedMotion";
  }

  if (event.key.toLowerCase() === "d") {
    return "openDisclaimer";
  }

  if (context.mode !== "explore") {
    return null;
  }

  if (event.key.toLowerCase() === "f") {
    return "toggleOverlay";
  }

  switch (event.key) {
    case "1":
      return "setCameraOverview";
    case "2":
      return "setCameraFollowSwarm";
    case "3":
      return "setCameraClotCloseup";
    case "4":
      return "setCameraFluoro";
    default:
      return null;
  }
}

export function dispatchKeyboardShortcut(
  event: KeyboardEventLike,
  context: KeyboardShortcutContext,
  handlers: KeyboardShortcutHandlers,
): KeyboardDispatchResult {
  const action = resolveKeyboardShortcutAction(event, context);

  if (!action) {
    return {
      action: null,
      handled: false,
    };
  }

  switch (action) {
    case "togglePlayback":
      handlers.togglePlayback();
      break;
    case "step":
      handlers.step();
      break;
    case "replay":
      handlers.replay();
      break;
    case "reset":
      handlers.reset();
      break;
    case "toggleReducedMotion":
      handlers.toggleReducedMotion();
      break;
    case "openDisclaimer":
      handlers.openDisclaimer();
      break;
    case "closeDisclaimer":
      handlers.closeDisclaimer();
      break;
    case "toggleOverlay":
      handlers.toggleOverlay();
      break;
    case "setCameraOverview":
    case "setCameraFollowSwarm":
    case "setCameraClotCloseup":
    case "setCameraFluoro": {
      const camera = getCameraForKeyboardAction(action);
      if (camera) {
        handlers.setCamera(camera);
      }
      break;
    }
  }

  return {
    action,
    handled: true,
  };
}

export const SHORTCUT_HINT_TEXT = `Keyboard: ${buildShortcutHint(
  KEYBOARD_SHORTCUTS.filter((shortcut) => shortcut.scope !== "modal"),
)}`;
