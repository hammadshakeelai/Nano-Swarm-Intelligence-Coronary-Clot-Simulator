import type { CameraMode, OverlayMode, SimulationPhase } from "../sim";

export type GuidedBeat =
  | "intro"
  | "injection"
  | "field"
  | "interaction"
  | "reopening"
  | "results";

export interface GuidedCaptionLine {
  beat: GuidedBeat;
  caption: string;
}

export interface GuidedPresentation {
  beat: GuidedBeat;
  camera: CameraMode;
  overlay: OverlayMode;
  caption: string;
}

export const GUIDED_BEATS = [
  "intro",
  "injection",
  "field",
  "interaction",
  "reopening",
  "results",
] as const satisfies readonly GuidedBeat[];

export const GUIDED_RUNTIME_WINDOW_SEC = {
  min: 40,
  max: 60,
} as const;

export const GUIDED_CAPTION_SCRIPT: GuidedCaptionLine[] = [
  {
    beat: "intro",
    caption:
      "A clot is blocking blood movement through a coronary artery segment.",
  },
  {
    beat: "injection",
    caption: "A microrobot-inspired swarm is introduced upstream.",
  },
  {
    beat: "field",
    caption:
      "An external guidance field helps localize the swarm near the clot.",
  },
  {
    beat: "interaction",
    caption:
      "The swarm coordinates near the clot surface and increases local interaction.",
  },
  {
    beat: "reopening",
    caption: "The clot erodes and the vessel channel reopens.",
  },
  {
    beat: "results",
    caption: "This result is illustrative and not a clinical prediction.",
  },
];

export const GUIDED_CAPTION_BY_BEAT = Object.fromEntries(
  GUIDED_CAPTION_SCRIPT.map((line) => [line.beat, line.caption]),
) as Record<GuidedBeat, string>;

export const GUIDED_CAPTION_SEQUENCE = GUIDED_CAPTION_SCRIPT.map(
  (line) => line.caption,
);

export const GUIDED_BEAT_BY_PHASE: Record<SimulationPhase, GuidedBeat> = {
  idle: "intro",
  context_intro: "intro",
  vessel_zoom: "intro",
  clot_identified: "intro",
  injection: "injection",
  navigation: "field",
  localization: "field",
  clot_interaction: "interaction",
  channel_opening: "reopening",
  success: "reopening",
  partial_failure: "results",
  results: "results",
};

export const GUIDED_PRESENTATION_BY_BEAT: Record<
  GuidedBeat,
  GuidedPresentation
> = {
  intro: {
    beat: "intro",
    camera: "overview",
    overlay: "clean",
    caption: GUIDED_CAPTION_BY_BEAT.intro,
  },
  injection: {
    beat: "injection",
    camera: "followSwarm",
    overlay: "clean",
    caption: GUIDED_CAPTION_BY_BEAT.injection,
  },
  field: {
    beat: "field",
    camera: "followSwarm",
    overlay: "fluoro",
    caption: GUIDED_CAPTION_BY_BEAT.field,
  },
  interaction: {
    beat: "interaction",
    camera: "clotCloseup",
    overlay: "fluoro",
    caption: GUIDED_CAPTION_BY_BEAT.interaction,
  },
  reopening: {
    beat: "reopening",
    camera: "clotCloseup",
    overlay: "clean",
    caption: GUIDED_CAPTION_BY_BEAT.reopening,
  },
  results: {
    beat: "results",
    camera: "overview",
    overlay: "clean",
    caption: GUIDED_CAPTION_BY_BEAT.results,
  },
};

export function getGuidedPresentation(
  phase: SimulationPhase,
): GuidedPresentation {
  return GUIDED_PRESENTATION_BY_BEAT[GUIDED_BEAT_BY_PHASE[phase]];
}

export function getGuidedCaptionForPhase(phase: SimulationPhase): string {
  return getGuidedPresentation(phase).caption;
}
