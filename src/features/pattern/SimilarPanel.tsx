"use client";

import { useState } from "react";

import type { Pattern } from "./patterns";
import { requestEmbeddings, type EmbedResponse } from "./proposal-client";
import { patternText, rankSimilar, type Match } from "./similar";

const button = "rounded border border-stone-400 px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-40";

export function SimilarPanel({
  patterns,
  targetId,
  onOpen,
  embed = requestEmbeddings,
}: {
  patterns: Pattern[];
  targetId: string;
  onOpen: (id: string) => void;
  embed?: (texts: string[]) => Promise<EmbedResponse>;
}) {
  const [state, setState] = useState<{ for: string; matches: Match[]; model: string } | { for: string; message: string } | null>(null);
  const current = state?.for === targetId ? state : null;

  return (
    <section aria-label="Similar patterns" className="space-y-2">
      <h3 className="font-semibold">Similar saved patterns</h3>
      <button
        className={button}
        onClick={async () => {
          const result = await embed(patterns.map(patternText));
          if (result.status !== "ok") return setState({ for: targetId, message: result.message });
          const matches = rankSimilar(patterns, result.vectors, targetId, { limit: 3, minScore: 0.5 });
          setState({ for: targetId, matches, model: result.model });
        }}
      >
        Find similar patterns
      </button>
      {current && "message" in current && <p role="status" className="text-sm text-rose-700">{current.message}</p>}
      {current && "matches" in current && (
        <ul aria-label="Similar matches" className="text-sm">
          {current.matches.length === 0 && <li>No saved pattern is close enough.</li>}
          {current.matches.map((m) => (
            <li key={m.id}>
              <button className="underline" onClick={() => onOpen(m.id)}>{m.name}</button> · {m.score.toFixed(2)} ({current.model})
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
