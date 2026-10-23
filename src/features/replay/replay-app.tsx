"use client";

import { useEffect, useMemo, useState } from "react";

import { mergeConditions } from "./conditions";
import { DemonstrationPanel } from "./demonstration-panel";
import { filterByWords } from "./search";
import { tapeToSkill } from "./skill-export";
import { findTape } from "./service-client";
import { createLocalStore, type LibraryState, type LibraryStore } from "./library-store";
import {
  addStep,
  advanceRun,
  blankTape,
  moveStep,
  removeStep,
  startRun,
  summarizeRun,
  tapeText,
  updateStep,
  updateTape,
  type Run,
  type RunAction,
  type Tape,
} from "./tape";

type Mode = "edit" | "play" | "history";

const now = () => new Date().toISOString();

function lines(text: string) {
  return text.split("\n").map((l) => l.trim()).filter(Boolean);
}

export function ReplayApp({ store }: { store?: LibraryStore }) {
  const [library] = useState(() => store ?? createLocalStore(globalThis.localStorage));
  const [state, setState] = useState<LibraryState>(() => library.load());
  const [selectedId, setSelectedId] = useState<string>(() => state.tapes[0]?.id ?? "");
  const [mode, setMode] = useState<Mode>("edit");
  const [runId, setRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [found, setFound] = useState<{ ids: string[]; note: string } | null>(null);

  useEffect(() => library.save(state), [library, state]);

  const tape = state.tapes.find((t) => t.id === selectedId) ?? null;
  const run = state.runs.find((r) => r.id === runId) ?? null;

  function commitTape(next: Tape) {
    setState((s) => ({ ...s, tapes: s.tapes.map((t) => (t.id === next.id ? next : t)) }));
  }

  function attempt(fn: () => void) {
    try {
      setError(null);
      fn();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : String(cause));
    }
  }

  function play(t: Tape) {
    attempt(() => {
      const r = startRun(t, now());
      setState((s) => ({ ...s, runs: [r, ...s.runs] }));
      setRunId(r.id);
      setMode("play");
    });
  }

  function act(action: RunAction) {
    if (!run) return;
    attempt(() => {
      const next = advanceRun(run, action, now());
      setState((s) => ({ ...s, runs: s.runs.map((r) => (r.id === next.id ? next : r)) }));
    });
  }

  async function describeJob() {
    setFound({ ids: [], note: "Searching on this machine…" });
    const result = await findTape({ query, tapes: state.tapes.map((t) => ({ id: t.id, text: tapeText(t) })) });
    if (!result.ok) {
      // The word filter below keeps working; say what failed without inventing matches.
      setFound({ ids: [], note: `${result.message} Showing word matches instead.` });
      return;
    }
    setFound({
      ids: result.value.matches.map((m) => m.tapeId),
      note: result.value.matches.length
        ? `Closest tapes by meaning (${result.value.model}).`
        : "No tape is close enough. Try other words or record a new tape.",
    });
  }

  const shelf = found && found.ids.length
    ? found.ids.map((id) => state.tapes.find((t) => t.id === id)).filter((t): t is Tape => Boolean(t))
    : filterByWords(state.tapes, found ? query : "");

  function newTape() {
    const t = blankTape("Untitled tape", now());
    setState((s) => ({ ...s, tapes: [t, ...s.tapes] }));
    setSelectedId(t.id);
    setMode("edit");
  }

  function resetDemo() {
    const fresh = library.reset();
    setState(fresh);
    setSelectedId(fresh.tapes[0]?.id ?? "");
    setRunId(null);
    setMode("edit");
  }

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-stone-800 px-4 py-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Replay</h1>
          <p className="text-sm text-stone-400">A tape library for repeatable work.</p>
        </div>
        <button type="button" onClick={resetDemo} className="rounded border border-stone-700 px-3 py-1 text-sm">
          Reset demo data
        </button>
      </header>
      <div className="grid gap-4 p-4 md:grid-cols-[18rem_1fr]">
        <nav aria-label="Tape shelf" className="space-y-2">
          <button type="button" onClick={newTape} className="w-full rounded bg-amber-500 px-3 py-2 font-semibold text-stone-950">
            New tape
          </button>
          <form
            className="space-y-1"
            onSubmit={(e) => {
              e.preventDefault();
              if (query.trim()) void describeJob();
            }}
          >
            <input
              aria-label="Describe the job"
              placeholder="Describe the job…"
              className="w-full rounded border border-stone-700 bg-stone-900 px-2 py-1 text-sm"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setFound(null);
              }}
            />
            <button type="submit" className="w-full rounded border border-stone-700 px-2 py-1 text-sm">
              Find tape
            </button>
            {found && <p className="text-xs text-stone-400">{found.note}</p>}
          </form>
          <ul className="space-y-2">
            {shelf.map((t) => (
              <li key={t.id}>
                <button
                  type="button"
                  aria-pressed={t.id === selectedId}
                  onClick={() => {
                    setSelectedId(t.id);
                    setMode("edit");
                  }}
                  className={`w-full rounded border px-3 py-2 text-left ${
                    t.id === selectedId ? "border-amber-500 bg-stone-900" : "border-stone-800"
                  }`}
                >
                  <span className="block font-medium">{t.title}</span>
                  <span className="text-xs text-stone-400">
                    {t.steps.length} frames · rev {t.revision}
                  </span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <main className="min-w-0 space-y-4">
          {error && (
            <p role="alert" className="rounded border border-red-700 bg-red-950 px-3 py-2 text-sm">
              {error}
            </p>
          )}
          {tape ? (
            <>
              <div role="tablist" aria-label="Tape views" className="flex gap-2">
                {(["edit", "play", "history"] as const).map((m) => (
                  <button
                    key={m}
                    type="button"
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => (m === "play" && (!run || run.tapeId !== tape.id) ? play(tape) : setMode(m))}
                    className={`rounded px-3 py-1 text-sm capitalize ${mode === m ? "bg-stone-100 text-stone-950" : "bg-stone-800"}`}
                  >
                    {m}
                  </button>
                ))}
              </div>
              {mode === "edit" && <TapeEditor key={tape.id} tape={tape} onChange={(t) => attempt(() => commitTape(t))} attempt={attempt} />}
              {mode === "play" && run && run.tapeId === tape.id && (
                <Player tape={tape} run={run} onAction={act} onReplay={() => play(tape)} />
              )}
              {mode === "history" && <History tape={tape} runs={state.runs.filter((r) => r.tapeId === tape.id)} />}
            </>
          ) : (
            <p>Choose a tape from the shelf.</p>
          )}
        </main>
      </div>
    </div>
  );
}

