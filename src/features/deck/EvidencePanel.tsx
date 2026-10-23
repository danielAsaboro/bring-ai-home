"use client";

import { useState } from "react";

import { AssistError, type AssistClient } from "./assist-client";
import type { Card, Library } from "./deck";
import { cardText, evidenceCandidates, rankEvidence, type RankedEvidence } from "./evidence-pool";

const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50";
const ghost = "rounded border border-slate-400 px-2 py-0.5 text-xs hover:bg-slate-100";

export function EvidencePanel({ library, deckId, claim, client, onReuse }: { library: Library; deckId: string; claim: Card; client: AssistClient; onReuse: (card: Card) => void }) {
  const [matches, setMatches] = useState<RankedEvidence[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function find() {
    setBusy(true);
    setError(null);
    try {
      const candidates = evidenceCandidates(library, deckId);
      if (candidates.length === 0) {
        setMatches([]);
        return;
      }
      const { vectors } = await client.embed([cardText(claim), ...candidates.map((c) => cardText(c.card))]);
      setMatches(rankEvidence(vectors[0], candidates, vectors.slice(1)));
    } catch (e) {
      setError(e instanceof AssistError ? e.message : (e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Reusable evidence" className="space-y-2 rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Reusable evidence for “{claim.title}”</h3>
      <button className={button} disabled={busy} onClick={() => void find()}>
        Find evidence cards
      </button>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {matches && matches.length === 0 && <p className="text-sm">No evidence card from another deck is close enough.</p>}
      <ul className="space-y-1">
        {matches?.map((m) => (
          <li key={m.card.id} className="rounded bg-amber-50 p-2 text-sm">
            <span className="block text-xs text-slate-500">
              from {m.deckTitle} · similarity {m.score.toFixed(2)}
            </span>
            <span className="font-medium">{m.card.title}</span> — {m.card.body}
            <button
              className={`${ghost} ml-2`}
              onClick={() => {
                onReuse(m.card);
                setMatches((list) => list?.filter((x) => x.card.id !== m.card.id) ?? null);
              }}
            >
              Reuse {m.card.title}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
