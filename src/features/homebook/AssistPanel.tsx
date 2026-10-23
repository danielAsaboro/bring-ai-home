"use client";

import { useState, type ChangeEvent, type FormEvent } from "react";

import { AssistError, serviceClient, type AssistClient } from "./assist-client";
import type { AssetIdentity } from "./asset-identity";
import type { Asset, AssetCategory, FiledDocument, MaintenanceTask, ServiceRecord } from "./binder";
import type { CitedAnswer } from "./cited-answer";
import type { LabelFact, LabelField } from "./label-facts";

const FIELD_NAMES: Record<LabelField, string> = {
  brand: "Brand",
  model: "Model",
  serial: "Serial",
  installedOn: "Installed",
};

type Status = { state: "idle" } | { state: "working"; what: string } | { state: "error"; message: string };

export function AssistPanel({
  asset,
  manuals = [],
  history = [],
  tasks = [],
  onSaveNotes,
  client = serviceClient,
  onAccept,
}: {
  asset: Asset;
  manuals?: FiledDocument[];
  history?: ServiceRecord[];
  tasks?: MaintenanceTask[];
  onSaveNotes?: (notes: string) => void;
  client?: AssistClient;
  onAccept: (field: LabelField | "category" | "name", value: string) => void;
}) {
  const [status, setStatus] = useState<Status>({ state: "idle" });
  const [facts, setFacts] = useState<{ assetId: string; model: string; items: LabelFact[] } | null>(null);

  async function run<T>(what: string, job: () => Promise<T>): Promise<T | null> {
    setStatus({ state: "working", what });
    try {
      const result = await job();
      setStatus({ state: "idle" });
      return result;
    } catch (error) {
      const message = error instanceof AssistError ? error.message : "Something went wrong. The binder is unchanged.";
      setStatus({ state: "error", message });
      return null;
    }
  }

  const [identity, setIdentity] = useState<{ assetId: string; model: string; value: AssetIdentity } | null>(null);

  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<{ assetId: string; model: string; value: CitedAnswer } | null>(null);

  async function onAsk(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!question.trim()) return;
    const docIds = manuals.map((m) => m.id);
    const result = await run("Searching your manuals locally…", () => client.ask(question, docIds));
    if (result) setAnswer({ assetId: asset.id, model: result.model, value: result });
  }

  const [summary, setSummary] = useState<{ assetId: string; model: string; text: string; unsupportedDates: string[] } | null>(null);

  async function onSummarise() {
    const result = await run("Drafting a summary locally…", () => client.summarise({ asset, history, tasks }));
    if (result) setSummary({ assetId: asset.id, model: result.model, text: result.draft, unsupportedDates: result.unsupportedDates });
  }

  async function onPhoto(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await run("Looking at the photo locally…", () => client.identify(file));
    if (result) setIdentity({ assetId: asset.id, model: result.model, value: result.identity });
  }

  async function onLabel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await run("Reading the label locally…", () => client.readLabel(file));
    if (result) setFacts({ assetId: asset.id, model: result.model, items: result.facts });
  }

  const visibleSummary = summary?.assetId === asset.id ? summary : null;
  const visibleAnswer = answer?.assetId === asset.id ? answer : null;
  const visibleIdentity = identity?.assetId === asset.id ? identity : null;
  const acceptCategory = (category: AssetCategory) => {
    onAccept("category", category);
    setIdentity(null);
  };
  const visibleFacts = facts?.assetId === asset.id ? facts : null;

  return (
    <section aria-label="Local assistant" className="space-y-3 rounded border border-emerald-800/40 bg-emerald-50/50 p-3 text-sm">
      <h3 className="font-serif text-lg">Local assistant</h3>
      <p className="text-xs text-stone-600">Runs on this computer through QVAC. It proposes; you decide what goes in the binder.</p>

      <label className="block">
        <span className="font-medium">Read a rating plate</span>
        <input type="file" accept="image/png,image/jpeg" aria-label="Rating plate photo" onChange={onLabel} className="mt-1 block text-xs" />
      </label>

      <label className="block">
        <span className="font-medium">Identify from a photo</span>
        <input type="file" accept="image/png,image/jpeg" aria-label="Asset photo" onChange={onPhoto} className="mt-1 block text-xs" />
      </label>

      {visibleIdentity ? (
        <div aria-label="Proposed identity" role="group" className="rounded border border-stone-300 bg-white p-2">
          <p>
            Looks like: <strong>{visibleIdentity.value.category}</strong>
            {visibleIdentity.value.name ? <> · “{visibleIdentity.value.name}”</> : null}
          </p>
          <p className="text-xs text-stone-600">
            Proposed by {visibleIdentity.model}. Model said: “{visibleIdentity.value.rawText}”
            {visibleIdentity.value.categoryUnrecognised ? " (not one of Homebook's categories, so it became other)" : ""}
          </p>
          <div className="mt-1 flex gap-2">
            <button type="button" className="rounded border border-emerald-800 px-2 py-0.5" onClick={() => acceptCategory(visibleIdentity.value.category)}>
              Use category
            </button>
            <button type="button" className="rounded border border-stone-400 px-2 py-0.5" onClick={() => setIdentity(null)}>
              Dismiss
            </button>
          </div>
        </div>
      ) : null}

      {manuals.length > 0 ? (
        <form onSubmit={onAsk} aria-label="Ask the manuals" className="space-y-1">
          <label className="block font-medium" htmlFor="manual-question">Ask this asset&apos;s manuals</label>
          <div className="flex gap-2">
            <input
              id="manual-question"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="How do I relight the pilot?"
              className="flex-1 rounded border border-stone-400 bg-white px-2 py-1"
            />
            <button type="submit" className="rounded bg-emerald-800 px-3 py-1 text-white">Ask</button>
          </div>
        </form>
      ) : (
        <p className="text-xs text-stone-600">File a manual for this asset to ask questions about it.</p>
      )}

      {visibleAnswer ? (
        <div aria-label="Manual answer" role="group" className="rounded border border-stone-300 bg-white p-2">
          {visibleAnswer.value.status === "answered" ? (
            <>
              <p>{visibleAnswer.value.answer}</p>
              <ol className="mt-1 text-xs">
                {visibleAnswer.value.citations.map((c) => (
                  <li key={c.n}>
                    [{c.n}]{" "}
                    <a className="underline" href={`/test-files/homebook/${c.file}`} target="_blank" rel="noreferrer">
                      {c.title}, page {c.page}
                    </a>
                  </li>
                ))}
              </ol>
              <p className="mt-1 text-xs text-stone-600">Drafted by {visibleAnswer.model}. The manual page is the authority; check it before acting.</p>
            </>
          ) : (
            <p>{visibleAnswer.value.message}</p>
          )}
        </div>
      ) : null}

      {onSaveNotes ? (
        <button type="button" onClick={onSummarise} className="rounded border border-emerald-800 px-2 py-0.5">
          Draft maintenance summary
        </button>
      ) : null}

      {visibleSummary && onSaveNotes ? (
        <div aria-label="Summary draft" role="group" className="space-y-1 rounded border border-stone-300 bg-white p-2">
          <label htmlFor="summary-draft" className="text-xs text-stone-600">
            Draft by {visibleSummary.model}. Edit it, then save it to the asset notes.
          </label>
          <textarea
            id="summary-draft"
            value={visibleSummary.text}
            onChange={(e) => setSummary({ ...visibleSummary, text: e.target.value })}
            rows={4}
            className="w-full rounded border border-stone-400 p-1"
          />
          {visibleSummary.unsupportedDates.length > 0 ? (
            <p role="note" className="text-xs text-red-900">
              Not in your records: {visibleSummary.unsupportedDates.join(", ")}. Correct or remove before saving.
            </p>
          ) : null}
          <div className="flex gap-2">
            <button
              type="button"
              className="rounded bg-emerald-800 px-2 py-0.5 text-white"
              onClick={() => {
                onSaveNotes(visibleSummary.text.trim());
                setSummary(null);
              }}
            >
              Save to notes
            </button>
            <button type="button" className="rounded border border-stone-400 px-2 py-0.5" onClick={() => setSummary(null)}>
              Discard
            </button>
          </div>
        </div>
      ) : null}

      {status.state === "working" ? <p role="status">{status.what}</p> : null}
      {status.state === "error" ? <p role="alert" className="text-red-900">{status.message}</p> : null}

      {visibleFacts ? (
        <div>
          <p className="text-xs text-stone-600">Proposed by {visibleFacts.model}. Check each value against the plate.</p>
          {visibleFacts.items.length === 0 ? <p>No label fields were recognised. Enter them by hand.</p> : null}
          <ul aria-label="Proposed label facts" className="divide-y">
            {visibleFacts.items.map((fact) => (
              <li key={fact.field} className="flex flex-wrap items-center justify-between gap-2 py-1">
                <span>
                  <strong>{FIELD_NAMES[fact.field]}:</strong> <code>{fact.value}</code>{" "}
                  <span className="text-xs text-stone-600">
                    from “{fact.sourceText}”{fact.confidence !== null ? ` · ${Math.round(fact.confidence * 100)}%` : ""}
                  </span>
                </span>
                <button
                  type="button"
                  className="rounded border border-emerald-800 px-2 py-0.5"
                  onClick={() => {
                    onAccept(fact.field, fact.value);
                    setFacts({ ...visibleFacts, items: visibleFacts.items.filter((f) => f.field !== fact.field) });
                  }}
                >
                  Use {FIELD_NAMES[fact.field].toLowerCase()}
                </button>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}
