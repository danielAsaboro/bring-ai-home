"use client";

import { useState, type ChangeEvent } from "react";

import { AssistError, serviceClient, type AssistClient } from "./assist-client";
import type { Asset } from "./binder";
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
  client = serviceClient,
  onAccept,
}: {
  asset: Asset;
  client?: AssistClient;
  onAccept: (field: LabelField, value: string) => void;
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

  async function onLabel(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    const result = await run("Reading the label locally…", () => client.readLabel(file));
    if (result) setFacts({ assetId: asset.id, model: result.model, items: result.facts });
  }

  const visibleFacts = facts?.assetId === asset.id ? facts : null;

  return (
    <section aria-label="Local assistant" className="space-y-3 rounded border border-emerald-800/40 bg-emerald-50/50 p-3 text-sm">
      <h3 className="font-serif text-lg">Local assistant</h3>
      <p className="text-xs text-stone-600">Runs on this computer through QVAC. It proposes; you decide what goes in the binder.</p>

      <label className="block">
        <span className="font-medium">Read a rating plate</span>
        <input type="file" accept="image/png,image/jpeg" aria-label="Rating plate photo" onChange={onLabel} className="mt-1 block text-xs" />
      </label>

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
