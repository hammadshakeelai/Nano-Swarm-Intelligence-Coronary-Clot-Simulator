import { ArteryScene } from "../render/ArteryScene";
import {
  cloneScenarioConfig,
  normalizeScenarioConfig,
} from "../schema/scenario";
import {
  createScenarioJsonBlob,
  importScenarioJson,
} from "../export/exportJson";
import { createMetricsHistoryCsvBlob } from "../export/exportCsv";
import { exportViewportPng } from "../export/exportPng";
import {
  GUIDED_CAPTION_BY_BEAT,
} from "../guided/captionScript";
import { resolveGuidedSequenceStep } from "../guided/guidedSequence";
import {
  dispatchKeyboardShortcut,
  SHORTCUT_HINT_TEXT,
} from "../accessibility/keyboardMap";
import { buildMetricsStripMarkup } from "../ui/metricsStrip";
import {
  CENTRALIZED_DISCLAIMER_COPY,
} from "../safety/disclaimerText";
import {
  ReplayController,
  SimulationClock,
  coronaryPresets,
  createPresetConfig as createPresetScenarioConfig,
  type CameraMode,
  type ScenarioConfig,
  type SimulationPhase,
  type SimulationRenderState,
  type VesselPresetId,
} from "../sim";

interface ResolvedPresentation {
  camera: CameraMode;
  overlay: ScenarioConfig["view"]["overlay"];
  caption: string;
  guidedLocked: boolean;
}

const ONBOARDING_DISCLAIMER_KEY = "nano-swarm-disclaimer-seen";

const EXPLORE_SUMMARY_BY_PHASE: Record<SimulationPhase, string> = {
  idle: "Simulator ready. Start the guided run or adjust the lab controls before replaying the seeded scenario.",
  context_intro:
    GUIDED_CAPTION_BY_BEAT.intro,
  vessel_zoom:
    "The simulator zooms into a simplified coronary segment to focus on the educational target zone.",
  clot_identified:
    "The clot region is highlighted so the vessel obstruction and available approach path are easy to see.",
  injection: "A microrobot-inspired swarm is introduced upstream of the clot.",
  navigation:
    "An external guidance field helps steer the swarm through the artery segment.",
  localization:
    "The swarm accumulates near the clot zone and begins coordinating at the target.",
  clot_interaction:
    "Coordinated local interactions increase clot erosion while the vessel starts to reopen.",
  channel_opening:
    "A visible lumen channel opens as clot burden falls and the artery appears more patent.",
  success:
    "The simulated vessel reaches its educational success condition and prepares the final replay state.",
  partial_failure:
    "The run ends with incomplete clearance to illustrate that the model can also produce limited outcomes.",
  results: GUIDED_CAPTION_BY_BEAT.results,
};

const HEART_PATH = [
  { x: 72, y: 168 },
  { x: 90, y: 152 },
  { x: 116, y: 140 },
  { x: 142, y: 132 },
  { x: 170, y: 126 },
];

const BASE_STEP_SEC = 1 / 30;

interface RuntimeState {
  playing: boolean;
  playbackSpeed: number;
  reducedMotion: boolean;
  labelsEnabled: boolean;
}

interface AppState {
  config: ScenarioConfig;
  runtime: RuntimeState;
  replayController: ReplayController;
  playbackClock: SimulationClock;
  renderState: SimulationRenderState;
  currentTick: number;
  totalTicks: number;
}

interface Elements {
  modeSelect: HTMLSelectElement;
  headerPresetSelect: HTMLSelectElement;
  panelPresetSelect: HTMLSelectElement;
  disclaimerBackdrop: HTMLDivElement;
  disclaimerButton: HTMLButtonElement;
  disclaimerClose: HTMLButtonElement;
  viewportCanvas: HTMLDivElement;
  viewportPhase: HTMLElement;
  viewportSeed: HTMLElement;
  viewportOverlay: HTMLElement;
  viewportCamera: HTMLElement;
  viewportAnnotations: HTMLElement;
  timelinePhase: HTMLElement;
  timelineCaption: HTMLElement;
  timelineScrubber: HTMLInputElement;
  timelineTicks: HTMLElement;
  timelineSpeed: HTMLSelectElement;
  panelSpeed: HTMLSelectElement;
  cameraSelect: HTMLSelectElement;
  importJsonInput: HTMLInputElement;
  fluoroToggle: HTMLInputElement;
  labelsToggle: HTMLInputElement;
  reducedMotionToggle: HTMLInputElement;
  contextInjection: SVGCircleElement;
  contextClot: SVGCircleElement;
  contextProgress: HTMLElement;
  contextPhaseText: HTMLElement;
  contextInjectionText: HTMLElement;
  contextClotText: HTMLElement;
  metricValues: Record<string, HTMLElement>;
}

const numberFormatter = new Intl.NumberFormat("en-US", {
  maximumFractionDigits: 2,
  minimumFractionDigits: 0,
});

