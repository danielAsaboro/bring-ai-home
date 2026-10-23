"use client";

import { useEffect, useMemo, useReducer, useRef, useState } from "react";

import { ProposalPanel } from "./ProposalPanel";
import { checkExamples, samplePatterns, type Pattern } from "./patterns";
import { defaultRule, describeRule, RULE_KINDS, runWeave, type Rule, type RuleKind } from "./rules";
import { createLocalStore, type PatternStore } from "./store";
import { reduce } from "./workbench";

const input = "rounded border border-stone-300 bg-white px-2 py-1 text-sm";
const button = "rounded border border-stone-400 px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-40";

function RuleFields({ rule, onChange }: { rule: Rule; onChange: (rule: Rule) => void }) {
  switch (rule.kind) {
    case "trim":
      return (
        <label className="text-sm">
          <input
            type="checkbox"
            checked={rule.collapse}
            onChange={(e) => onChange({ ...rule, collapse: e.target.checked })}
          />{" "}
          collapse inner spaces
        </label>
      );
    case "split":
      return (
        <span className="flex flex-wrap gap-2 text-sm">
          <label>
            separator <input aria-label="separator" className={`${input} w-12`} value={rule.separator} onChange={(e) => onChange({ ...rule, separator: e.target.value })} />
          </label>
          <label>
            keep parts{" "}
            <input
              aria-label="keep parts"
              className={`${input} w-20`}
              value={rule.order.map((i) => i + 1).join(",")}
              onChange={(e) =>
                onChange({
                  ...rule,
                  order: e.target.value
                    .split(",")
                    .map((s) => Number.parseInt(s.trim(), 10) - 1)
                    .filter((n) => Number.isInteger(n) && n >= 0),
                })
              }
            />
          </label>
          <label>
            join <input aria-label="join" className={`${input} w-12`} value={rule.join} onChange={(e) => onChange({ ...rule, join: e.target.value })} />
          </label>
        </span>
      );
    case "case":
      return (
        <select aria-label="case" className={input} value={rule.to} onChange={(e) => onChange({ ...rule, to: e.target.value as typeof rule.to })}>
          <option value="upper">upper</option>
          <option value="lower">lower</option>
          <option value="title">title</option>
        </select>
      );
    case "replace":
      return (
        <span className="flex flex-wrap gap-2 text-sm">
          <label>
            find <input aria-label="find" className={`${input} w-24`} value={rule.find} onChange={(e) => onChange({ ...rule, find: e.target.value })} />
          </label>
          <label>
            with <input aria-label="with" className={`${input} w-24`} value={rule.with} onChange={(e) => onChange({ ...rule, with: e.target.value })} />
          </label>
        </span>
      );
    case "format":
      return (
        <label className="text-sm">
          template <input aria-label="template" className={`${input} w-40`} value={rule.template} onChange={(e) => onChange({ ...rule, template: e.target.value })} />
        </label>
      );
  }
}

