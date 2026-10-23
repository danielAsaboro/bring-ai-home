import { describe, expect, it } from "vitest";

import { parcelLabels, reviewedPrecision, scoreWatcher } from "./measure";
import { allFrames, sampleSources } from "./sources";
import type { Verdict } from "./verdict";
import type { Watcher } from "./watcher";

// FIXTURE verdicts: hand-written to exercise the scorer. They are not a
// recording of any model run. Record your own with `npm run qvac:measure`.
const yes: Verdict = { answer: "yes", reason: "fixture" };
const fixtureVerdicts: Record<string, Verdict> = {
  "front-gate-2": yes,
  "front-gate-3": yes,
  "front-gate-4": yes,
  "studio-door-3": yes,
};

const frames = allFrames(sampleSources);
const base: Watcher = { id: "w", sourceId: "front-gate", condition: "a parcel left by the gate", fromHour: 0, toHour: 0, minMotion: 0 };

describe("scoreWatcher", () => {
  it("counts false positives the source scope does not remove", () => {
    const score = scoreWatcher(base, frames, fixtureVerdicts, parcelLabels);
    expect(score.truePositives).toEqual(["front-gate-3"]);
    expect(score.falsePositives).toEqual(["front-gate-2", "front-gate-4"]);
    expect(score.precision).toBeCloseTo(1 / 3);
    expect(score.recall).toBe(1);
  });

  it("a still-scene limit removes the courier and the cat without losing the parcel", () => {
    const tuned = scoreWatcher({ ...base, maxMotion: 0.2 }, frames, fixtureVerdicts, parcelLabels);
    expect(tuned.falsePositives).toEqual([]);
    expect(tuned.truePositives).toEqual(["front-gate-3"]);
  });

  it("over-tuning shows up as a false negative", () => {
    const tooTight = scoreWatcher({ ...base, maxMotion: 0.05 }, frames, fixtureVerdicts, parcelLabels);
    expect(tooTight.falseNegatives).toEqual(["front-gate-3"]);
    expect(tooTight.recall).toBe(0);
  });
});

describe("reviewedPrecision", () => {
  it("counts human decisions per watcher", () => {
    const hits = [
      { watcherId: "w", status: "confirmed" },
      { watcherId: "w", status: "dismissed" },
      { watcherId: "w", status: "pending" },
      { watcherId: "x", status: "confirmed" },
    ];
    expect(reviewedPrecision(hits, "w")).toEqual({ confirmed: 1, dismissed: 1, pending: 1 });
  });
});