function formatPhase(value: string): string {
  return value
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function formatSliderValue(controlId: string, value: number): string {
  switch (controlId) {
    case "visible-count":
    case "seed-input":
      return `${Math.round(value)}`;
    case "field-direction":
      return `${Math.round(value)} deg`;
    case "timeline-playback-speed":
    case "panel-playback-speed":
      return `${value.toFixed(2)}x`;
    default:
      return numberFormatter.format(value);
  }
}

function getResolvedPresentation(
  config: ScenarioConfig,
  phase: SimulationPhase,
): ResolvedPresentation {
  if (config.mode === "guided") {
    const guidedStep = resolveGuidedSequenceStep(phase);
    return {
      ...guidedStep.presentation,
      guidedLocked: true,
    };
  }

  return {
    camera: config.view.camera,
    overlay: config.view.overlay,
    caption: `Explore mode. ${EXPLORE_SUMMARY_BY_PHASE[phase]}`,
    guidedLocked: false,
  };
}

function getCameraBadge(camera: CameraMode): string {
  return camera === "fluoro" ? "Fluoro Camera" : formatPhase(camera);
}

function getPhaseTone(phase: SimulationPhase, outcome?: string | null) {
  if (phase === "partial_failure" || outcome === "partial_failure") {
    return "alert";
  }

  if (phase === "success" || outcome === "success") {
    return "success";
  }

  if (phase === "clot_interaction" || phase === "channel_opening") {
    return "active";
  }

  return "neutral";
}

function rangeControl(
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
): string {
  return `
    <div class="control">
      <div class="control-meta">
        <label for="${id}">${label}</label>
        <output data-output-for="${id}">${formatSliderValue(id, value)}</output>
      </div>
      <input id="${id}" class="range-input" type="range" min="${min}" max="${max}" step="${step}" value="${value}" />
    </div>
  `;
}

function numberControl(
  id: string,
  label: string,
  value: number,
  min: number,
  max: number,
  step: number,
): string {
  return `
    <div class="control">
      <div class="control-meta">
        <label for="${id}">${label}</label>
        <output data-output-for="${id}">${formatSliderValue(id, value)}</output>
      </div>
      <input id="${id}" class="number-input" type="number" min="${min}" max="${max}" step="${step}" value="${value}" />
    </div>
  `;
}

function toggleControl(id: string, label: string, checked: boolean): string {
  return `
    <label class="toggle-row" for="${id}">
      <span>${label}</span>
      <input id="${id}" class="toggle-input" type="checkbox" ${checked ? "checked" : ""} />
    </label>
  `;
}

function selectControl(
  id: string,
  label: string,
  options: Array<{ label: string; value: string }>,
  selected: string,
): string {
  const optionMarkup = options
    .map(
      (option) =>
        `<option value="${option.value}" ${option.value === selected ? "selected" : ""}>${option.label}</option>`,
    )
    .join("");

  return `
    <label class="select-control" for="${id}">
      <span>${label}</span>
      <select id="${id}" class="select-input">${optionMarkup}</select>
    </label>
  `;
}

function playbackActions(scope: "panel" | "timeline"): string {
  return `
    <div class="action-row action-row-${scope}">
      <button type="button" class="action-button" data-action="play">Play</button>
      <button type="button" class="action-button" data-action="pause">Pause</button>
      <button type="button" class="action-button" data-action="reset">Reset</button>
      <button type="button" class="action-button" data-action="replay">Replay</button>
      <button type="button" class="action-button" data-action="step">Step</button>
    </div>
  `;
}

function buildTemplate(config: ScenarioConfig): string {
  const presetOptions = coronaryPresets.map((preset) => ({
    label: preset.label,
    value: preset.id,
  }));

  return `
    <div class="sim-shell">
      <header class="panel app-header">
        <div class="title-block">
          <span class="eyebrow">Browser-first educational simulator</span>
          <h1>NanoSwarm Coronary Clot Simulator</h1>
          <p class="title-note">Single-segment coronary clot explainer with deterministic seeded replay.</p>
        </div>
        <div class="header-controls">
          ${selectControl(
            "mode-select",
            "Mode",
            [
              { label: "Guided", value: "guided" },
              { label: "Explore", value: "explore" },
            ],
            config.mode,
          )}
          ${selectControl(
            "header-preset-select",
            "Preset",
            presetOptions,
            config.vessel.preset,
          )}
          <button type="button" class="ghost-button" id="disclaimer-button">Disclaimer</button>
        </div>
      </header>

      <section class="metrics-strip">
        ${buildMetricsStripMarkup()}
      </section>

      <main class="main-grid">
        <aside class="panel context-panel">
          <div class="panel-heading">
            <h2>Heart Context Inset</h2>
            <span class="panel-tag" data-status-cue="scope">Coronary focus</span>
          </div>
          <div class="heart-card">
            <svg class="heart-svg" viewBox="0 0 240 260" aria-hidden="true">
              <defs>
                <linearGradient id="heartFill" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stop-color="#10232f" />
                  <stop offset="100%" stop-color="#0a1218" />
                </linearGradient>
              </defs>
              <path
                d="M109 48 C 76 53, 54 82, 58 114 C 62 150, 87 180, 114 207 C 147 184, 183 145, 185 108 C 186 78, 162 50, 131 48 C 122 47, 115 49, 109 54 Z"
                fill="url(#heartFill)"
                stroke="#6ae0e6"
                stroke-width="3"
              />
              <path
                d="M74 170 C 94 154, 110 143, 127 137 C 141 132, 156 128, 172 125"
                fill="none"
                stroke="#f0c173"
                stroke-width="7"
                stroke-linecap="round"
              />
              <circle id="heart-injection-marker" cx="72" cy="168" r="8" fill="#85f6ff" stroke="#ffffff" stroke-width="2" />
              <circle id="heart-clot-marker" cx="170" cy="126" r="9" fill="#ff8366" stroke="#ffffff" stroke-width="2" />
            </svg>
            <div class="heart-caption">
              <strong>Highlighted LAD segment</strong>
              <span>Zoom locked to a simplified coronary artery path for a clean educational view.</span>
            </div>
          </div>
          <div class="context-meta">
            <div class="meta-row">
              <span>Injection point</span>
              <strong id="context-injection-text">${config.injection.point.toFixed(2)}</strong>
            </div>
            <div class="meta-row">
              <span>Clot position</span>
              <strong id="context-clot-text">${config.clot.position.toFixed(2)}</strong>
            </div>
            <div class="meta-row">
              <span>Current phase</span>
              <strong id="context-phase-text">Idle</strong>
            </div>
          </div>
          <div class="zoom-indicator">
            <span>Zoom indicator</span>
            <div class="zoom-track">
              <div class="zoom-progress" id="context-progress"></div>
            </div>
          </div>
        </aside>

        <section class="panel viewport-panel">
          <div class="viewport-hud">
            <div class="hud-badge-group">
              <span class="hud-badge" id="viewport-phase" data-badge-kind="phase" data-status-tone="neutral">Idle</span>
              <span class="hud-badge" id="viewport-camera" data-badge-kind="camera" data-status-tone="active">Overview</span>
              <span class="hud-badge" id="viewport-overlay" data-badge-kind="overlay" data-status-tone="active">Clean Overlay</span>
            </div>
            <span class="hud-seed" id="viewport-seed">Seed 42</span>
          </div>
          <div id="viewport-canvas" class="viewport-canvas"></div>
          <div id="viewport-annotations" class="viewport-annotations">
            <span class="annotation annotation-injection" data-status-cue="injection">Injection</span>
            <span class="annotation annotation-clot" data-status-cue="clot">Clot zone</span>
            <span class="annotation annotation-field" data-status-cue="field">Field cue</span>
          </div>
        </section>

        <aside class="panel lab-panel">
          <div class="panel-heading">
            <h2>Advanced Lab Panel</h2>
            <span class="panel-tag">All controls live</span>
          </div>

          <section class="panel-section">
            <h3>Scenario</h3>
            ${selectControl(
              "panel-preset-select",
              "Vessel preset",
              presetOptions,
              config.vessel.preset,
            )}
            ${rangeControl("clot-size", "Clot size", config.clot.size, 0, 1, 0.01)}
            ${rangeControl("clot-position", "Clot position", config.clot.position, 0.35, 0.78, 0.01)}
            ${rangeControl("injection-point", "Injection point", config.injection.point, 0.05, 0.7, 0.01)}
            ${numberControl("seed-input", "Seed", config.seed, 0, 2147483647, 1)}
          </section>

          <section class="panel-section">
            <h3>Flow</h3>
            ${rangeControl("flow-speed", "Flow speed", config.flow.speed, 0, 1, 0.01)}
            ${toggleControl("flow-pulse", "Flow pulse", config.flow.pulseEnabled)}
          </section>

          <section class="panel-section">
            <h3>Swarm</h3>
            ${rangeControl("visible-count", "Visible swarm count", config.swarm.visibleCount, 50, 1000, 10)}
            ${rangeControl("effective-swarm-factor", "Effective swarm factor", config.swarm.effectiveSwarmFactor, 0, 1, 0.01)}
            ${rangeControl("concentration-factor", "Concentration factor", config.swarm.concentrationFactor, 0, 1, 0.01)}
            ${rangeControl("cohesion-gain", "Cohesion gain", config.swarm.cohesionGain, 0, 1, 0.01)}
            ${rangeControl("coordination-gain", "Coordination gain", config.swarm.coordinationGain, 0, 1, 0.01)}
          </section>

          <section class="panel-section">
            <h3>Field</h3>
            ${rangeControl("field-strength", "Field strength", config.field.strength, 0, 1, 0.01)}
            ${rangeControl("field-direction", "Field direction", config.field.directionDeg, -180, 180, 1)}
            ${rangeControl("localization-assist", "Localization assist", config.field.localizationAssist, 0, 1, 0.01)}
            ${rangeControl("corkscrew-intensity", "Corkscrew intensity", config.field.corkscrewIntensity, 0, 1, 0.01)}
          </section>

          <section class="panel-section">
            <h3>Playback</h3>
            ${playbackActions("panel")}
            ${selectControl(
              "panel-playback-speed",
              "Playback speed",
              [
                { label: "0.50x", value: "0.5" },
                { label: "1.00x", value: "1" },
                { label: "1.50x", value: "1.5" },
                { label: "2.00x", value: "2" },
                { label: "3.00x", value: "3" },
              ],
              "1",
            )}
          </section>

          <section class="panel-section">
            <h3>View</h3>
            ${selectControl(
              "camera-select",
              "Camera",
              [
                { label: "Overview", value: "overview" },
                { label: "Follow swarm", value: "followSwarm" },
                { label: "Clot close-up", value: "clotCloseup" },
                { label: "Fluoro", value: "fluoro" },
              ],
              config.view.camera,
            )}
            ${toggleControl("fluoro-toggle", "Fluoroscopy overlay", config.view.overlay === "fluoro")}
            ${toggleControl("labels-toggle", "Labels visible", true)}
            ${toggleControl("reduced-motion-toggle", "Reduced motion", false)}
          </section>

          <section class="panel-section">
            <h3>Export</h3>
            <div class="action-row">
              <button type="button" class="action-button" id="import-json">Import JSON</button>
              <button type="button" class="action-button" id="export-json">Export JSON</button>
              <button type="button" class="action-button" id="export-csv">Export CSV</button>
              <button type="button" class="action-button" id="export-png">Export PNG</button>
            </div>
            <input id="import-json-input" class="visually-hidden" type="file" accept=".json,application/json" />
          </section>
        </aside>
      </main>

      <footer class="panel timeline-strip">
        <div class="timeline-header">
          <div>
            <span class="timeline-label">Current phase</span>
            <strong id="timeline-phase">Idle</strong>
          </div>
          <div class="timeline-speed-wrap">
            ${selectControl(
              "timeline-playback-speed",
              "Speed",
              [
                { label: "0.50x", value: "0.5" },
                { label: "1.00x", value: "1" },
                { label: "1.50x", value: "1.5" },
                { label: "2.00x", value: "2" },
                { label: "3.00x", value: "3" },
              ],
              "1",
            )}
            <span id="timeline-ticks">Tick 0 / 0</span>
          </div>
        </div>
        <p class="timeline-caption" id="timeline-caption">${GUIDED_CAPTION_BY_BEAT.intro}</p>
        <div class="timeline-controls">
          ${playbackActions("timeline")}
          <input id="timeline-scrubber" type="range" min="0" max="0" step="1" value="0" aria-label="Timeline scrubber" />
        </div>
        <p class="shortcut-hint">${SHORTCUT_HINT_TEXT}</p>
      </footer>

      <div class="modal-backdrop is-hidden" id="disclaimer-backdrop" aria-hidden="true">
        <div class="modal-card" role="dialog" aria-modal="true" aria-labelledby="disclaimer-title">
          <div class="panel-heading">
            <h2 id="disclaimer-title">${CENTRALIZED_DISCLAIMER_COPY.title}</h2>
            <button type="button" class="ghost-button" id="disclaimer-close">Close</button>
          </div>
          <p>${CENTRALIZED_DISCLAIMER_COPY.text}</p>
        </div>
      </div>
    </div>
  `;
}

function query<T extends Element>(root: ParentNode, selector: string): T {
  const element = root.querySelector(selector);

  if (!element) {
    throw new Error(`Missing required element: ${selector}`);
  }

  return element as T;
}

function positionAlongHeartPath(ratio: number) {
  const clamped = Math.min(0.999, Math.max(0, ratio));
  const scaled = clamped * (HEART_PATH.length - 1);
  const lower = Math.floor(scaled);
  const upper = Math.min(lower + 1, HEART_PATH.length - 1);
  const mix = scaled - lower;
  const start = HEART_PATH[lower];
  const end = HEART_PATH[upper];

  return {
    x: start.x + (end.x - start.x) * mix,
    y: start.y + (end.y - start.y) * mix,
  };
}

function createPresetConfig(
  presetId: VesselPresetId,
  mode: ScenarioConfig["mode"],
  camera: CameraMode,
  overlay: ScenarioConfig["view"]["overlay"],
) {
  const config = cloneScenarioConfig(createPresetScenarioConfig(presetId));
  config.mode = mode;
  config.view.camera = camera;
  config.view.overlay = overlay;
  return normalizeScenarioConfig(config);
}

function downloadBlob(filename: string, blob: Blob) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  link.click();
  URL.revokeObjectURL(url);
}

