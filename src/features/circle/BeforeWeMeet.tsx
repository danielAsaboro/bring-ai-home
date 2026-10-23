"use client";

import { useState } from "react";

import { passagesFor, type ContextMatch } from "./context";
import type { ServiceClient } from "./service-client";
import { openReminders } from "./state";
import type { CircleState, Person } from "./types";

export function BeforeWeMeet({
  person,
  state,
  client,
}: {
  person: Person;
  state: CircleState;
  client: Pick<ServiceClient, "retrieve">;
}) {
  const [query, setQuery] = useState("");
  const [matches, setMatches] = useState<ContextMatch[] | null>(null);
  const [model, setModel] = useState("");
  const [error, setError] = useState<string | null>(null);
  const promises = openReminders(state, person.id);

  return (
    <section aria-label="Before we meet" className="my-3 rounded bg-stone-50 p-3 text-sm">
      <h3 className="font-serif text-lg">Before we meet</h3>
      {/* Deterministic: open reminders always show, no model needed. */}
      <ul>
        {promises.map((r) => (
          <li key={r.id}>
            Still open: {r.text} ({r.due})
          </li>
        ))}
      </ul>
      <form
        className="mt-2 flex gap-2"
        onSubmit={async (e) => {
          e.preventDefault();
          setError(null);
          try {
            const result = await client.retrieve(query, passagesFor(person, state.reminders));
            setMatches(result.matches);
            setModel(result.model);
          } catch (err) {
            setMatches(null);
            setError(err instanceof Error ? err.message : String(err));
          }
        }}
      >
        <input
          aria-label="What is the meeting about?"
          className="flex-1 rounded border p-1"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="rounded border px-2" disabled={!query.trim()}>
          Gather context
        </button>
      </form>
      {error && <p role="alert">{error}</p>}
      {matches && (
        <ol aria-label="Relevant context" className="mt-2 list-decimal pl-5">
          {matches.length === 0 && <li>Nothing close enough in what you have saved.</li>}
          {matches.map((m) => (
            <li key={m.id}>
              {m.text} <span className="text-stone-500">({m.score} · {model})</span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}
