"use client";

import { useEffect, useMemo, useState } from "react";

import { acknowledge, mergeTape, replayFrames } from "./events";
import { ANY_SOURCE, describeRule, type Rule } from "./rules";
import { findFrame, sampleSources } from "./sources";
import { createStore, defaultState, type LookoutState } from "./store";

function browserStorage() {
  try {
    return typeof window === "undefined" ? undefined : window.localStorage;
  } catch {
    return undefined;
  }
}

function sourceName(id: string) {
  return id === ANY_SOURCE ? "Any source" : (sampleSources.find((s) => s.id === id)?.name ?? id);
}

export function ControlRoom() {
  const store = useMemo(() => createStore(browserStorage()), []);
  const [state, setState] = useState<LookoutState>(defaultState);
  const [loaded, setLoaded] = useState(false);
  const [draftKind, setDraftKind] = useState<Rule["kind"]>("motion");
  const [draftSource, setDraftSource] = useState<string>(ANY_SOURCE);
  const [draftValue, setDraftValue] = useState("40");
  const [draftTo, setDraftTo] = useState("6");

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (!active) return;
      setState(store.load());
      setLoaded(true);
    });
    return () => {
      active = false;
    };
  }, [store]);

  function update(next: LookoutState) {
    setState(next);
    store.save(next);
  }

  const armedCount = Object.values(state.armed).filter(Boolean).length;
  const unacked = state.tape.filter((e) => !e.acknowledged).length;

  function addRule() {
    const id = `rule-${Date.now()}`;
    const n = Number(draftValue);
    let rule: Rule;
    if (draftKind === "time") {
      rule = { id, sourceId: draftSource, kind: "time", fromHour: n % 24, toHour: Number(draftTo) % 24 };
    } else if (draftKind === "motion") {
      rule = { id, sourceId: draftSource, kind: "motion", minMotion: Math.min(Math.max(n, 0), 100) / 100 };
    } else {
      rule = { id, sourceId: draftSource, kind: "change", minChange: Math.min(Math.max(n, 0), 100) / 100 };
    }
    update({ ...state, rules: [...state.rules, rule] });
  }

  return (
    <div className="mx-auto max-w-5xl p-4 font-sans text-slate-900">
      <header className="mb-4 flex flex-wrap items-center justify-between gap-2">
        <h1 className="text-2xl font-bold">Lookout</h1>
        <button
          className="rounded border px-3 py-1 text-sm"
          onClick={() => update(store.reset())}
        >
          Reset demo data
        </button>
      </header>

      <p
        role="status"
        aria-label="Armed state"
        className={`mb-6 rounded p-4 text-xl font-bold ${armedCount > 0 ? "bg-red-600 text-white" : "bg-slate-200 text-slate-700"}`}
      >
        {armedCount > 0
          ? `ARMED · ${armedCount} of ${sampleSources.length} sources watched`
          : "DISARMED · no source is watched"}
      </p>

      <section aria-labelledby="tape-heading" className="mb-8">
        <div className="mb-2 flex flex-wrap items-center gap-3">
          <h2 id="tape-heading" className="text-lg font-semibold">
            Event tape
          </h2>
          <span className="text-sm text-slate-600">{unacked} to review</span>
          <button
            className="rounded bg-slate-900 px-3 py-1 text-sm text-white"
            onClick={() =>
              update({ ...state, tape: mergeTape(state.tape, replayFrames(sampleSources, state.armed, state.rules)) })
            }
          >
            Replay stored frames
          </button>
        </div>
        {state.tape.length === 0 ? (
          <p className="text-slate-600">
            {loaded ? "No events. Arm a source and replay its stored frames." : "Loading…"}
          </p>
        ) : (
          <ol aria-label="Events" className="space-y-2">
            {state.tape.map((event) => {
              const frame = findFrame(sampleSources, event.frameId);
              return (
                <li
                  key={event.id}
                  className={`flex flex-wrap items-center gap-3 rounded border p-2 ${event.acknowledged ? "opacity-60" : "border-red-400"}`}
                >
                  {frame ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={frame.image} alt={frame.caption} width={128} height={80} className="rounded" />
                  ) : null}
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {sourceName(event.sourceId)} · {event.at.replace("T", " ")}
                    </p>
                    <p className="text-sm text-slate-600">Matched: {event.reasons.join(", ")}</p>
                  </div>
                  {event.acknowledged ? (
                    <span className="text-sm">Acknowledged</span>
                  ) : (
                    <button
                      className="rounded border px-2 py-1 text-sm"
                      onClick={() => update({ ...state, tape: acknowledge(state.tape, event.id) })}
                    >
                      Acknowledge {sourceName(event.sourceId)} {event.at.slice(11)}
                    </button>
                  )}
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <section aria-labelledby="sources-heading" className="mb-8">
        <h2 id="sources-heading" className="mb-2 text-lg font-semibold">
          Sources
        </h2>
        <p className="mb-2 text-sm text-slate-600">
          Stored still frames from sample sources. Lookout does not connect to cameras.
        </p>
        <ul className="grid gap-3 sm:grid-cols-3">
          {sampleSources.map((source) => {
            const armed = Boolean(state.armed[source.id]);
            const latest = source.frames[source.frames.length - 1];
            return (
              <li key={source.id} className={`rounded border-4 p-2 ${armed ? "border-red-600" : "border-slate-200"}`}>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={latest.image} alt={latest.caption} width={320} height={200} className="w-full rounded" />
                <p className="mt-1 font-medium">{source.name}</p>
                <p className="text-sm text-slate-600">{source.place}</p>
                <button
                  aria-pressed={armed}
                  className={`mt-2 w-full rounded px-2 py-1 font-semibold ${armed ? "bg-red-600 text-white" : "bg-slate-200"}`}
                  onClick={() => update({ ...state, armed: { ...state.armed, [source.id]: !armed } })}
                >
                  {armed ? `Disarm ${source.name}` : `Arm ${source.name}`}
                </button>
              </li>
            );
          })}
        </ul>
      </section>

      <section aria-labelledby="rules-heading">
        <h2 id="rules-heading" className="mb-2 text-lg font-semibold">
          Rules
        </h2>
        <ul aria-label="Rules" className="mb-3 space-y-1">
          {state.rules.map((rule) => (
            <li key={rule.id} className="flex items-center gap-2">
              <span>
                {sourceName(rule.sourceId)}: {describeRule(rule)}
              </span>
              <button
                className="text-sm underline"
                onClick={() => update({ ...state, rules: state.rules.filter((r) => r.id !== rule.id) })}
              >
                Remove
              </button>
            </li>
          ))}
        </ul>
        <div className="flex flex-wrap items-end gap-2 text-sm">
          <label className="flex flex-col">
            Kind
            <select value={draftKind} onChange={(e) => setDraftKind(e.target.value as Rule["kind"])} className="border">
              <option value="motion">Motion at least (%)</option>
              <option value="change">Scene change at least (%)</option>
              <option value="time">Only between hours</option>
            </select>
          </label>
          <label className="flex flex-col">
            Source
            <select value={draftSource} onChange={(e) => setDraftSource(e.target.value)} className="border">
              <option value={ANY_SOURCE}>Any source</option>
              {sampleSources.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.name}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col">
            {draftKind === "time" ? "From hour" : "Threshold"}
            <input value={draftValue} onChange={(e) => setDraftValue(e.target.value)} inputMode="numeric" className="w-20 border" />
          </label>
          {draftKind === "time" ? (
            <label className="flex flex-col">
              To hour
              <input value={draftTo} onChange={(e) => setDraftTo(e.target.value)} inputMode="numeric" className="w-20 border" />
            </label>
          ) : null}
          <button className="rounded border px-3 py-1" onClick={addRule}>
            Add rule
          </button>
        </div>
      </section>
    </div>
  );
}