function TapeEditor({
  tape,
  onChange,
  attempt,
}: {
  tape: Tape;
  onChange: (t: Tape) => void;
  attempt: (fn: () => void) => void;
}) {
  const [title, setTitle] = useState("");
  const [detail, setDetail] = useState("");
  const field = "w-full rounded border border-stone-700 bg-stone-900 px-2 py-1";

  return (
    <section aria-label="Tape editor" className="space-y-4">
      <label className="block text-sm">
        Tape title
        <input
          className={field}
          value={tape.title}
          onChange={(e) => attempt(() => onChange(updateTape(tape, { title: e.target.value }, now())))}
        />
      </label>
      <label className="block text-sm">
        Summary
        <textarea
          className={field}
          value={tape.summary}
          onChange={(e) => onChange(updateTape(tape, { summary: e.target.value }, now()))}
        />
      </label>
      <DemonstrationPanel
        onAddFrames={(steps) =>
          attempt(() =>
            onChange(steps.reduce((t, s) => addStep(t, { title: s.title, detail: s.detail }, now()), tape)),
          )
        }
        onAddConditions={(accepted) => onChange(updateTape(tape, mergeConditions(tape, accepted), now()))}
      />
      <ol aria-label="Frames" className="space-y-2">
        {tape.steps.map((s, i) => (
          <li key={s.id} className="rounded border border-stone-800 p-2">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-xs text-amber-400">{String(i + 1).padStart(2, "0")}</span>
              <input
                aria-label={`Frame ${i + 1} title`}
                className={`${field} flex-1`}
                value={s.title}
                onChange={(e) => attempt(() => onChange(updateStep(tape, s.id, { title: e.target.value }, now())))}
              />
              <button type="button" aria-label={`Move frame ${i + 1} up`} onClick={() => onChange(moveStep(tape, s.id, -1, now()))}>
                ↑
              </button>
              <button type="button" aria-label={`Move frame ${i + 1} down`} onClick={() => onChange(moveStep(tape, s.id, 1, now()))}>
                ↓
              </button>
              <button type="button" aria-label={`Remove frame ${i + 1}`} onClick={() => onChange(removeStep(tape, s.id, now()))}>
                ✕
              </button>
            </div>
            <textarea
              aria-label={`Frame ${i + 1} detail`}
              className={`${field} mt-1 text-sm`}
              value={s.detail}
              onChange={(e) => onChange(updateStep(tape, s.id, { detail: e.target.value }, now()))}
            />
          </li>
        ))}
      </ol>
      <form
        className="flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          attempt(() => {
            onChange(addStep(tape, { title, detail }, now()));
            setTitle("");
            setDetail("");
          });
        }}
      >
        <input aria-label="New frame title" placeholder="New frame title" className={`${field} flex-1`} value={title} onChange={(e) => setTitle(e.target.value)} />
        <input aria-label="New frame detail" placeholder="Detail (optional)" className={`${field} flex-1`} value={detail} onChange={(e) => setDetail(e.target.value)} />
        <button type="submit" className="rounded bg-stone-100 px-3 py-1 text-stone-950">
          Add frame
        </button>
      </form>
      <SkillExport tape={tape} />
      <div className="grid gap-3 md:grid-cols-3">
        <ListField
          label="Parameters (name = example)"
          value={tape.parameters.map((p) => `${p.name} = ${p.example}`).join("\n")}
          onCommit={(text) =>
            onChange(
              updateTape(
                tape,
                {
                  parameters: lines(text).map((l) => {
                    const [name, ...rest] = l.split("=");
                    return { name: name.trim(), example: rest.join("=").trim() };
                  }),
                },
                now(),
              ),
            )
          }
        />
        <ListField
          label="Preconditions"
          value={tape.preconditions.join("\n")}
          onCommit={(text) => onChange(updateTape(tape, { preconditions: lines(text) }, now()))}
        />
        <ListField
          label="Stop conditions"
          value={tape.stopConditions.join("\n")}
          onCommit={(text) => onChange(updateTape(tape, { stopConditions: lines(text) }, now()))}
        />
      </div>
    </section>
  );
}

