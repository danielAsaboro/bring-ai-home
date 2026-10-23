"use client";

import { useState, useSyncExternalStore, type FormEvent } from "react";

import {
  ASSET_CATEGORIES,
  completeTask,
  dueState,
  fileDocument,
  historyFor,
  recordProject,
  registerAsset,
  type AssetCategory,
  type Binder,
  type DocumentKind,
} from "./binder";
import { browserStore, type BinderStore } from "./storage";

const noopSubscribe = () => () => undefined;

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

export function Homebook({ store, today }: { store?: BinderStore; today?: string }) {
  const mounted = useSyncExternalStore(noopSubscribe, () => true, () => false);
  if (!mounted) return <p className="p-6">Opening the binder…</p>;
  return <BinderView store={store ?? browserStore()} today={today ?? todayIso()} />;
}

const field = "rounded border border-stone-400 bg-white px-2 py-1 text-sm";
const button = "rounded bg-emerald-800 px-3 py-1 text-sm font-medium text-white hover:bg-emerald-900";

function BinderView({ store, today }: { store: BinderStore; today: string }) {
  const [binder, setBinder] = useState<Binder>(() => store.load());
  const [roomId, setRoomId] = useState<string>("all");
  const [selectedId, setSelectedId] = useState<string | null>(binder.assets[0]?.id ?? null);
  const [error, setError] = useState<string | null>(null);

  function commit(next: Binder) {
    setBinder(next);
    store.save(next);
    setError(null);
  }

  function attempt(change: () => Binder) {
    try {
      commit(change());
    } catch (e) {
      setError((e as Error).message);
    }
  }

  const assets = binder.assets.filter((a) => roomId === "all" || a.roomId === roomId);
  const selected = binder.assets.find((a) => a.id === selectedId) ?? null;
  const roomName = (id: string) => binder.rooms.find((r) => r.id === id)?.name ?? id;

  function onRegister(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const text = (k: string) => String(form.get(k) ?? "");
    const id = `asset-${binder.assets.length + 1}-${Date.now().toString(36)}`;
    attempt(() =>
      registerAsset(
        binder,
        {
          name: text("name"),
          roomId: text("roomId"),
          category: text("category") as AssetCategory,
          brand: text("brand"),
          model: text("model"),
          serial: text("serial"),
          installedOn: text("installedOn"),
          notes: "",
        },
        id,
      ),
    );
    if (text("name").trim()) {
      setSelectedId(id);
      event.currentTarget.reset();
    }
  }

  function onFile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    attempt(() =>
      fileDocument(binder, {
        assetId: selected.id,
        kind: String(form.get("kind")) as DocumentKind,
        title: String(form.get("title") ?? ""),
        file: null,
        expiresOn: String(form.get("expiresOn") ?? "") || null,
      }),
    );
    event.currentTarget.reset();
  }

  function onProject(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    attempt(() =>
      recordProject(binder, {
        roomId: roomId === "all" ? binder.rooms[0].id : roomId,
        title: String(form.get("title") ?? ""),
        before: String(form.get("before") ?? ""),
        after: String(form.get("after") ?? ""),
        finishedOn: null,
      }),
    );
    event.currentTarget.reset();
  }

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 text-stone-900 sm:p-6">
      <header className="flex flex-wrap items-end justify-between gap-3 border-b-4 border-double border-stone-500 pb-3">
        <div>
          <h1 className="font-serif text-3xl">Homebook</h1>
          <p className="text-sm text-stone-600">{binder.home}</p>
        </div>
        <button type="button" className="rounded border border-stone-500 px-3 py-1 text-sm" onClick={() => commit(store.reset())}>
          Reset demo data
        </button>
      </header>

      {error ? (
        <p role="alert" className="rounded bg-red-100 px-3 py-2 text-sm text-red-900">
          {error}
        </p>
      ) : null}

      <nav aria-label="Rooms" className="flex flex-wrap gap-1">
        {[{ id: "all", name: "Whole home" }, ...binder.rooms].map((room) => (
          <button
            key={room.id}
            type="button"
            aria-pressed={roomId === room.id}
            onClick={() => setRoomId(room.id)}
            className={`rounded-t border border-b-0 px-3 py-1 text-sm ${roomId === room.id ? "bg-amber-100 font-semibold" : "bg-stone-100"}`}
          >
            {room.name}
          </button>
        ))}
      </nav>

      <div className="grid gap-6 md:grid-cols-[16rem_1fr]">
        <section aria-labelledby="register-heading" className="space-y-3">
          <h2 id="register-heading" className="font-serif text-xl">Asset register</h2>
          <ul className="space-y-2">
            {assets.map((asset) => (
              <li key={asset.id}>
                <button
                  type="button"
                  onClick={() => setSelectedId(asset.id)}
                  aria-current={asset.id === selectedId}
                  className={`w-full rounded border px-3 py-2 text-left ${asset.id === selectedId ? "border-emerald-800 bg-emerald-50" : "border-stone-300"}`}
                >
                  <span className="block font-medium">{asset.name}</span>
                  <span className="text-xs text-stone-600">{roomName(asset.roomId)}</span>
                </button>
              </li>
            ))}
            {assets.length === 0 ? <li className="text-sm text-stone-600">No assets in this room yet.</li> : null}
          </ul>

          <form onSubmit={onRegister} aria-label="Register an asset" className="space-y-2 rounded border border-dashed border-stone-400 p-3">
            <h3 className="font-medium">Register an asset</h3>
            <input name="name" aria-label="Asset name" placeholder="Name" className={`${field} w-full`} />
            <select name="roomId" aria-label="Room" className={`${field} w-full`} defaultValue={roomId === "all" ? binder.rooms[0]?.id : roomId}>
              {binder.rooms.map((r) => (
                <option key={r.id} value={r.id}>{r.name}</option>
              ))}
            </select>
            <select name="category" aria-label="Category" className={`${field} w-full`} defaultValue="other">
              {ASSET_CATEGORIES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
            <input name="brand" aria-label="Brand" placeholder="Brand" className={`${field} w-full`} />
            <input name="model" aria-label="Model" placeholder="Model" className={`${field} w-full`} />
            <input name="serial" aria-label="Serial" placeholder="Serial" className={`${field} w-full`} />
            <input name="installedOn" aria-label="Installed on" type="date" className={`${field} w-full`} />
            <button type="submit" className={button}>Register</button>
          </form>
        </section>

        {selected ? (
          <section aria-label={`${selected.name} record`} className="space-y-4">
            <div className="rounded border-2 border-stone-700 bg-stone-50 p-4 font-mono text-sm">
              <h2 className="mb-2 font-serif text-2xl">{selected.name}</h2>
              <dl className="grid grid-cols-[7rem_1fr] gap-x-3 gap-y-1">
                <dt>Room</dt><dd>{roomName(selected.roomId)}</dd>
                <dt>Category</dt><dd>{selected.category}</dd>
                <dt>Brand</dt><dd>{selected.brand || "—"}</dd>
                <dt>Model</dt><dd>{selected.model || "—"}</dd>
                <dt>Serial</dt><dd>{selected.serial || "—"}</dd>
                <dt>Installed</dt><dd>{selected.installedOn || "—"}</dd>
              </dl>
              {selected.notes ? <p className="mt-2 font-sans">{selected.notes}</p> : null}
            </div>

            <div>
              <h3 className="font-serif text-lg">Maintenance schedule</h3>
              <ul className="divide-y">
                {binder.tasks.filter((t) => t.assetId === selected.id).map((task) => {
                  const state = dueState(task, today);
                  return (
                    <li key={task.id} className="flex flex-wrap items-center justify-between gap-2 py-2">
                      <span>
                        {task.title} <span className="text-xs text-stone-600">every {task.everyMonths} mo · due {task.nextDue}</span>{" "}
                        <span className={`rounded px-1 text-xs ${state === "overdue" ? "bg-red-200" : state === "due-soon" ? "bg-amber-200" : "bg-stone-200"}`}>{state}</span>
                      </span>
                      <button type="button" className={button} onClick={() => attempt(() => completeTask(binder, task.id, today, ""))}>
                        Stamp done: {task.title}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <h3 className="font-serif text-lg">Service history</h3>
              <ol aria-label="Service history" className="space-y-1 text-sm">
                {historyFor(binder, selected.id).map((r) => (
                  <li key={r.id}><time className="font-mono">{r.date}</time> · {r.summary}</li>
                ))}
              </ol>
            </div>

            <div>
              <h3 className="font-serif text-lg">Filed documents</h3>
              <ul aria-label="Filed documents" className="space-y-1 text-sm">
                {binder.documents.filter((d) => d.assetId === selected.id).map((d) => (
                  <li key={d.id}>
                    <span className="rounded bg-stone-200 px-1 text-xs uppercase">{d.kind}</span> {d.title}
                    {d.expiresOn ? <span className="text-stone-600"> · expires {d.expiresOn}</span> : null}
                  </li>
                ))}
              </ul>
              <form onSubmit={onFile} aria-label="File a document" className="mt-2 flex flex-wrap gap-2">
                <select name="kind" aria-label="Document kind" className={field} defaultValue="manual">
                  <option value="manual">manual</option>
                  <option value="receipt">receipt</option>
                  <option value="warranty">warranty</option>
                </select>
                <input name="title" aria-label="Document title" placeholder="Title" className={field} />
                <input name="expiresOn" aria-label="Expires on" type="date" className={field} />
                <button type="submit" className={button}>File</button>
              </form>
            </div>
          </section>
        ) : (
          <p>Select or register an asset.</p>
        )}
      </div>

      <section aria-labelledby="projects-heading" className="space-y-2">
        <h2 id="projects-heading" className="font-serif text-xl">Before and after</h2>
        <ul className="grid gap-3 sm:grid-cols-2">
          {binder.projects.filter((p) => roomId === "all" || p.roomId === roomId).map((p) => (
            <li key={p.id} className="rounded border border-stone-300 p-3 text-sm">
              <p className="font-medium">{p.title} <span className="text-xs text-stone-600">· {roomName(p.roomId)} · {p.finishedOn ?? "in progress"}</span></p>
              <p><strong>Before:</strong> {p.before || "—"}</p>
              <p><strong>After:</strong> {p.after || "—"}</p>
            </li>
          ))}
        </ul>
        <form onSubmit={onProject} aria-label="Record a project" className="flex flex-wrap gap-2">
          <input name="title" aria-label="Project title" placeholder="Project" className={field} />
          <input name="before" aria-label="Before" placeholder="Before" className={field} />
          <input name="after" aria-label="After" placeholder="After" className={field} />
          <button type="submit" className={button}>Record project</button>
        </form>
      </section>
    </div>
  );
}
