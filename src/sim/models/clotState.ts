export const CLOT_PHASES = [
  "stable",
  "erosion",
  "channel_opening",
  "cleared",
  "incomplete",
] as const;

export type ClotPhase = (typeof CLOT_PHASES)[number];

export interface ClotConfig {
  size: number;
  position: number;
  occlusionFraction: number;
}

export interface ClotState {
  phase: ClotPhase;
  initialBurden: number;
  currentBurden: number;
  occlusionFraction: number;
  erosionFront: number;
  channelRadius: number;
  fragmentEventLevel: number;
}
