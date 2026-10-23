import { describe, expect, it } from "vitest";

import type { CheckOutcome } from "./check-client";
import { sampleSources } from "./sources";
import { decideHit, evaluateWatcher, mergeHits } from "./watch-eval";
import type { Watcher } from "./watcher";

const gate = sampleSources[0].frames;
const watcher: Watcher = { id: "w1", sourceId: "front-gate", condition: "a parcel left by the gate", fromHour: 0, toHour: 0, minMotion: 0 };

// Fixture verdicts keyed by frame. These are hand-written, not model output.
function fixtureCheck(answers: Record<string, "yes" | "no" | "unclear">) {
  return async (frame: { id: string }): Promise<CheckOutcome> => ({
    ok: true,
    value: { frameId: frame.id, frameDigest: "d", model: "fixture", raw: "", ms: 1, verdict: { answer: answers[frame.id] ?? "no", reason: "" } },
  });
}

describe("evaluateWatcher", () => {
  it("only turns a clear yes into a pending hit", async () => {
    const run = await evaluateWatcher(watcher, gate, fixtureCheck({ "front-gate-2": "unclear", "front-gate-3": "yes" }));
    expect(run.checked).toBe(4);
    expect(run.hits.map((h) => [h.frameId, h.status])).toEqual([["front-gate-3", "pending"]]);
  });

  it("skips frames the ordinary prefilters exclude", async () => {
    const run = await evaluateWatcher({ ...watcher, minMotion: 0.3 }, gate, fixtureCheck({}));
    expect(run).toMatchObject({ checked: 2, skipped: 2 });
  });

  it("stops at the first unavailable answer and reports it", async () => {
    const down = async (): Promise<CheckOutcome> => ({ ok: false, kind: "unavailable", message: "not running" });
    const run = await evaluateWatcher(watcher, gate, down);
    expect(run).toMatchObject({ checked: 0, hits: [], errors: ["front-gate-1: not running"] });
  });

  it("keeps human decisions across re-runs", async () => {
    const first = await evaluateWatcher(watcher, gate, fixtureCheck({ "front-gate-3": "yes" }));
    const decided = decideHit(first.hits, "w1:front-gate-3", "dismissed");
    const again = mergeHits(decided, first.hits);
    expect(again).toHaveLength(1);
    expect(again[0].status).toBe("dismissed");
  });
});
