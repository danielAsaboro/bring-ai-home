"use client";

import { useState } from "react";

import { AssistError, type AssistClient, type CritiqueResult } from "./assist-client";
import type { Deck } from "./deck";
import { rubricLabel } from "./house-rubric";

const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50";
const ghost = "rounded border border-slate-400 px-2 py-0.5 text-xs hover:bg-slate-100";

// Critique is advice. It never edits a card; the author dismisses or acts on it.
export function CritiquePanel({ deck, client }: { deck: Deck; client: AssistClient }) {
  const [result, setResult] = useState<CritiqueResult | null>(null);
  const [dismissed, setDismissed] = useState<Set<number>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const title = (id: string | null) => (id ? (deck.cards.find((c) => c.id === id)?.title ?? id) : "Whole deck");

  async function run() {
    setBusy(true);
    setError(null);
    try {
      setResult(await client.critique(deck));
      setDismissed(new Set());
    } catch (e) {
      setError(e instanceof AssistError ? e.message : "Critique failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="House rubric critique" className="space-y-2 rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Critique against the house rubric</h3>
      <button className={button} disabled={busy} onClick={() => void run()}>
        Critique this deck
      </button>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {result && (
        <p className="text-xs text-slate-500">
          {result.model} · {result.adapter ? "house-rubric adapter applied" : "base model, no adapter"} · {result.dropped} finding(s) removed by the app
        </p>
      )}
      <ul className="space-y-1">
        {result?.findings.map((f, i) =>
          dismissed.has(i) ? null : (
            <li key={i} className="rounded bg-violet-50 p-2 text-sm">
              <span className="block text-xs font-medium">
                {rubricLabel(f.rubricId)} · {title(f.cardId)}
              </span>
              {f.note}
              <button className={`${ghost} ml-2`} onClick={() => setDismissed((s) => new Set(s).add(i))}>
                Dismiss
              </button>
            </li>
          ),
        )}
      </ul>
    </section>
  );
}