function SkillExport({ tape }: { tape: Tape }) {
  const [preview, setPreview] = useState<{ fileName: string; content: string } | null>(null);
  const [problem, setProblem] = useState<string | null>(null);

  function exportSkill() {
    try {
      const skill = tapeToSkill(tape);
      setProblem(null);
      setPreview(skill);
      const url = URL.createObjectURL(new Blob([skill.content], { type: "text/markdown" }));
      const a = document.createElement("a");
      a.href = url;
      a.download = "SKILL.md";
      a.click();
      URL.revokeObjectURL(url);
    } catch (cause) {
      setProblem(cause instanceof Error ? cause.message : String(cause));
    }
  }

  return (
    <div className="space-y-2">
      <button type="button" onClick={exportSkill} className="rounded border border-stone-700 px-3 py-1 text-sm">
        Export as agent skill
      </button>
      {problem && <p role="alert" className="text-sm text-red-300">{problem}</p>}
      {preview && (
        <figure>
          <figcaption className="text-xs text-stone-400">{preview.fileName} · written by Replay, not by a model</figcaption>
          <pre aria-label="Skill preview" className="max-h-64 overflow-auto rounded bg-stone-900 p-2 text-xs">
            {preview.content}
          </pre>
        </figure>
      )}
    </div>
  );
}

type ListFieldProps = { label: string; value: string; onCommit: (text: string) => void };

// Remount when the saved value changes (for example after accepting proposals), so the draft follows it.
function ListField(props: ListFieldProps) {
  return <ListFieldDraft key={props.value} {...props} />;
}

function ListFieldDraft({ label, value, onCommit }: ListFieldProps) {
  const [draft, setDraft] = useState(value);
  return (
    <label className="block text-sm">
      {label}
      <textarea
        className="h-24 w-full rounded border border-stone-700 bg-stone-900 px-2 py-1"
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={() => {
          if (draft !== value) onCommit(draft);
        }}
      />
    </label>
  );
}

