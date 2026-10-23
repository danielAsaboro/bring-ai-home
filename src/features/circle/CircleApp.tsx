"use client";

import { useMemo, useState, useSyncExternalStore } from "react";

import {
  addReminder,
  completeReminder,
  letterOf,
  logEntry,
  openReminders,
  peopleByLetter,
  toggleCircle,
} from "./state";
import { RecapPanel } from "./RecapPanel";
import { createServiceClient, type ServiceClient } from "./service-client";
import { browserStore, type CircleStore } from "./storage";
import type { CircleState, EntryKind, Person } from "./types";

const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const noopSubscribe = () => () => {};

export function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function CircleApp({
  store: injected,
  client: injectedClient,
}: {
  store?: CircleStore;
  client?: ServiceClient;
}) {
  const store = useMemo(() => injected ?? browserStore(), [injected]);
  const client = useMemo(() => injectedClient ?? createServiceClient(), [injectedClient]);
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  const loaded = useMemo(() => (mounted ? store.load() : null), [mounted, store]);
  const [edited, setEdited] = useState<CircleState | null>(null);
  const [letter, setLetter] = useState("A");
  const [personId, setPersonId] = useState<string | null>(null);
  const state = edited ?? loaded;

  function commit(next: CircleState) {
    store.save(next);
    setEdited(next);
  }

  if (!state) {
    return (
      <main className="mx-auto max-w-5xl p-6">
        <h1 className="font-serif text-4xl">Circle</h1>
        <p>Opening your book…</p>
      </main>
    );
  }

  const inLetter = peopleByLetter(state.people, letter);
  const person = state.people.find((p) => p.id === personId) ?? inLetter[0] ?? null;

  return (
    <main className="mx-auto max-w-5xl p-4 sm:p-6 text-stone-800">
      <header className="flex flex-wrap items-baseline justify-between gap-2 border-b border-amber-200 pb-3">
        <div>
          <h1 className="font-serif text-4xl">Circle</h1>
          <p className="text-stone-600">A warm phonebook for the people you keep close.</p>
        </div>
        <button
          type="button"
          className="rounded border border-stone-300 px-3 py-1 text-sm"
          onClick={() => {
            setEdited(store.reset());
            setPersonId(null);
          }}
        >
          Reset demo data
        </button>
      </header>

      <RecapPanel state={state} onChange={commit} client={client} today={today()} />

      <nav aria-label="Alphabet" role="tablist" className="my-4 flex flex-wrap gap-1">
        {LETTERS.map((l) => {
          const count = state.people.filter((p) => letterOf(p.name) === l).length;
          return (
            <button
              key={l}
              type="button"
              role="tab"
              aria-selected={l === letter}
              disabled={count === 0}
              onClick={() => {
                setLetter(l);
                setPersonId(null);
              }}
              className={`h-8 w-8 rounded-t font-serif ${
                l === letter ? "bg-amber-200" : "bg-amber-50"
              } disabled:opacity-30`}
            >
              {l}
            </button>
          );
        })}
      </nav>

      <div className="grid gap-4 md:grid-cols-[14rem_1fr_16rem]">
        <ul aria-label="People" className="space-y-1">
          {inLetter.map((p) => (
            <li key={p.id}>
              <button
                type="button"
                onClick={() => setPersonId(p.id)}
                aria-current={person?.id === p.id}
                className={`w-full rounded px-2 py-1 text-left ${
                  person?.id === p.id ? "bg-amber-100" : ""
                }`}
              >
                {p.name}
              </button>
            </li>
          ))}
        </ul>

        {person ? (
          <PersonCard
            key={person.id}
            person={person}
            state={state}
            onChange={commit}
          />
        ) : (
          <p>No one under {letter} yet.</p>
        )}

        <aside aria-label="Gentle reminders" className="space-y-2">
          <h2 className="font-serif text-xl">Gentle reminders</h2>
          {openReminders(state).length === 0 && <p>Nothing waiting.</p>}
          <ul className="space-y-2">
            {openReminders(state).map((r) => {
              const who = state.people.find((p) => p.id === r.personId);
              return (
                <li key={r.id} className="rounded bg-amber-50 p-2 text-sm">
                  <p>
                    <strong>{r.due}</strong> · {who?.name}
                  </p>
                  <p>{r.text}</p>
                  <button
                    type="button"
                    className="underline"
                    onClick={() => commit(completeReminder(state, r.id))}
                  >
                    Done: {r.text}
                  </button>
                </li>
              );
            })}
          </ul>
          <h2 className="font-serif text-xl">Circles</h2>
          <ul className="text-sm">
            {state.circles.map((c) => (
              <li key={c}>
                {c}: {state.people.filter((p) => p.circles.includes(c)).length}
              </li>
            ))}
          </ul>
        </aside>
      </div>
    </main>
  );
}

