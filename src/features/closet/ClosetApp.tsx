"use client";

import { useEffect, useMemo, useState } from "react";

import { createClosetStore } from "./closet-store";
import {
  addGarment,
  CATEGORIES,
  createLook,
  nextStates,
  packGarment,
  setGarmentState,
  setTripLimit,
  unpackGarment,
  updateGarment,
  type Category,
  type Closet,
  type Garment,
} from "./model";
import { sampleCloset } from "./sample-closet";

type Tab = "feed" | "garments" | "assemble" | "packing";
const TABS: { id: Tab; label: string }[] = [
  { id: "feed", label: "Feed" },
  { id: "garments", label: "Garments" },
  { id: "assemble", label: "Assemble" },
  { id: "packing", label: "Packing" },
];

const STATE_STYLE: Record<Garment["state"], string> = {
  clean: "bg-emerald-100 text-emerald-900",
  worn: "bg-amber-100 text-amber-900",
  washing: "bg-sky-100 text-sky-900",
  repair: "bg-rose-100 text-rose-900",
};

function browserStorage() {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export function ClosetApp() {
  const store = useMemo(() => createClosetStore(browserStorage()), []);
  const [closet, setCloset] = useState<Closet>(sampleCloset);
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState<Tab>("feed");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Read saved wardrobe after hydration so server and client markup match.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setCloset(store.load());
    setLoaded(true);
  }, [store]);

  useEffect(() => {
    if (loaded) store.save(closet);
  }, [closet, loaded, store]);

  // Run every change synchronously so domain errors surface in the UI.
  function act(change: (c: Closet) => Closet) {
    try {
      setCloset(change(closet));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const byId = new Map(closet.garments.map((g) => [g.id, g]));

  return (
    <div className="mx-auto max-w-3xl px-4 py-6 text-stone-900">
      <header className="mb-4 flex items-center justify-between gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Closet</h1>
        <button
          type="button"
          className="rounded border border-stone-300 px-3 py-1 text-sm"
          onClick={() => act(() => store.reset())}
        >
          Reset demo data
        </button>
      </header>

      <nav role="tablist" aria-label="Closet sections" className="mb-4 flex gap-1 overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={tab === t.id}
            onClick={() => setTab(t.id)}
            className={`rounded-full px-4 py-1 text-sm ${tab === t.id ? "bg-stone-900 text-white" : "bg-stone-100"}`}
          >
            {t.label}
          </button>
        ))}
      </nav>

      {error && (
        <p role="alert" className="mb-3 rounded bg-rose-50 px-3 py-2 text-sm text-rose-900">
          {error}
        </p>
      )}

      {tab === "feed" && <Feed closet={closet} byId={byId} />}
      {tab === "garments" && <Garments closet={closet} act={act} />}
      {tab === "assemble" && (
        <Assemble closet={closet} act={act} onDone={() => setTab("feed")} />
      )}
      {tab === "packing" && <Packing closet={closet} byId={byId} act={act} />}
    </div>
  );
}

function Thumb({ garment, size = 64 }: { garment: Garment; size?: number }) {
  return garment.image ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={garment.image} alt={garment.name} width={size} height={size} className="rounded bg-stone-100" />
  ) : (
    <span
      aria-label={garment.name}
      style={{ width: size, height: size }}
      className="flex items-center justify-center rounded bg-stone-200 text-xs"
    >
      {garment.category}
    </span>
  );
}