export function Workbench({ store }: { store?: PatternStore }) {
  const storeRef = useRef<PatternStore | null>(store ?? null);
  const [patterns, dispatch] = useReducer(reduce, samplePatterns);
  const hydration = useRef<"waiting" | "loaded" | "ready">("waiting");
  const [selectedId, setSelectedId] = useState(samplePatterns[0].id);
  const [newKind, setNewKind] = useState<RuleKind>("replace");
  const [draftBefore, setDraftBefore] = useState("");
  const [draftAfter, setDraftAfter] = useState("");
  const [sample, setSample] = useState("");
  const [note, setNote] = useState("");

  useEffect(() => {
    storeRef.current ??= createLocalStore(window.localStorage);
    dispatch({ type: "replace-all", patterns: storeRef.current.load() });
    hydration.current = "loaded";
  }, []);

  useEffect(() => {
    // Skip the render that still shows the built-in samples, then save every change.
    if (hydration.current === "loaded") hydration.current = "ready";
    else if (hydration.current === "ready") storeRef.current?.save(patterns);
  }, [patterns]);

  const pattern: Pattern = patterns.find((p) => p.id === selectedId) ?? patterns[0];
  const results = useMemo(() => checkExamples(pattern.rules, pattern.examples), [pattern]);
  const passed = results.filter((r) => r.passed).length;
  const trial = runWeave(pattern.rules, sample);
  const id = pattern.id;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[14rem_1fr]">
      <aside aria-label="Saved patterns" className="space-y-2">
        <h2 className="font-semibold">Saved patterns</h2>
        <ul className="space-y-1">
          {patterns.map((p) => (
            <li key={p.id}>
              <button
                className={`w-full rounded px-2 py-1 text-left text-sm ${p.id === id ? "bg-amber-100 font-medium" : "hover:bg-stone-100"}`}
                aria-current={p.id === id}
                onClick={() => setSelectedId(p.id)}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>
        <button
          className={button}
          onClick={() => {
            const fresh = storeRef.current?.reset() ?? structuredClone(samplePatterns);
            dispatch({ type: "replace-all", patterns: fresh });
            setSelectedId(fresh[0].id);
          }}
        >
          Reset demo data
        </button>
      </aside>

      <main className="space-y-6">
        <header>
          <h2 className="text-xl font-semibold">{pattern.name}</h2>
          <p className="text-sm text-stone-600">{pattern.description}</p>
        </header>

        <section aria-label="Weave" className="space-y-2">
          <h3 className="font-semibold">Weave · ordered rules</h3>
          {pattern.rules.length === 0 && <p className="text-sm text-stone-500">No rules yet. Add the first thread.</p>}
          <ol className="space-y-2">
            {pattern.rules.map((rule, index) => (
              <li key={index} className="rounded border border-stone-200 bg-stone-50 p-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-mono text-xs">{index + 1}. {rule.kind}</span>
                  <RuleFields rule={rule} onChange={(next) => dispatch({ type: "update-rule", patternId: id, index, rule: next })} />
                  <span className="ml-auto flex gap-1">
                    <button className={button} aria-label={`Move rule ${index + 1} up`} disabled={index === 0} onClick={() => dispatch({ type: "move-rule", patternId: id, index, by: -1 })}>↑</button>
                    <button className={button} aria-label={`Move rule ${index + 1} down`} disabled={index === pattern.rules.length - 1} onClick={() => dispatch({ type: "move-rule", patternId: id, index, by: 1 })}>↓</button>
                    <button className={button} aria-label={`Remove rule ${index + 1}`} onClick={() => dispatch({ type: "remove-rule", patternId: id, index })}>✕</button>
                  </span>
                </div>
                <p className="mt-1 text-xs text-stone-600">{describeRule(rule)}</p>
              </li>
            ))}
          </ol>
          <div className="flex gap-2">
            <select aria-label="New rule kind" className={input} value={newKind} onChange={(e) => setNewKind(e.target.value as RuleKind)}>
              {RULE_KINDS.map((k) => (
                <option key={k} value={k}>{k}</option>
              ))}
            </select>
            <button className={button} onClick={() => dispatch({ type: "add-rule", patternId: id, rule: defaultRule(newKind) })}>Add rule</button>
          </div>
        </section>

        <section aria-label="Examples" className="space-y-2">
          <h3 className="font-semibold">Examples · {passed} of {results.length} match</h3>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-stone-500">
                <th>Before</th><th>Expected</th><th>Weave output</th><th></th>
              </tr>
            </thead>
            <tbody>
              {results.map(({ example, actual, passed: ok }) => (
                <tr key={example.id} className={ok ? "bg-emerald-50" : "bg-rose-50"}>
                  <td className="font-mono whitespace-pre">{JSON.stringify(example.before)}</td>
                  <td className="font-mono">{example.after}</td>
                  <td className="font-mono">{actual} <span className="sr-only">{ok ? "match" : "mismatch"}</span>{ok ? " ✓" : " ✗"}</td>
                  <td>
                    <button className={button} aria-label={`Remove example ${example.before}`} onClick={() => dispatch({ type: "remove-example", patternId: id, exampleId: example.id })}>✕</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <form
            className="flex flex-wrap gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              if (!draftBefore) return;
              dispatch({ type: "add-example", patternId: id, example: { id: `e-${crypto.randomUUID()}`, before: draftBefore, after: draftAfter } });
              setDraftBefore("");
              setDraftAfter("");
            }}
          >
            <input aria-label="Example before" placeholder="before" className={input} value={draftBefore} onChange={(e) => setDraftBefore(e.target.value)} />
            <input aria-label="Example after" placeholder="after" className={input} value={draftAfter} onChange={(e) => setDraftAfter(e.target.value)} />
            <button className={button} type="submit">Add example</button>
          </form>
        </section>

        <ProposalPanel examples={pattern.examples} />

        <section aria-label="Try a sample" className="space-y-2">
          <h3 className="font-semibold">Try a sample</h3>
          <input aria-label="Sample input" className={`${input} w-full`} value={sample} onChange={(e) => setSample(e.target.value)} placeholder="Paste one value to weave" />
          <ol className="space-y-1 font-mono text-xs">
            {trial.steps.map((step, i) => (
              <li key={i}>{i + 1}. {JSON.stringify(step.before)} → {JSON.stringify(step.after)}</li>
            ))}
          </ol>
          <p className="text-sm">Output: <output aria-label="Sample output" className="font-mono">{trial.output}</output></p>
        </section>

        <section aria-label="Revisions" className="space-y-2">
          <h3 className="font-semibold">Revisions</h3>
          <form
            className="flex gap-2"
            onSubmit={(e) => {
              e.preventDefault();
              dispatch({ type: "save-revision", patternId: id, id: `r-${crypto.randomUUID()}`, savedAt: new Date().toISOString(), note: note || "Saved weave" });
              setNote("");
            }}
          >
            <input aria-label="Revision note" placeholder="What changed?" className={input} value={note} onChange={(e) => setNote(e.target.value)} />
            <button className={button} type="submit">Save revision</button>
          </form>
          <ul className="space-y-1 text-sm">
            {[...pattern.revisions].reverse().map((r) => (
              <li key={r.id} className="flex items-center gap-2">
                <span>{r.note} · {r.rules.length} rules · {r.savedAt.slice(0, 10)}</span>
                <button className={button} onClick={() => dispatch({ type: "restore-revision", patternId: id, revisionId: r.id })}>Restore {r.note}</button>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
