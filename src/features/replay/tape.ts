// Pure tape and run logic. No storage, no React, no model.

export type Step = { id: string; title: string; detail: string };

export type Parameter = { name: string; example: string };

export type Tape = {
  id: string;
  title: string;
  summary: string;
  steps: Step[];
  parameters: Parameter[];
  preconditions: string[];
  stopConditions: string[];
  revision: number;
  updatedAt: string;
};

export type FrameOutcome = "done" | "skipped" | "failed";

export type Frame = { stepId: string; outcome: FrameOutcome; attempts: number; note: string };

export type RunStatus = "playing" | "paused" | "finished" | "stopped";

export type Run = {
  id: string;
  tapeId: string;
  tapeRevision: number;
  startedAt: string;
  endedAt: string | null;
  status: RunStatus;
  playhead: number;
  frames: Frame[];
  stopReason: string | null;
};

let counter = 0;
export function newId(prefix: string) {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter.toString(36)}`;
}

// ---- Editing ---------------------------------------------------------------

function touch(tape: Tape, patch: Partial<Tape>, now: string): Tape {
  return { ...tape, ...patch, revision: tape.revision + 1, updatedAt: now };
}

export function addStep(tape: Tape, step: Omit<Step, "id">, now: string, id = newId("step")): Tape {
  const title = step.title.trim();
  if (!title) throw new Error("A step needs a title");
  return touch(tape, { steps: [...tape.steps, { id, title, detail: step.detail.trim() }] }, now);
}

export function updateStep(tape: Tape, id: string, patch: Partial<Omit<Step, "id">>, now: string): Tape {
  if (patch.title !== undefined && !patch.title.trim()) throw new Error("A step needs a title");
  return touch(
    tape,
    { steps: tape.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)) },
    now,
  );
}

export function removeStep(tape: Tape, id: string, now: string): Tape {
  return touch(tape, { steps: tape.steps.filter((s) => s.id !== id) }, now);
}

export function moveStep(tape: Tape, id: string, delta: -1 | 1, now: string): Tape {
  const index = tape.steps.findIndex((s) => s.id === id);
  const target = index + delta;
  if (index < 0 || target < 0 || target >= tape.steps.length) return tape;
  const steps = [...tape.steps];
  [steps[index], steps[target]] = [steps[target], steps[index]];
  return touch(tape, { steps }, now);
}

export function updateTape(
  tape: Tape,
  patch: Partial<Pick<Tape, "title" | "summary" | "parameters" | "preconditions" | "stopConditions">>,
  now: string,
): Tape {
  if (patch.title !== undefined && !patch.title.trim()) throw new Error("A tape needs a title");
  return touch(tape, patch, now);
}

export function blankTape(title: string, now: string, id = newId("tape")): Tape {
  return {
    id,
    title: title.trim() || "Untitled tape",
    summary: "",
    steps: [],
    parameters: [],
    preconditions: [],
    stopConditions: [],
    revision: 1,
    updatedAt: now,
  };
}

// ---- Guided runs -----------------------------------------------------------
// A run never performs a step. It records what the person says happened.

export function startRun(tape: Tape, now: string, id = newId("run")): Run {
  if (tape.steps.length === 0) throw new Error("Add a step before playing this tape");
  return {
    id,
    tapeId: tape.id,
    tapeRevision: tape.revision,
    startedAt: now,
    endedAt: null,
    status: "playing",
    playhead: 0,
    frames: tape.steps.map((s) => ({ stepId: s.id, outcome: "skipped", attempts: 0, note: "" })),
    stopReason: null,
  };
}

export type RunAction =
  | { type: "done" }
  | { type: "skip" }
  | { type: "fail" }
  | { type: "retry" }
  | { type: "annotate"; note: string }
  | { type: "pause" }
  | { type: "resume" }
  | { type: "stop"; reason: string };

function settle(run: Run, outcome: FrameOutcome, now: string): Run {
  const frames = run.frames.map((f, i) =>
    i === run.playhead ? { ...f, outcome, attempts: f.attempts + 1 } : f,
  );
  if (outcome === "failed") return { ...run, frames };
  const playhead = run.playhead + 1;
  if (playhead >= frames.length) {
    return { ...run, frames, playhead: frames.length - 1, status: "finished", endedAt: now };
  }
  return { ...run, frames, playhead };
}

export function advanceRun(run: Run, action: RunAction, now: string): Run {
  if (run.status === "finished" || run.status === "stopped") return run;
  if (action.type === "pause") return run.status === "playing" ? { ...run, status: "paused" } : run;
  if (action.type === "resume") return run.status === "paused" ? { ...run, status: "playing" } : run;
  if (action.type === "annotate") {
    return {
      ...run,
      frames: run.frames.map((f, i) => (i === run.playhead ? { ...f, note: action.note } : f)),
    };
  }
  if (action.type === "stop") {
    const reason = action.reason.trim();
    if (!reason) throw new Error("Say why the run stopped");
    return { ...run, status: "stopped", endedAt: now, stopReason: reason };
  }
  if (run.status === "paused") return run;
  const current = run.frames[run.playhead];
  if (action.type === "retry") {
    // Retry only makes sense on a failed frame: it keeps the attempt count and plays it again.
    if (current.outcome !== "failed") return run;
    return { ...run, frames: run.frames.map((f, i) => (i === run.playhead ? { ...f, outcome: "skipped" } : f)) };
  }
  if (action.type === "done") return settle(run, "done", now);
  if (action.type === "skip") return settle(run, "skipped", now);
  return settle(run, "failed", now);
}

export function summarizeRun(run: Run) {
  const count = (o: FrameOutcome) => run.frames.filter((f) => f.outcome === o).length;
  return { done: count("done"), skipped: count("skipped"), failed: count("failed"), total: run.frames.length };
}

// Plain text used for search and, later, for the export.
export function tapeText(tape: Tape) {
  return [tape.title, tape.summary, ...tape.steps.map((s) => `${s.title}. ${s.detail}`)]
    .filter(Boolean)
    .join("\n");
}