function PersonCard({
  person,
  state,
  onChange,
}: {
  person: Person;
  state: CircleState;
  onChange: (next: CircleState) => void;
}) {
  const [kind, setKind] = useState<EntryKind>("interaction");
  const [date, setDate] = useState(today());
  const [text, setText] = useState("");
  const [reminderText, setReminderText] = useState("");
  const [reminderDue, setReminderDue] = useState(today());
  const [error, setError] = useState<string | null>(null);

  function attempt(update: () => CircleState, reset: () => void) {
    try {
      onChange(update());
      reset();
      setError(null);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  return (
    <article
      aria-label={`${person.name} card`}
      className="rounded-lg border border-amber-200 bg-white p-4 shadow-sm"
    >
      <h2 className="font-serif text-2xl">{person.name}</h2>
      <p className="text-stone-600">{person.note}</p>

      <fieldset className="my-2 flex flex-wrap gap-2 text-sm">
        <legend className="sr-only">Circles</legend>
        {state.circles.map((c) => (
          <label key={c} className="flex items-center gap-1">
            <input
              type="checkbox"
              checked={person.circles.includes(c)}
              onChange={() => onChange(toggleCircle(state, person.id, c))}
            />
            {c}
          </label>
        ))}
      </fieldset>

      <form
        aria-label="Log to timeline"
        className="my-3 space-y-2"
        onSubmit={(e) => {
          e.preventDefault();
          attempt(
            () => logEntry(state, person.id, { kind, date, text }),
            () => setText(""),
          );
        }}
      >
        <div className="flex gap-2">
          <select
            aria-label="Entry kind"
            value={kind}
            onChange={(e) => setKind(e.target.value as EntryKind)}
          >
            <option value="interaction">Interaction</option>
            <option value="memory">Memory</option>
          </select>
          <input
            aria-label="Entry date"
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
        <textarea
          aria-label="What happened"
          className="w-full rounded border p-2"
          value={text}
          onChange={(e) => setText(e.target.value)}
        />
        <button type="submit" className="rounded bg-amber-200 px-3 py-1">
          Save to timeline
        </button>
      </form>

      <form
        aria-label="Add reminder"
        className="my-3 flex flex-wrap gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          attempt(
            () =>
              addReminder(state, {
                personId: person.id,
                due: reminderDue,
                text: reminderText,
              }),
            () => setReminderText(""),
          );
        }}
      >
        <input
          aria-label="Reminder"
          className="flex-1 rounded border p-1"
          value={reminderText}
          onChange={(e) => setReminderText(e.target.value)}
        />
        <input
          aria-label="Reminder date"
          type="date"
          value={reminderDue}
          onChange={(e) => setReminderDue(e.target.value)}
        />
        <button type="submit" className="rounded border px-2">
          Remind me
        </button>
      </form>
      {error && <p role="alert">{error}</p>}

      <h3 className="font-serif text-lg">Timeline</h3>
      <ol aria-label="Timeline" className="space-y-1">
        {person.timeline.length === 0 && <li>No entries yet.</li>}
        {person.timeline.map((t) => (
          <li key={t.id} className="text-sm">
            <span className="text-stone-500">
              {t.date} · {t.kind}
            </span>{" "}
            {t.text}
          </li>
        ))}
      </ol>
    </article>
  );
}
