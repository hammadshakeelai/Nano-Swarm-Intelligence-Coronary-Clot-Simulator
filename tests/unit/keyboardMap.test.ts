import { describe, expect, it } from "vitest";

import {
  KEYBOARD_SHORTCUTS,
  REQUIRED_PRIMARY_KEYBOARD_CONTROLS,
  SHORTCUT_HINT_TEXT,
  getCameraForKeyboardAction,
  resolveKeyboardShortcutAction,
} from "../../src/accessibility/keyboardMap";

describe("keyboard shortcut map", () => {
  it("documents all required primary keyboard controls", () => {
    const coveredControls = new Set(
      KEYBOARD_SHORTCUTS.flatMap((shortcut) => shortcut.covers),
    );

    REQUIRED_PRIMARY_KEYBOARD_CONTROLS.forEach((control) => {
      expect(coveredControls.has(control)).toBe(true);
    });
  });

  it("resolves primary playback and modal shortcuts", () => {
    const defaultContext = {
      modalOpen: false,
      mode: "guided" as const,
      activeTag: null,
    };

    expect(
      resolveKeyboardShortcutAction(
        { key: " ", code: "Space" },
        defaultContext,
      ),
    ).toBe("togglePlayback");
    expect(
      resolveKeyboardShortcutAction({ key: "s" }, defaultContext),
    ).toBe("step");
    expect(
      resolveKeyboardShortcutAction({ key: "ArrowRight" }, defaultContext),
    ).toBe("step");
    expect(
      resolveKeyboardShortcutAction({ key: "R" }, defaultContext),
    ).toBe("replay");
    expect(
      resolveKeyboardShortcutAction({ key: "Home" }, defaultContext),
    ).toBe("reset");
    expect(
      resolveKeyboardShortcutAction(
        { key: "Escape" },
        {
          ...defaultContext,
          modalOpen: true,
        },
      ),
    ).toBe("closeDisclaimer");
  });

  it("resolves explore-only view shortcuts and ignores form focus", () => {
    const exploreContext = {
      modalOpen: false,
      mode: "explore" as const,
      activeTag: null,
    };

    expect(
      resolveKeyboardShortcutAction({ key: "f" }, exploreContext),
    ).toBe("toggleOverlay");
    expect(
      resolveKeyboardShortcutAction({ key: "1" }, exploreContext),
    ).toBe("setCameraOverview");
    expect(
      getCameraForKeyboardAction("setCameraFluoro"),
    ).toBe("fluoro");
    expect(
      resolveKeyboardShortcutAction(
        { key: "r" },
        {
          ...exploreContext,
          activeTag: "INPUT",
        },
      ),
    ).toBeNull();
    expect(SHORTCUT_HINT_TEXT).toContain("Space");
    expect(SHORTCUT_HINT_TEXT).toContain("Home");
  });
});
