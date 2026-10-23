"use client";

import { useState } from "react";

import { keywordLooks, lookText, rankLooks, type LookMatch } from "./look-search";
import type { Closet } from "./model";
import { embedTexts } from "./service-client";

type Outcome = { matches: LookMatch[]; method: string; note?: string };

export function LookSearch({ closet }: { closet: Closet }) {
  const [query, setQuery] = useState("");
  const [outcome, setOutcome] = useState<Outcome | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    const q = query.trim();
    if (!q) return;
    setBusy(true);
    const texts = closet.looks.map((look) => lookText(look, closet.garments));
    const result = await embedTexts([q, ...texts]);
    if (result.ok) {
      const [queryVector, ...lookVectors] = result.value.embeddings;
      setOutcome({
        matches: rankLooks(closet.looks.map((l) => l.id), lookVectors, queryVector),
        method: `${result.value.model} · local embeddings`,
      });
    } else {
      setOutcome({
        matches: keywordLooks(q, closet.looks, closet.garments),
        method: "keyword match",
        note: result.message,
      });
    }
    setBusy(false);
  }

  return (
    <form
      aria-label="Find looks"
      className="mb-4 text-sm"
      onSubmit={(e) => {
        e.preventDefault();
        void search();
      }}
    >
      <label className="flex flex-col gap-1">
        Find looks for an occasion
        <span className="flex gap-2">
          <input value={query} onChange={(e) => setQuery(e.target.value)} className="flex-1 rounded border px-2 py-1" />
          <button type="submit" disabled={busy} className="rounded bg-stone-900 px-3 py-1 text-white">
            Search
          </button>
        </span>
      </label>
      {outcome && (
        <div className="mt-2 rounded bg-stone-50 p-2">
          <p className="text-xs text-stone-600">
            {outcome.method}
            {outcome.note ? ` · ${outcome.note}` : ""}
          </p>
          {outcome.matches.length === 0 ? (
            <p>No saved look is close enough. Try other words, or assemble a new look.</p>
          ) : (
            <ol aria-label="Matching looks" className="list-decimal pl-5">
              {outcome.matches.map((m) => (
                <li key={m.lookId}>
                  {closet.looks.find((l) => l.id === m.lookId)?.title} · {m.score.toFixed(2)}
                </li>
              ))}
            </ol>
          )}
        </div>
      )}
    </form>
  );
}
