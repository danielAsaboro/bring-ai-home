"use client";

import { useState } from "react";

import { AssistError, type AssistClient } from "./assist-client";
import type { Deck } from "./deck";
import { cardsInPlayOrder, duplicateBeats, pacingFlags, type HealthFlag } from "./deck-health";
import { cardText } from "./evidence-pool";

const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50";
const ghost = "rounded border border-slate-400 px-2 py-0.5 text-xs hover:bg-slate-100";

export function HealthPanel({ deck, client, onDiscard }: { deck: Deck; client: AssistClient; onDiscard: (cardId: string) => void }) {
  const [duplicates, setDuplicates] = useState<HealthFlag[]>([]);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const present = new Set(deck.cards.map((c) => c.id));
  const flags = [...pacingFlags(deck), ...duplicates.filter((f) => f.cardIds.every((id) => present.has(id)))].filter((f) => !dismissed.has(f.id));

  async function checkDuplicates() {
    setBusy(true);
    setError(null);
    try {
      const cards = cardsInPlayOrder(deck);
      if (cards.length < 2) return setDuplicates([]);
      const { vectors } = await client.embed(cards.map(cardText));
      setDuplicates(duplicateBeats(cards, vectors));
    } catch (e) {
      setError(e instanceof AssistError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Deck health" className="space-y-2 rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Duplicate beats and pacing</h3>
      <button className={button} disabled={busy} onClick={() => void checkDuplicates()}>
        Check for duplicate beats
      </button>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {flags.length === 0 && <p className="text-sm">No flags.</p>}
      <ul className="space-y-1">
        {flags.map((f) => (
          <li key={f.id} className="flex flex-wrap items-center gap-2 rounded bg-rose-50 p-2 text-sm">
            <span className="flex-1">{f.message}</span>
            {f.kind === "duplicate-beat" && (
              <button className={ghost} onClick={() => onDiscard(f.cardIds[1])}>
                Discard the later card
              </button>
            )}
            <button className={ghost} onClick={() => setDismissed((s) => new Set(s).add(f.id))}>
              Keep as is
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