function downloadDataUrl(filename: string, dataUrl: string) {
  const link = document.createElement("a");
  link.href = dataUrl;
  link.download = filename;
  link.click();
}

export function createSimulatorApp(root: HTMLElement) {
  const initialConfig = normalizeScenarioConfig(
    cloneScenarioConfig(createPresetScenarioConfig("lad_basic")),
  );
  root.innerHTML = buildTemplate(initialConfig);

  const elements: Elements = {
    modeSelect: query(root, "#mode-select"),
    headerPresetSelect: query(root, "#header-preset-select"),
    panelPresetSelect: query(root, "#panel-preset-select"),
    disclaimerBackdrop: query(root, "#disclaimer-backdrop"),
    disclaimerButton: query(root, "#disclaimer-button"),
    disclaimerClose: query(root, "#disclaimer-close"),
    viewportCanvas: query(root, "#viewport-canvas"),
    viewportPhase: query(root, "#viewport-phase"),
    viewportSeed: query(root, "#viewport-seed"),
    viewportOverlay: query(root, "#viewport-overlay"),
    viewportCamera: query(root, "#viewport-camera"),
    viewportAnnotations: query(root, "#viewport-annotations"),
    timelinePhase: query(root, "#timeline-phase"),
    timelineCaption: query(root, "#timeline-caption"),
    timelineScrubber: query(root, "#timeline-scrubber"),
    timelineTicks: query(root, "#timeline-ticks"),
    timelineSpeed: query(root, "#timeline-playback-speed"),
    panelSpeed: query(root, "#panel-playback-speed"),
    cameraSelect: query(root, "#camera-select"),
    importJsonInput: query(root, "#import-json-input"),
    fluoroToggle: query(root, "#fluoro-toggle"),
    labelsToggle: query(root, "#labels-toggle"),
    reducedMotionToggle: query(root, "#reduced-motion-toggle"),
    contextInjection: query(root, "#heart-injection-marker"),
    contextClot: query(root, "#heart-clot-marker"),
    contextProgress: query(root, "#context-progress"),
    contextPhaseText: query(root, "#context-phase-text"),
    contextInjectionText: query(root, "#context-injection-text"),
    contextClotText: query(root, "#context-clot-text"),
    metricValues: {
      clotBurdenPct: query(root, '[data-metric="clotBurdenPct"]'),
      svpiPct: query(root, '[data-metric="svpiPct"]'),
      localizationPct: query(root, '[data-metric="localizationPct"]'),
      coordinationScore: query(root, '[data-metric="coordinationScore"]'),
      timeSec: query(root, '[data-metric="timeSec"]'),
    },
  };

  const initialReplayController = new ReplayController(initialConfig);
  const initialReplayRuntime = initialReplayController.getRuntime();

  const state: AppState = {
    config: initialConfig,
    runtime: {
      playing: initialConfig.mode === "guided",
      playbackSpeed: 1,
      reducedMotion: false,
      labelsEnabled: true,
    },
    replayController: initialReplayController,
    playbackClock: new SimulationClock(BASE_STEP_SEC),
    renderState: initialReplayRuntime.simulation,
    currentTick: initialReplayRuntime.timeline.currentTick,
    totalTicks: initialReplayRuntime.timeline.totalTicks,
  };

  const scene = new ArteryScene(elements.viewportCanvas);
  const getPresentation = () =>
    getResolvedPresentation(state.config, state.renderState.snapshot.phase);

  function renderScene() {
    const presentation = getPresentation();
    scene.update(
      state.renderState,
      {
        camera: presentation.camera,
        overlay: presentation.overlay,
        reducedMotion: state.runtime.reducedMotion,
      },
      state.config,
    );
  }

  function openDisclaimer() {
    elements.disclaimerBackdrop.classList.remove("is-hidden");
    elements.disclaimerBackdrop.setAttribute("aria-hidden", "false");
  }

  function closeDisclaimer() {
    elements.disclaimerBackdrop.classList.add("is-hidden");
    elements.disclaimerBackdrop.setAttribute("aria-hidden", "true");
    try {
      window.sessionStorage.setItem(ONBOARDING_DISCLAIMER_KEY, "true");
    } catch {
      // Ignore storage access issues and keep the UX functional.
    }
  }

  const resizeObserver = new ResizeObserver((entries) => {
    const entry = entries[0];
    if (!entry) return;
    scene.resize(entry.contentRect.width, entry.contentRect.height);
    renderScene();
  });
  resizeObserver.observe(elements.viewportCanvas);

  const outputElements = Array.from(
    root.querySelectorAll<HTMLOutputElement>("[data-output-for]"),
  );

  function setOutputValue(id: string, value: number) {
    const output = outputElements.find(
      (element) => element.dataset.outputFor === id,
    );
    if (output) {
      output.textContent = formatSliderValue(id, value);
    }
  }

  function syncStaticControls() {
    elements.modeSelect.value = state.config.mode;
    elements.headerPresetSelect.value = state.config.vessel.preset;
    elements.panelPresetSelect.value = state.config.vessel.preset;

    const setValue = (id: string, value: string) => {
      const input = query<HTMLInputElement | HTMLSelectElement>(root, `#${id}`);
      input.value = value;
    };

    setValue("clot-size", `${state.config.clot.size}`);
    setValue("clot-position", `${state.config.clot.position}`);
    setValue("injection-point", `${state.config.injection.point}`);
    setValue("seed-input", `${state.config.seed}`);
    setValue("flow-speed", `${state.config.flow.speed}`);
    setValue("visible-count", `${state.config.swarm.visibleCount}`);
    setValue(
      "effective-swarm-factor",
      `${state.config.swarm.effectiveSwarmFactor}`,
    );
    setValue(
      "concentration-factor",
      `${state.config.swarm.concentrationFactor}`,
    );
    setValue("cohesion-gain", `${state.config.swarm.cohesionGain}`);
    setValue("coordination-gain", `${state.config.swarm.coordinationGain}`);
    setValue("field-strength", `${state.config.field.strength}`);
    setValue("field-direction", `${state.config.field.directionDeg}`);
    setValue("localization-assist", `${state.config.field.localizationAssist}`);
    setValue("corkscrew-intensity", `${state.config.field.corkscrewIntensity}`);
    setValue("timeline-playback-speed", `${state.runtime.playbackSpeed}`);
    setValue("panel-playback-speed", `${state.runtime.playbackSpeed}`);

    elements.cameraSelect.value = state.config.view.camera;
    query<HTMLInputElement>(root, "#flow-pulse").checked =
      state.config.flow.pulseEnabled;
    elements.fluoroToggle.checked = state.config.view.overlay === "fluoro";
    elements.labelsToggle.checked = state.runtime.labelsEnabled;
    elements.reducedMotionToggle.checked = state.runtime.reducedMotion;

    setOutputValue("clot-size", state.config.clot.size);
    setOutputValue("clot-position", state.config.clot.position);
    setOutputValue("injection-point", state.config.injection.point);
    setOutputValue("seed-input", state.config.seed);
    setOutputValue("flow-speed", state.config.flow.speed);
    setOutputValue("visible-count", state.config.swarm.visibleCount);
    setOutputValue(
      "effective-swarm-factor",
      state.config.swarm.effectiveSwarmFactor,
    );
    setOutputValue(
      "concentration-factor",
      state.config.swarm.concentrationFactor,
    );
    setOutputValue("cohesion-gain", state.config.swarm.cohesionGain);
    setOutputValue("coordination-gain", state.config.swarm.coordinationGain);
    setOutputValue("field-strength", state.config.field.strength);
    setOutputValue("field-direction", state.config.field.directionDeg);
    setOutputValue(
      "localization-assist",
      state.config.field.localizationAssist,
    );
    setOutputValue(
      "corkscrew-intensity",
      state.config.field.corkscrewIntensity,
    );
  }

  function syncDynamicUI() {
    const snapshot = state.renderState.snapshot;
    const presentation = getPresentation();
    const currentMetrics = state.replayController.getCurrentMetrics();

    elements.metricValues.clotBurdenPct.textContent = `${currentMetrics.clotBurdenPct.toFixed(1)}%`;
    elements.metricValues.svpiPct.textContent = `${currentMetrics.svpiPct.toFixed(1)}%`;
    elements.metricValues.localizationPct.textContent = `${currentMetrics.localizationPct.toFixed(1)}%`;
    elements.metricValues.coordinationScore.textContent =
      currentMetrics.coordinationScore.toFixed(2);
    elements.metricValues.timeSec.textContent = `${currentMetrics.timeSec.toFixed(1)} s`;

    elements.timelinePhase.textContent = formatPhase(snapshot.phase);
    elements.timelineCaption.textContent = presentation.caption;
    elements.timelineScrubber.max = `${state.totalTicks}`;
    elements.timelineScrubber.value = `${state.currentTick}`;
    elements.timelineTicks.textContent = `Tick ${state.currentTick} / ${state.totalTicks}`;

    elements.viewportPhase.textContent = formatPhase(snapshot.phase);
    elements.viewportPhase.setAttribute(
      "data-status-tone",
      getPhaseTone(snapshot.phase, snapshot.outcome),
    );
    elements.viewportCamera.textContent = getCameraBadge(presentation.camera);
    elements.viewportOverlay.textContent =
      presentation.overlay === "fluoro" ? "Fluoro Overlay" : "Clean Overlay";
    elements.viewportSeed.textContent = `Seed ${state.config.seed}`;
    elements.viewportAnnotations.classList.toggle(
      "annotations-hidden",
      !state.runtime.labelsEnabled,
    );

    elements.cameraSelect.disabled = presentation.guidedLocked;
    elements.fluoroToggle.disabled = presentation.guidedLocked;
    elements.cameraSelect.title = presentation.guidedLocked
      ? "Guided mode controls camera transitions automatically."
      : "Select a camera framing.";
    elements.fluoroToggle.title = presentation.guidedLocked
      ? "Guided mode controls overlay transitions automatically."
      : "Toggle fluoroscopy overlay.";
    elements.cameraSelect.value = presentation.guidedLocked
      ? presentation.camera
      : state.config.view.camera;
    elements.fluoroToggle.checked = presentation.guidedLocked
      ? presentation.overlay === "fluoro"
      : state.config.view.overlay === "fluoro";

    const injectionPoint = positionAlongHeartPath(state.config.injection.point);
    const clotPoint = positionAlongHeartPath(state.config.clot.position);
    elements.contextInjection.setAttribute("cx", injectionPoint.x.toFixed(1));
    elements.contextInjection.setAttribute("cy", injectionPoint.y.toFixed(1));
    elements.contextClot.setAttribute("cx", clotPoint.x.toFixed(1));
    elements.contextClot.setAttribute("cy", clotPoint.y.toFixed(1));
    elements.contextPhaseText.textContent = formatPhase(snapshot.phase);
    elements.contextInjectionText.textContent =
      state.config.injection.point.toFixed(2);
    elements.contextClotText.textContent =
      state.config.clot.position.toFixed(2);
    elements.contextProgress.style.width = `${(state.currentTick / Math.max(state.totalTicks, 1)) * 100}%`;
  }

  function syncFromReplayController() {
    const replayRuntime = state.replayController.getRuntime();
    state.renderState = replayRuntime.simulation;
    state.currentTick = replayRuntime.timeline.currentTick;
    state.totalTicks = replayRuntime.timeline.totalTicks;
  }

  function rebuildSimulation(autoplay: boolean) {
    state.config = normalizeScenarioConfig(state.config);
    state.replayController = new ReplayController(state.config);
    state.playbackClock = new SimulationClock(BASE_STEP_SEC);
    syncFromReplayController();
    state.runtime.playing = autoplay;
    syncStaticControls();
    syncDynamicUI();
    renderScene();
  }

  function seekToTick(tick: number) {
    state.replayController.scrubToTick(tick);
    syncFromReplayController();
    syncDynamicUI();
    renderScene();
  }

  function advanceSingleTick() {
    if (state.currentTick >= state.totalTicks) {
      state.runtime.playing = false;
      return;
    }

    state.replayController.step();
    syncFromReplayController();

    if (
      state.renderState.snapshot.phase === "results" ||
      state.currentTick >= state.totalTicks
    ) {
      state.runtime.playing = false;
    }
  }

  function setCameraView(camera: CameraMode) {
    state.config.view.camera = camera;
    state.replayController.setPresentationView({
      camera: state.config.view.camera,
    });
    syncDynamicUI();
    renderScene();
  }

  function toggleOverlayView() {
    state.config.view.overlay =
      state.config.view.overlay === "fluoro" ? "clean" : "fluoro";
    state.replayController.setPresentationView({
      overlay: state.config.view.overlay,
    });
    syncDynamicUI();
    renderScene();
  }

  function toggleReducedMotionMode() {
    state.runtime.reducedMotion = !state.runtime.reducedMotion;
    elements.reducedMotionToggle.checked = state.runtime.reducedMotion;
    syncDynamicUI();
    renderScene();
  }

  function replaySimulation() {
    state.replayController.replay();
    syncFromReplayController();
    state.runtime.playing = true;
    syncDynamicUI();
    renderScene();
  }

  function resetSimulation() {
    state.replayController.reset();
    syncFromReplayController();
    state.runtime.playing = false;
    syncDynamicUI();
    renderScene();
  }

  function stepSimulation() {
    state.runtime.playing = false;
    advanceSingleTick();
    syncDynamicUI();
    renderScene();
  }

  function bindRangeControl(id: string, handler: (value: number) => void) {
    const input = query<HTMLInputElement>(root, `#${id}`);
    input.addEventListener("input", () => {
      const nextValue = Number(input.value);
      handler(nextValue);
      setOutputValue(id, nextValue);
      rebuildSimulation(state.config.mode === "guided");
    });
  }

  bindRangeControl("clot-size", (value) => {
    state.config.clot.size = value;
  });
  bindRangeControl("clot-position", (value) => {
    state.config.clot.position = value;
  });
  bindRangeControl("injection-point", (value) => {
    state.config.injection.point = value;
  });
  bindRangeControl("flow-speed", (value) => {
    state.config.flow.speed = value;
  });
  bindRangeControl("visible-count", (value) => {
    state.config.swarm.visibleCount = Math.round(value);
  });
  bindRangeControl("effective-swarm-factor", (value) => {
    state.config.swarm.effectiveSwarmFactor = value;
  });
  bindRangeControl("concentration-factor", (value) => {
    state.config.swarm.concentrationFactor = value;
  });
  bindRangeControl("cohesion-gain", (value) => {
    state.config.swarm.cohesionGain = value;
  });
  bindRangeControl("coordination-gain", (value) => {
    state.config.swarm.coordinationGain = value;
  });
  bindRangeControl("field-strength", (value) => {
    state.config.field.strength = value;
  });
  bindRangeControl("field-direction", (value) => {
    state.config.field.directionDeg = value;
  });
  bindRangeControl("localization-assist", (value) => {
    state.config.field.localizationAssist = value;
  });
  bindRangeControl("corkscrew-intensity", (value) => {
    state.config.field.corkscrewIntensity = value;
  });

  query<HTMLInputElement>(root, "#seed-input").addEventListener(
    "change",
    (event) => {
      state.config.seed = Number(
        (event.currentTarget as HTMLInputElement).value,
      );
      setOutputValue("seed-input", state.config.seed);
      rebuildSimulation(false);
    },
  );

  query<HTMLInputElement>(root, "#flow-pulse").addEventListener(
    "change",
    (event) => {
      state.config.flow.pulseEnabled = (
        event.currentTarget as HTMLInputElement
      ).checked;
      rebuildSimulation(state.config.mode === "guided");
    },
  );

  elements.cameraSelect.addEventListener("change", (event) => {
    setCameraView(
      (event.currentTarget as HTMLSelectElement).value as CameraMode,
    );
  });

  elements.fluoroToggle.addEventListener("change", (event) => {
    state.config.view.overlay = (event.currentTarget as HTMLInputElement)
      .checked
      ? "fluoro"
      : "clean";
    state.replayController.setPresentationView({
      overlay: state.config.view.overlay,
    });
    syncDynamicUI();
    renderScene();
  });

  elements.labelsToggle.addEventListener("change", (event) => {
    state.runtime.labelsEnabled = (
      event.currentTarget as HTMLInputElement
    ).checked;
    syncDynamicUI();
  });

  elements.reducedMotionToggle.addEventListener("change", (event) => {
    state.runtime.reducedMotion = (
      event.currentTarget as HTMLInputElement
    ).checked;
    syncDynamicUI();
    renderScene();
  });

  function setPlaybackSpeed(value: number) {
    state.runtime.playbackSpeed = value;
    elements.timelineSpeed.value = `${value}`;
    elements.panelSpeed.value = `${value}`;
  }

  elements.timelineSpeed.addEventListener("change", (event) => {
    setPlaybackSpeed(Number((event.currentTarget as HTMLSelectElement).value));
  });
  elements.panelSpeed.addEventListener("change", (event) => {
    setPlaybackSpeed(Number((event.currentTarget as HTMLSelectElement).value));
  });

  elements.modeSelect.addEventListener("change", (event) => {
    state.config.mode = (event.currentTarget as HTMLSelectElement)
      .value as ScenarioConfig["mode"];
    if (state.config.mode === "guided" && state.currentTick === 0) {
      state.runtime.playing = true;
    }
    syncStaticControls();
    syncDynamicUI();
    renderScene();
  });

  const handlePresetReset = (selectedPreset: VesselPresetId) => {
    elements.headerPresetSelect.value = selectedPreset;
    elements.panelPresetSelect.value = selectedPreset;
    state.config = createPresetConfig(
      selectedPreset,
      state.config.mode,
      state.config.view.camera,
      state.config.view.overlay,
    );
    rebuildSimulation(state.config.mode === "guided");
  };

  elements.headerPresetSelect.addEventListener("change", (event) => {
    handlePresetReset(
      (event.currentTarget as HTMLSelectElement).value as VesselPresetId,
    );
  });
  elements.panelPresetSelect.addEventListener("change", (event) => {
    handlePresetReset(
      (event.currentTarget as HTMLSelectElement).value as VesselPresetId,
    );
  });

  elements.timelineScrubber.addEventListener("input", (event) => {
    state.runtime.playing = false;
    seekToTick(Number((event.currentTarget as HTMLInputElement).value));
  });

  root
    .querySelectorAll<HTMLButtonElement>("[data-action]")
    .forEach((button) => {
      button.addEventListener("click", () => {
        const action = button.dataset.action;

        if (action === "play") {
          state.runtime.playing = true;
        } else if (action === "pause") {
          state.runtime.playing = false;
        } else if (action === "reset") {
          state.config = createPresetConfig(
            state.config.vessel.preset,
            state.config.mode,
            state.config.view.camera,
            state.config.view.overlay,
          );
          rebuildSimulation(false);
        } else if (action === "replay") {
          state.replayController.replay();
          syncFromReplayController();
          state.runtime.playing = true;
          syncDynamicUI();
          renderScene();
        } else if (action === "step") {
          state.runtime.playing = false;
          advanceSingleTick();
          syncDynamicUI();
          renderScene();
        }
      });
    });

  query<HTMLButtonElement>(root, "#export-json").addEventListener(
    "click",
    () => {
      downloadBlob(
        `${state.config.scenarioId}_scenario.json`,
        createScenarioJsonBlob(state.config),
      );
    },
  );

  query<HTMLButtonElement>(root, "#export-csv").addEventListener(
    "click",
    () => {
      downloadBlob(
        `${state.config.scenarioId}_metrics.csv`,
        createMetricsHistoryCsvBlob(state.replayController.getMetricsHistory()),
      );
    },
  );

  query<HTMLButtonElement>(root, "#export-png").addEventListener(
    "click",
    async () => {
      try {
        const presentation = getPresentation();
      const pngExport = await exportViewportPng(scene, {
        camera: presentation.camera,
        overlay: presentation.overlay,
        disclaimerText: CENTRALIZED_DISCLAIMER_COPY.text,
      });
        downloadDataUrl(
          `${state.config.scenarioId}_viewport.png`,
          pngExport.dataUrl,
        );
      } catch {
        downloadDataUrl(`${state.config.scenarioId}_viewport.png`, scene.exportPng());
      }
    },
  );

  query<HTMLButtonElement>(root, "#import-json").addEventListener(
    "click",
    () => {
      elements.importJsonInput.click();
    },
  );

  elements.importJsonInput.addEventListener("change", async () => {
    const [file] = Array.from(elements.importJsonInput.files ?? []);
    elements.importJsonInput.value = "";
    if (!file) {
      return;
    }

    try {
      const imported = importScenarioJson(await file.text());
      state.config = imported;
      rebuildSimulation(imported.mode === "guided");
    } catch (error) {
      const message =
        error instanceof Error ? error.message : "Scenario import failed.";
      window.alert(`Scenario import failed. ${message}`);
    }
  });

  elements.disclaimerButton.addEventListener("click", openDisclaimer);

  elements.disclaimerClose.addEventListener("click", closeDisclaimer);

  elements.disclaimerBackdrop.addEventListener("click", (event) => {
    if (event.target === elements.disclaimerBackdrop) {
      closeDisclaimer();
    }
  });

  window.addEventListener("keydown", (event) => {
    const result = dispatchKeyboardShortcut(
      {
        key: event.key,
        code: event.code,
      },
      {
        modalOpen: !elements.disclaimerBackdrop.classList.contains("is-hidden"),
        mode: state.config.mode,
        activeTag: document.activeElement?.tagName,
      },
      {
        togglePlayback: () => {
          state.runtime.playing = !state.runtime.playing;
        },
        step: () => {
          stepSimulation();
        },
        replay: () => {
          replaySimulation();
        },
        reset: () => {
          resetSimulation();
        },
        toggleReducedMotion: () => {
          toggleReducedMotionMode();
        },
        openDisclaimer: () => {
          openDisclaimer();
        },
        closeDisclaimer: () => {
          closeDisclaimer();
        },
        toggleOverlay: () => {
          toggleOverlayView();
        },
        setCamera: (camera) => {
          setCameraView(camera);
        },
      },
    );

    if (result.handled) {
      event.preventDefault();
    }
  });

  syncStaticControls();
  syncDynamicUI();
  renderScene();
  try {
    if (!window.sessionStorage.getItem(ONBOARDING_DISCLAIMER_KEY)) {
      openDisclaimer();
    }
  } catch {
    openDisclaimer();
  }

  let previousTime = performance.now();

  const animate = (timestamp: number) => {
    const deltaSec = Math.min((timestamp - previousTime) / 1000, 0.15);
    previousTime = timestamp;

    if (state.runtime.playing) {
      const steps = state.playbackClock.consume(
        deltaSec * state.runtime.playbackSpeed,
      );
      for (let index = 0; index < steps; index += 1) {
        advanceSingleTick();
      }
      syncDynamicUI();
    }

    renderScene();

    window.requestAnimationFrame(animate);
  };

  window.requestAnimationFrame(animate);

  return () => {
    resizeObserver.disconnect();
    scene.dispose();
  };
}
