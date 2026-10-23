import { passesPrefilter } from "./watch-eval.ts";
import type { Frame } from "./sources";
import type { Verdict } from "./verdict";
import type { Watcher } from "./watcher";

// Hand labels for the sample frames: does the drawing show the condition?
// A person wrote these by looking at each frame. They are the answer key.
export const PARCEL_CONDITION = "a parcel left by the gate";
export const parcelLabels: Record<string, boolean> = {
  "front-gate-1": false,
  "front-gate-2": false, // courier still holding the box: not left yet
  "front-gate-3": true,
  "front-gate-4": false,
  "back-garden-1": false,
  "back-garden-2": false,
  "back-garden-3": false,
  "back-garden-4": false,
  "studio-door-1": false,
  "studio-door-2": false,
  "studio-door-3": false,
  "studio-door-4": false,
};

export type Score = {
  truePositives: string[];
  falsePositives: string[];
  falseNegatives: string[];
  trueNegatives: number;
  precision: number | null;
  recall: number | null;
};

// Score one watcher against recorded verdicts. A frame the prefilter excludes
// counts as "no alert". A missing or unclear verdict also counts as "no alert".
export function scoreWatcher(
  watcher: Watcher,
  frames: Frame[],
  verdicts: Record<string, Verdict>,
  labels: Record<string, boolean>,
): Score {
  const score: Score = { truePositives: [], falsePositives: [], falseNegatives: [], trueNegatives: 0, precision: null, recall: null };
  for (const frame of frames) {
    if (!(frame.id in labels)) continue;
    const alert = passesPrefilter(watcher, frame) && verdicts[frame.id]?.answer === "yes";
    const truth = labels[frame.id];
    if (alert && truth) score.truePositives.push(frame.id);
    else if (alert) score.falsePositives.push(frame.id);
    else if (truth) score.falseNegatives.push(frame.id);
    else score.trueNegatives += 1;
  }
  const tp = score.truePositives.length;
  const alerts = tp + score.falsePositives.length;
  const positives = tp + score.falseNegatives.length;
  score.precision = alerts === 0 ? null : tp / alerts;
  score.recall = positives === 0 ? null : tp / positives;
  return score;
}

// People's decisions on real hits are a second, live measurement.
export function reviewedPrecision(hits: { watcherId: string; status: string }[], watcherId: string) {
  const mine = hits.filter((h) => h.watcherId === watcherId);
  const confirmed = mine.filter((h) => h.status === "confirmed").length;
  const dismissed = mine.filter((h) => h.status === "dismissed").length;
  return { confirmed, dismissed, pending: mine.length - confirmed - dismissed };
}
