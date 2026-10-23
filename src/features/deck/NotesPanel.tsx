"use client";

import { useState } from "react";

import { AssistError, type AssistClient, type RetrieveResult } from "./assist-client";

const field = "rounded border border-slate-400 bg-white px-2 py-1 text-sm text-slate-900";
const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50";

// Read-only: shows which private note sections match. Nothing here edits a deck.
export function NotesPanel({ client }: { client: AssistClient }) {
  const [query, setQuery] = useState("");
  const [result, setResult] = useState<RetrieveResult | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function search() {
    setBusy(true);
    setError(null);
    try {
      setResult(await client.retrieve(query));
    } catch (e) {
      setResult(null);
      setError(e instanceof AssistError ? e.message : "Search failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Local assistant" className="space-y-2 rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Local assistant · your notes</h3>
      <form
        className="flex gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (query.trim()) void search();
        }}
      >
        <input className={`${field} min-w-0 flex-1`} aria-label="Search notes" placeholder="What do the notes say about…" value={query} onChange={(e) => setQuery(e.target.value)} />
        <button className={button} disabled={busy}>
          Search notes
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      {result && result.passages.length === 0 && <p className="text-sm">No note section matched closely enough.</p>}
      {result && (
        <ul className="space-y-2">
          {result.passages.map((p) => (
            <li key={p.id} className="rounded bg-slate-50 p-2 text-sm">
              <cite className="block text-xs not-italic text-slate-500">
                {p.noteTitle} · {p.section} · score {p.score.toFixed(2)}
              </cite>
              {p.text}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
