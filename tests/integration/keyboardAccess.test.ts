import { describe, expect, it } from "vitest";

import { dispatchKeyboardShortcut } from "../../src/accessibility/keyboardMap";
import { cloneScenarioConfig, normalizeScenarioConfig } from "../../src/schema/scenario";
import {
  ReplayController,
  coronaryDefaultPreset,
  type CameraMode,
  type ScenarioConfig,
} from "../../src/sim";

interface KeyboardHarness {
  config: ScenarioConfig;
  replayController: ReplayController;
  playing: boolean;
  reducedMotion: boolean;
  modalOpen: boolean;
  dispatch(
    key: string,
    options?: {
      code?: string;
      activeTag?: string | null;
    },
  ): void;
}

function createKeyboardHarness(
  mode: ScenarioConfig["mode"] = "explore",
): KeyboardHarness {
  const config = normalizeScenarioConfig({
    ...cloneScenarioConfig(coronaryDefaultPreset),
    mode,
  });
  const replayController = new ReplayController(config);
  let playing = false;
  let reducedMotion = false;
  let modalOpen = false;

  function advanceSingleTick() {
    const before = replayController.getRuntime();
    if (before.timeline.currentTick >= before.timeline.totalTicks) {
      playing = false;
      return;
    }

    replayController.step();
    const after = replayController.getRuntime();
    if (
      after.simulation.snapshot.phase === "results" ||
      after.timeline.currentTick >= after.timeline.totalTicks
    ) {
      playing = false;
    }
  }

  return {
    config,
    replayController,
    get playing() {
      return playing;
    },
    get reducedMotion() {
      return reducedMotion;
    },
    get modalOpen() {
      return modalOpen;
    },
    dispatch(key, options = {}) {
      dispatchKeyboardShortcut(
        {
          key,
          code: options.code,
        },
        {
          modalOpen,
          mode: config.mode,
          activeTag: options.activeTag ?? null,
        },
        {
          togglePlayback: () => {
            playing = !playing;
          },
          step: () => {
            playing = false;
            advanceSingleTick();
          },
          replay: () => {
            replayController.replay();
            playing = true;
          },
          reset: () => {
            replayController.reset();
            playing = false;
          },
          toggleReducedMotion: () => {
            reducedMotion = !reducedMotion;
          },
          openDisclaimer: () => {
            modalOpen = true;
          },
          closeDisclaimer: () => {
            modalOpen = false;
          },
          toggleOverlay: () => {
            config.view.overlay =
              config.view.overlay === "fluoro" ? "clean" : "fluoro";
            replayController.setPresentationView({
              overlay: config.view.overlay,
            });
          },
          setCamera: (camera: CameraMode) => {
            config.view.camera = camera;
            replayController.setPresentationView({
              camera,
            });
          },
        },
      );
    },
  };
}

describe("keyboard access integration", () => {
  it("routes primary playback shortcuts through the replay controller flow", () => {
    const harness = createKeyboardHarness();

    harness.dispatch(" ", { code: "Space" });
    expect(harness.playing).toBe(true);

    harness.dispatch(" ", { code: "Space" });
    expect(harness.playing).toBe(false);

    const beforeStepTick = harness.replayController.getRuntime().timeline.currentTick;
    harness.dispatch("s");
    expect(harness.replayController.getRuntime().timeline.currentTick).toBe(
      beforeStepTick + 1,
    );

    harness.dispatch("r");
    expect(harness.replayController.getRuntime().timeline.currentTick).toBe(0);
    expect(harness.playing).toBe(true);

    harness.dispatch("Home");
    expect(harness.replayController.getRuntime().timeline.currentTick).toBe(0);
    expect(harness.playing).toBe(false);
  });

  it("keeps disclaimer and explore view shortcuts keyboard reachable without mutating simulation truth", () => {
    const harness = createKeyboardHarness("explore");
    harness.replayController.scrubToTick(80);

    const beforeSimulation = harness.replayController.getRuntime().simulation;

    harness.dispatch("d");
    expect(harness.modalOpen).toBe(true);

    harness.dispatch("Escape");
    expect(harness.modalOpen).toBe(false);

    harness.dispatch("4");
    expect(harness.config.view.camera).toBe("fluoro");

    harness.dispatch("f");
    expect(harness.config.view.overlay).toBe("fluoro");
    expect(harness.replayController.getRuntime().simulation).toEqual(
      beforeSimulation,
    );
  });

  it("does not trigger keyboard shortcuts while form controls are focused", () => {
    const harness = createKeyboardHarness();
    const beforeRuntime = harness.replayController.getRuntime();

    harness.dispatch("r", { activeTag: "INPUT" });
    harness.dispatch("Home", { activeTag: "SELECT" });
    harness.dispatch(" ", { code: "Space", activeTag: "TEXTAREA" });

    expect(harness.replayController.getRuntime()).toEqual(beforeRuntime);
    expect(harness.playing).toBe(false);
  });
});