function Player({ tape, run, onAction, onReplay }: { tape: Tape; run: Run; onAction: (a: RunAction) => void; onReplay: () => void }) {
  const [note, setNote] = useState("");
  const [reason, setReason] = useState("");
  const steps = useMemo(() => new Map(tape.steps.map((s) => [s.id, s])), [tape.steps]);
  const current = run.frames[run.playhead];
  const step = steps.get(current.stepId);
  const ended = run.status === "finished" || run.status === "stopped";
  const btn = "rounded border border-stone-700 px-3 py-1 text-sm disabled:opacity-40";

  return (
    <section aria-label="Player" className="space-y-4">
      <p className="text-sm text-stone-400">
        Replay guides you. It never performs a step for you. Status: <strong>{run.status}</strong>
      </p>
      {tape.stopConditions.length > 0 && (
        <div className="rounded border border-amber-700 p-2 text-sm">
          <p className="font-semibold">Stop safely if</p>
          <ul className="list-disc pl-5">
            {tape.stopConditions.map((c) => (
              <li key={c}>{c}</li>
            ))}
          </ul>
        </div>
      )}
      <ol aria-label="Tape frames" className="flex gap-1 overflow-x-auto pb-1">
        {run.frames.map((f, i) => (
          <li
            key={f.stepId}
            aria-current={i === run.playhead && !ended ? "step" : undefined}
            title={steps.get(f.stepId)?.title}
            className={`min-w-10 rounded px-2 py-1 text-center font-mono text-xs ${
              i === run.playhead && !ended
                ? "bg-amber-500 text-stone-950"
                : i < run.playhead || run.status === "finished"
                  ? f.outcome === "done"
                    ? "bg-emerald-800"
                    : f.outcome === "failed"
                      ? "bg-red-800"
                      : "bg-stone-700"
                  : "bg-stone-900"
            }`}
          >
            {String(i + 1).padStart(2, "0")}
          </li>
        ))}
      </ol>
      {!ended && step && (
        <div className="rounded border border-stone-700 p-3">
          <p className="text-xs text-stone-400">
            Frame {run.playhead + 1} of {run.frames.length}
            {current.outcome === "failed" && " · marked failed"}
          </p>
          <h2 className="text-lg font-semibold">{step.title}</h2>
          <p className="text-sm text-stone-300">{step.detail}</p>
        </div>
      )}
      {!ended ? (
        <div className="flex flex-wrap gap-2">
          <button type="button" className={btn} disabled={run.status === "paused" || current.outcome === "failed"} onClick={() => onAction({ type: "done" })}>
            Done
          </button>
          <button type="button" className={btn} disabled={run.status === "paused"} onClick={() => onAction({ type: "skip" })}>
            Skip
          </button>
          <button type="button" className={btn} disabled={run.status === "paused" || current.outcome === "failed"} onClick={() => onAction({ type: "fail" })}>
            Mark failed
          </button>
          <button type="button" className={btn} disabled={current.outcome !== "failed" || run.status === "paused"} onClick={() => onAction({ type: "retry" })}>
            Retry
          </button>
          {run.status === "paused" ? (
            <button type="button" className={btn} onClick={() => onAction({ type: "resume" })}>
              Resume
            </button>
          ) : (
            <button type="button" className={btn} onClick={() => onAction({ type: "pause" })}>
              Pause
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-2">
          <p role="status">
            {run.status === "finished" ? "Run finished." : `Run stopped: ${run.stopReason}`}{" "}
            {(() => {
              const s = summarizeRun(run);
              return `${s.done} done, ${s.skipped} skipped, ${s.failed} failed.`;
            })()}
          </p>
          <button type="button" className={btn} onClick={onReplay}>
            Play again
          </button>
        </div>
      )}
      {!ended && (
        <div className="grid gap-2 md:grid-cols-2">
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAction({ type: "annotate", note });
              setNote("");
            }}
          >
            <input aria-label="Frame note" placeholder={current.note || "Note for this frame"} className="flex-1 rounded border border-stone-700 bg-stone-900 px-2" value={note} onChange={(e) => setNote(e.target.value)} />
            <button type="submit" className={btn}>
              Save note
            </button>
          </form>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              onAction({ type: "stop", reason });
            }}
          >
            <input aria-label="Stop reason" placeholder="Why stop?" className="flex-1 rounded border border-stone-700 bg-stone-900 px-2" value={reason} onChange={(e) => setReason(e.target.value)} />
            <button type="submit" className={btn}>
              Stop safely
            </button>
          </form>
        </div>
      )}
    </section>
  );
}

function History({ tape, runs }: { tape: Tape; runs: Run[] }) {
  if (runs.length === 0) return <p className="text-sm text-stone-400">No runs of “{tape.title}” yet.</p>;
  return (
    <ul aria-label="Run history" className="space-y-2">
      {runs.map((r) => {
        const s = summarizeRun(r);
        return (
          <li key={r.id} className="rounded border border-stone-800 p-2 text-sm">
            <p>
              <strong>{r.status}</strong> · {new Date(r.startedAt).toLocaleString()} · rev {r.tapeRevision}
            </p>
            <p>
              {s.done} done, {s.skipped} skipped, {s.failed} failed of {s.total}
              {r.stopReason ? ` · stopped: ${r.stopReason}` : ""}
            </p>
            {r.frames.some((f) => f.note) && (
              <ul className="list-disc pl-5 text-stone-400">
                {r.frames
                  .filter((f) => f.note)
                  .map((f) => (
                    <li key={f.stepId}>
                      {tape.steps.find((st) => st.id === f.stepId)?.title ?? "Removed frame"}: {f.note}
                    </li>
                  ))}
              </ul>
            )}
          </li>
        );
      })}
    </ul>
  );
}
