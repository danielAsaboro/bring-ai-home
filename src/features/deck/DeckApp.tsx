"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";

import {
  activeDeck,
  addCard,
  addRound,
  createDeck,
  formatSeconds,
  moveCard,
  moveRound,
  pacing,
  playOrder,
  removeCard,
  updateCard,
  type Card,
  type CardKind,
  type Deck,
  type Library,
  type Treatment,
} from "./deck";
import { createLocalStore, type LibraryStore } from "./storage";

const noopSubscribe = () => () => undefined;

export function DeckApp({ store }: { store?: LibraryStore }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <p className="p-6">Shuffling the deck…</p>;
  return <DeckView store={store ?? createLocalStore()} />;
}

const field = "rounded border border-slate-400 bg-white px-2 py-1 text-sm text-slate-900";
const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900";
const ghost = "rounded border border-slate-400 px-2 py-0.5 text-xs hover:bg-slate-100 disabled:opacity-40";

function DeckView({ store }: { store: LibraryStore }) {
  const [library, setLibrary] = useState<Library>(() => store.load());
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [presenting, setPresenting] = useState(false);
  const deck = activeDeck(library);
  const selected = deck.cards.find((c) => c.id === selectedId) ?? null;

  function commit(next: Library) {
    setLibrary(next);
    store.save(next);
  }

  if (presenting) return <Match deck={deck} onExit={() => setPresenting(false)} />;

  return (
    <div className="mx-auto grid max-w-6xl gap-6 p-4 md:grid-cols-[220px_1fr]">
      <aside className="space-y-4">
        <h1 className="text-2xl font-bold">Deck</h1>
        <nav aria-label="Decks">
          <ul className="space-y-1">
            {library.decks.map((d) => (
              <li key={d.id}>
                <button
                  className={`w-full rounded px-2 py-1 text-left text-sm ${d.id === deck.id ? "bg-indigo-100 font-semibold" : "hover:bg-slate-100"}`}
                  aria-current={d.id === deck.id ? "true" : undefined}
                  onClick={() => {
                    commit({ ...library, activeDeckId: d.id });
                    setSelectedId(null);
                  }}
                >
                  {d.title}
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <NewDeckForm onCreate={(title, audience) => commit(createDeck(library, title, audience))} />
        <button className={ghost} onClick={() => commit(store.reset())}>
          Reset demo data
        </button>
      </aside>

      <section className="space-y-4">
        <header className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-xl font-semibold">{deck.title}</h2>
            <p className="text-sm text-slate-600">Audience: {deck.audience || "not set"}</p>
          </div>
          <button className={button} onClick={() => setPresenting(true)} disabled={deck.cards.length === 0}>
            Play the match
          </button>
        </header>

        <PacingView deck={deck} />

        <div className="grid gap-3 lg:grid-cols-3">
          {deck.rounds.map((round, i) => (
            <section key={round.id} aria-label={`Round: ${round.title}`} className="rounded-lg border border-slate-300 bg-white p-3">
              <div className="mb-2 flex items-center justify-between gap-1">
                <h3 className="font-semibold">
                  Round {i + 1}: {round.title}
                </h3>
                <span className="flex gap-1">
                  <button className={ghost} aria-label={`Move ${round.title} earlier`} disabled={i === 0} onClick={() => commit(moveRound(library, deck.id, round.id, -1))}>
                    ←
                  </button>
                  <button className={ghost} aria-label={`Move ${round.title} later`} disabled={i === deck.rounds.length - 1} onClick={() => commit(moveRound(library, deck.id, round.id, 1))}>
                    →
                  </button>
                </span>
              </div>
              <ol className="space-y-2">
                {deck.cards
                  .filter((c) => c.roundId === round.id)
                  .map((card, j, roundCards) => (
                    <li key={card.id}>
                      <CardTile
                        card={card}
                        selected={card.id === selectedId}
                        onSelect={() => setSelectedId(card.id)}
                        onUp={j > 0 ? () => commit(moveCard(library, deck.id, card.id, -1)) : undefined}
                        onDown={j < roundCards.length - 1 ? () => commit(moveCard(library, deck.id, card.id, 1)) : undefined}
                      />
                    </li>
                  ))}
              </ol>
              <AddCardForm
                roundTitle={round.title}
                onAdd={(title, kind) =>
                  commit(addCard(library, deck.id, { kind, title, body: "", treatment: "headline", seconds: 30, roundId: round.id }))
                }
              />
            </section>
          ))}
        </div>
        <AddRoundForm onAdd={(title) => commit(addRound(library, deck.id, title))} />

        {selected && (
          <CardEditor
            key={selected.id}
            card={selected}
            deck={deck}
            onSave={(patch) => commit(updateCard(library, deck.id, selected.id, patch))}
            onRemove={() => {
              commit(removeCard(library, deck.id, selected.id));
              setSelectedId(null);
            }}
          />
        )}
      </section>
    </div>
  );
}

function CardTile({ card, selected, onSelect, onUp, onDown }: { card: Card; selected: boolean; onSelect: () => void; onUp?: () => void; onDown?: () => void }) {
  const tone = card.kind === "claim" ? "border-indigo-600" : "border-amber-600";
  return (
    <article className={`rounded border-l-4 ${tone} bg-slate-50 p-2 ${selected ? "ring-2 ring-indigo-400" : ""}`}>
      <button className="w-full text-left" onClick={onSelect}>
        <span className="text-xs uppercase tracking-wide text-slate-500">
          {card.kind} · {card.treatment} · {formatSeconds(card.seconds)}
        </span>
        <span className="block font-medium">{card.title}</span>
      </button>
      <span className="mt-1 flex gap-1">
        <button className={ghost} aria-label={`Move ${card.title} up`} disabled={!onUp} onClick={onUp}>
          ↑
        </button>
        <button className={ghost} aria-label={`Move ${card.title} down`} disabled={!onDown} onClick={onDown}>
          ↓
        </button>
      </span>
    </article>
  );
}

function CardEditor({ card, deck, onSave, onRemove }: { card: Card; deck: Deck; onSave: (patch: Partial<Card>) => void; onRemove: () => void }) {
  const [draft, setDraft] = useState(card);
  function submit(event: FormEvent) {
    event.preventDefault();
    onSave({ title: draft.title, body: draft.body, kind: draft.kind, treatment: draft.treatment, seconds: draft.seconds, roundId: draft.roundId, source: draft.source });
  }
  return (
    <form aria-label="Edit card" onSubmit={submit} className="grid gap-2 rounded-lg border border-slate-300 bg-white p-3 md:grid-cols-2">
      <label className="grid text-sm">
        Title
        <input className={field} value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} />
      </label>
      <label className="grid text-sm">
        Source
        <input className={field} value={draft.source ?? ""} onChange={(e) => setDraft({ ...draft, source: e.target.value || undefined })} />
      </label>
      <label className="grid text-sm md:col-span-2">
        Body
        <textarea className={field} rows={3} value={draft.body} onChange={(e) => setDraft({ ...draft, body: e.target.value })} />
      </label>
      <label className="grid text-sm">
        Kind
        <select className={field} value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as CardKind })}>
          <option value="claim">claim</option>
          <option value="evidence">evidence</option>
        </select>
      </label>
      <label className="grid text-sm">
        Treatment
        <select className={field} value={draft.treatment} onChange={(e) => setDraft({ ...draft, treatment: e.target.value as Treatment })}>
          <option value="headline">headline</option>
          <option value="quiet">quiet</option>
          <option value="data">data</option>
        </select>
      </label>
      <label className="grid text-sm">
        Seconds
        <input className={field} type="number" min={5} max={600} value={draft.seconds} onChange={(e) => setDraft({ ...draft, seconds: Number(e.target.value) })} />
      </label>
      <label className="grid text-sm">
        Round
        <select className={field} value={draft.roundId} onChange={(e) => setDraft({ ...draft, roundId: e.target.value })}>
          {deck.rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
      </label>
      <span className="flex gap-2 md:col-span-2">
        <button className={button} type="submit">
          Save card
        </button>
        <button className={ghost} type="button" onClick={onRemove}>
          Discard card
        </button>
      </span>
    </form>
  );
}

