import { describe, expect, it } from "vitest";

import { SAMPLE_LIBRARY } from "./sample-library";
import { addStep, advanceRun, moveStep, removeStep, startRun, summarizeRun, updateStep } from "./tape";

const t0 = "2026-10-02T10:00:00.000Z";
const t1 = "2026-10-02T10:05:00.000Z";
const report = SAMPLE_LIBRARY[0];

describe("tape editing", () => {
  it("adds, edits, moves, and removes frames while bumping the revision", () => {
    let tape = addStep(report, { title: "  Archive the CSV ", detail: "" }, t0, "wr-6");
    expect(tape.steps.at(-1)).toEqual({ id: "wr-6", title: "Archive the CSV", detail: "" });
    tape = updateStep(tape, "wr-6", { detail: "Shared drive, Reports folder" }, t0);
    tape = moveStep(tape, "wr-6", -1, t0);
    expect(tape.steps.map((s) => s.id).slice(-2)).toEqual(["wr-6", "wr-5"]);
    tape = removeStep(tape, "wr-6", t1);
    expect(tape.steps).toHaveLength(5);
    expect(tape.revision).toBe(report.revision + 4);
    expect(tape.updatedAt).toBe(t1);
  });

  it("refuses an empty frame title", () => {
    expect(() => addStep(report, { title: "  ", detail: "x" }, t0)).toThrow("A step needs a title");
  });
});

describe("guided runs", () => {
  it("moves the playhead through done, failed, retry, and skip", () => {
    let run = startRun(report, t0, "run-1");
    run = advanceRun(run, { type: "done" }, t0);
    expect(run.playhead).toBe(1);
    run = advanceRun(run, { type: "fail" }, t0);
    expect(run.playhead).toBe(1);
    expect(advanceRun(run, { type: "done" }, t0).playhead).toBe(2); // done after a failure still advances
    run = advanceRun(run, { type: "retry" }, t0);
    run = advanceRun(run, { type: "annotate", note: "Date picker was slow" }, t0);
    run = advanceRun(run, { type: "done" }, t0);
    expect(run.frames[1]).toMatchObject({ outcome: "done", attempts: 2, note: "Date picker was slow" });
    run = advanceRun(run, { type: "skip" }, t0);
    run = advanceRun(run, { type: "done" }, t0);
    run = advanceRun(run, { type: "done" }, t1);
    expect(run.status).toBe("finished");
    expect(run.endedAt).toBe(t1);
    expect(summarizeRun(run)).toEqual({ done: 4, skipped: 1, failed: 0, total: 5 });
  });

  it("ignores step actions while paused and needs a reason to stop", () => {
    let run = advanceRun(startRun(report, t0, "run-2"), { type: "pause" }, t0);
    expect(advanceRun(run, { type: "done" }, t0).playhead).toBe(0);
    run = advanceRun(run, { type: "resume" }, t0);
    expect(() => advanceRun(run, { type: "stop", reason: " " }, t0)).toThrow("Say why");
    run = advanceRun(run, { type: "stop", reason: "Export was empty" }, t1);
    expect(run).toMatchObject({ status: "stopped", stopReason: "Export was empty", endedAt: t1 });
    expect(advanceRun(run, { type: "done" }, t1)).toBe(run);
  });

  it("will not play an empty tape", () => {
    expect(() => startRun({ ...report, steps: [] }, t0)).toThrow("Add a step");
  });
});