function Feed({ closet, byId }: { closet: Closet; byId: Map<string, Garment> }) {
  return (
    <section aria-label="Feed">
      <ul aria-label="Stories" className="mb-4 flex gap-3 overflow-x-auto pb-2">
        {(["worn", "washing", "repair"] as const).map((state) => {
          const count = closet.garments.filter((g) => g.state === state).length;
          return (
            <li key={state} className={`shrink-0 rounded-full px-3 py-1 text-sm ${STATE_STYLE[state]}`}>
              {count} {state}
            </li>
          );
        })}
      </ul>
      <ol aria-label="Outfit posts" className="space-y-4">
        {closet.looks.map((look) => (
          <li key={look.id} className="rounded-lg border border-stone-200 p-3">
            <h2 className="font-semibold">{look.title}</h2>
            <p className="text-sm text-stone-600">{look.occasion}</p>
            <div className="mt-2 flex flex-wrap gap-2">
              {look.garmentIds.map((id) => {
                const g = byId.get(id);
                return g ? <Thumb key={id} garment={g} /> : null;
              })}
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

const emptyDraft = { name: "", category: "top" as Category, colour: "", material: "", notes: "" };

function Garments({ closet, act }: { closet: Closet; act: (c: (c: Closet) => Closet) => void }) {
  const [draft, setDraft] = useState(emptyDraft);
  const [editing, setEditing] = useState<string | null>(null);

  return (
    <section aria-label="Garments">
      <form
        aria-label="Add garment"
        className="mb-4 grid grid-cols-2 gap-2 rounded-lg bg-stone-50 p-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          act((c) => addGarment(c, { ...draft, image: null }));
          setDraft(emptyDraft);
        }}
      >
        <label className="flex flex-col">
          Name
          <input value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col">
          Category
          <select
            value={draft.category}
            onChange={(e) => setDraft({ ...draft, category: e.target.value as Category })}
            className="rounded border px-2 py-1"
          >
            {CATEGORIES.map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </label>
        <label className="flex flex-col">
          Colour
          <input value={draft.colour} onChange={(e) => setDraft({ ...draft, colour: e.target.value })} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col">
          Material
          <input value={draft.material} onChange={(e) => setDraft({ ...draft, material: e.target.value })} className="rounded border px-2 py-1" />
        </label>
        <button type="submit" className="col-span-2 rounded bg-stone-900 px-3 py-1 text-white">
          Add garment
        </button>
      </form>

      <ul aria-label="Catalogue" className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {closet.garments.map((g) => (
          <li key={g.id} className="flex gap-3 rounded-lg border border-stone-200 p-2">
            <Thumb garment={g} />
            <div className="min-w-0 flex-1 text-sm">
              {editing === g.id ? (
                <input
                  aria-label={`Rename ${g.name}`}
                  defaultValue={g.name}
                  autoFocus
                  onBlur={(e) => {
                    act((c) => updateGarment(c, g.id, { name: e.target.value }));
                    setEditing(null);
                  }}
                  className="w-full rounded border px-1"
                />
              ) : (
                <button type="button" className="font-semibold" onClick={() => setEditing(g.id)}>
                  {g.name}
                </button>
              )}
              <p className="text-stone-600">
                {g.category} · {g.colour} · {g.material}
              </p>
              <p className="mt-1 flex flex-wrap items-center gap-1">
                <span className={`rounded px-2 ${STATE_STYLE[g.state]}`}>{g.state}</span>
                {nextStates(g.state).map((s) => (
                  <button
                    key={s}
                    type="button"
                    aria-label={`Mark ${g.name} ${s}`}
                    onClick={() => act((c) => setGarmentState(c, g.id, s))}
                    className="rounded border border-stone-300 px-2"
                  >
                    {s}
                  </button>
                ))}
              </p>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

function Assemble({
  closet,
  act,
  onDone,
}: {
  closet: Closet;
  act: (c: (c: Closet) => Closet) => void;
  onDone: () => void;
}) {
  const [title, setTitle] = useState("");
  const [occasion, setOccasion] = useState("");
  const [picked, setPicked] = useState<string[]>([]);

  return (
    <section aria-label="Assemble a look">
      <form
        className="space-y-3 text-sm"
        onSubmit={(e) => {
          e.preventDefault();
          let ok = false;
          act((c) => {
            const next = createLook(c, { title, occasion, garmentIds: picked });
            ok = true;
            return next;
          });
          if (ok) onDone();
        }}
      >
        <label className="flex flex-col">
          Look title
          <input value={title} onChange={(e) => setTitle(e.target.value)} className="rounded border px-2 py-1" />
        </label>
        <label className="flex flex-col">
          Occasion
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} className="rounded border px-2 py-1" />
        </label>
        <fieldset className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <legend className="mb-1">Garments</legend>
          {closet.garments.map((g) => (
            <label key={g.id} className="flex items-center gap-2 rounded border border-stone-200 p-1">
              <input
                type="checkbox"
                checked={picked.includes(g.id)}
                onChange={(e) =>
                  setPicked((p) => (e.target.checked ? [...p, g.id] : p.filter((x) => x !== g.id)))
                }
              />
              {g.name}
            </label>
          ))}
        </fieldset>
        <button type="submit" className="rounded bg-stone-900 px-3 py-1 text-white">
          Post look
        </button>
      </form>
    </section>
  );
}

function Packing({
  closet,
  byId,
  act,
}: {
  closet: Closet;
  byId: Map<string, Garment>;
  act: (c: (c: Closet) => Closet) => void;
}) {
  const packed = closet.trip.garmentIds.map((id) => byId.get(id)).filter((g): g is Garment => !!g);
  const available = closet.garments.filter((g) => g.state === "clean" && !closet.trip.garmentIds.includes(g.id));
  return (
    <section aria-label="Packing" className="text-sm">
      <h2 className="font-semibold">
        {closet.trip.name} · {packed.length}/{closet.trip.limit} packed
      </h2>
      <label className="my-2 flex items-center gap-2">
        Packing limit
        <input
          type="number"
          min={1}
          max={30}
          value={closet.trip.limit}
          onChange={(e) => act((c) => setTripLimit(c, Number(e.target.value)))}
          className="w-16 rounded border px-1"
        />
      </label>
      <ul aria-label="Packing carousel" className="mb-4 flex snap-x gap-3 overflow-x-auto pb-2">
        {packed.map((g) => (
          <li key={g.id} className="flex shrink-0 snap-start flex-col items-center gap-1">
            <Thumb garment={g} size={96} />
            <button type="button" aria-label={`Unpack ${g.name}`} onClick={() => act((c) => unpackGarment(c, g.id))} className="underline">
              Unpack
            </button>
          </li>
        ))}
      </ul>
      <h3 className="font-semibold">Clean and ready</h3>
      <ul className="mt-1 flex flex-wrap gap-2">
        {available.map((g) => (
          <li key={g.id}>
            <button type="button" aria-label={`Pack ${g.name}`} onClick={() => act((c) => packGarment(c, g.id))} className="rounded border border-stone-300 px-2 py-1">
              + {g.name}
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