function PacingView({ deck }: { deck: Deck }) {
  const { total, rounds } = pacing(deck);
  return (
    <section aria-label="Pacing" className="rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Pacing · {formatSeconds(total)} total</h3>
      <ul className="mt-2 space-y-1">
        {rounds.map((r) => (
          <li key={r.roundId} className="grid grid-cols-[8rem_1fr_4rem] items-center gap-2 text-sm">
            <span className="truncate">{r.title}</span>
            <span className="h-2 rounded bg-slate-200">
              <span className="block h-2 rounded bg-indigo-600" style={{ width: `${Math.round(r.share * 100)}%` }} />
            </span>
            <span>{formatSeconds(r.seconds)}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Match({ deck, onExit }: { deck: Deck; onExit: () => void }) {
  const cards = playOrder(deck);
  const [index, setIndex] = useState(0);
  const card = cards[Math.min(index, cards.length - 1)];
  const round = deck.rounds.find((r) => r.id === card?.roundId);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key === "ArrowRight") setIndex((i) => Math.min(i + 1, cards.length - 1));
      if (event.key === "ArrowLeft") setIndex((i) => Math.max(i - 1, 0));
      if (event.key === "Escape") onExit();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [cards.length, onExit]);

  if (!card) return null;
  return (
    <section aria-label="Presentation" className="flex min-h-screen flex-col items-center justify-center gap-6 bg-slate-900 p-8 text-white">
      <p className="text-sm uppercase tracking-widest text-slate-400">
        {round?.title} · card {index + 1} of {cards.length}
      </p>
      <h2 className={card.treatment === "headline" ? "text-5xl font-bold" : "text-3xl"}>{card.title}</h2>
      <p className="max-w-2xl text-center text-xl text-slate-200">{card.body}</p>
      {card.source && <p className="text-sm text-slate-400">Source: {card.source}</p>}
      <div className="flex gap-3">
        <button className={button} onClick={() => setIndex((i) => Math.max(i - 1, 0))} disabled={index === 0}>
          Previous
        </button>
        <button className={button} onClick={() => setIndex((i) => Math.min(i + 1, cards.length - 1))} disabled={index >= cards.length - 1}>
          Next
        </button>
        <button className={button} onClick={onExit}>
          Leave the match
        </button>
      </div>
    </section>
  );
}

function NewDeckForm({ onCreate }: { onCreate: (title: string, audience: string) => void }) {
  const [title, setTitle] = useState("");
  const [audience, setAudience] = useState("");
  return (
    <form
      aria-label="New deck"
      className="grid gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        onCreate(title, audience);
        setTitle("");
        setAudience("");
      }}
    >
      <input className={field} placeholder="Deck title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <input className={field} placeholder="Audience" value={audience} onChange={(e) => setAudience(e.target.value)} />
      <button className={button}>New deck</button>
    </form>
  );
}

function AddCardForm({ roundTitle, onAdd }: { roundTitle: string; onAdd: (title: string, kind: CardKind) => void }) {
  const [title, setTitle] = useState("");
  const [kind, setKind] = useState<CardKind>("claim");
  return (
    <form
      aria-label={`Add card to ${roundTitle}`}
      className="mt-2 flex gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        if (!title.trim()) return;
        onAdd(title.trim(), kind);
        setTitle("");
      }}
    >
      <input className={`${field} min-w-0 flex-1`} placeholder="New card" value={title} onChange={(e) => setTitle(e.target.value)} />
      <select className={field} aria-label="Card kind" value={kind} onChange={(e) => setKind(e.target.value as CardKind)}>
        <option value="claim">claim</option>
        <option value="evidence">evidence</option>
      </select>
      <button className={ghost}>Add</button>
    </form>
  );
}

function AddRoundForm({ onAdd }: { onAdd: (title: string) => void }) {
  const [title, setTitle] = useState("");
  return (
    <form
      aria-label="Add round"
      className="flex gap-1"
      onSubmit={(e) => {
        e.preventDefault();
        onAdd(title);
        setTitle("");
      }}
    >
      <input className={field} placeholder="Round title" value={title} onChange={(e) => setTitle(e.target.value)} />
      <button className={ghost}>Add round</button>
    </form>
  );
}
