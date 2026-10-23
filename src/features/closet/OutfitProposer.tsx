"use client";

import { useState } from "react";

import { packGarment, type Closet } from "./model";
import { buildOutfitConstraints, validateOutfitProposal, type OutfitProposal } from "./outfit-proposal";
import { proposeOutfit } from "./service-client";

type Pending = OutfitProposal & { model: string; picked: string[] };

// The model proposes a carousel; the person ticks what to pack; the domain
// rules in packGarment still have the final say.
export function OutfitProposer({ closet, act }: { closet: Closet; act: (c: (c: Closet) => Closet) => void }) {
  const [occasion, setOccasion] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [pending, setPending] = useState<Pending | null>(null);
  const name = (id: string) => closet.garments.find((g) => g.id === id)?.name ?? id;

  async function propose() {
    setPending(null);
    const constraints = buildOutfitConstraints(closet, occasion);
    if (!constraints.occasion) return setStatus("Describe the occasion first.");
    if (constraints.maxItems === 0) return setStatus("The carousel is already full.");
    if (constraints.candidates.length === 0) return setStatus("No clean garments are left to pack.");
    setStatus("Asking the local model…");
    const result = await proposeOutfit(constraints);
    if (!result.ok) return setStatus(`${result.message} Pack by hand below.`);
    const proposal = validateOutfitProposal(result.value.raw, constraints);
    setPending({ ...proposal, model: result.value.model, picked: proposal.garmentIds });
    setStatus(null);
  }

  return (
    <div className="mb-4 rounded-lg border border-dashed border-stone-300 p-3">
      <form
        aria-label="Propose a carousel"
        onSubmit={(e) => {
          e.preventDefault();
          void propose();
        }}
        className="flex flex-wrap items-end gap-2"
      >
        <label className="flex flex-1 flex-col">
          Occasion to pack for
          <input value={occasion} onChange={(e) => setOccasion(e.target.value)} className="rounded border px-2 py-1" />
        </label>
        <button type="submit" className="rounded bg-stone-900 px-3 py-1 text-white">
          Propose outfit
        </button>
      </form>
      {status && <p role="status" className="mt-2 text-stone-600">{status}</p>}
      {pending && (
        <div role="group" aria-label="Proposed outfit" className="mt-3 space-y-2 rounded bg-amber-50 p-3">
          <p className="text-xs uppercase tracking-wide text-amber-900">Proposal · {pending.model} · local</p>
          {pending.reason && <p>{pending.reason}</p>}
          <ul>
            {pending.garmentIds.map((id) => (
              <li key={id}>
                <label className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    checked={pending.picked.includes(id)}
                    onChange={(e) =>
                      setPending({
                        ...pending,
                        picked: e.target.checked ? [...pending.picked, id] : pending.picked.filter((p) => p !== id),
                      })
                    }
                  />
                  {name(id)}
                </label>
              </li>
            ))}
          </ul>
          {[...pending.issues, ...pending.rejected.map((r) => `Left out ${name(r.id)}: ${r.why}.`)].map((line) => (
            <p key={line} className="text-amber-900">
              {line}
            </p>
          ))}
          <div className="flex gap-2">
            <button
              type="button"
              disabled={pending.picked.length === 0}
              className="rounded bg-stone-900 px-3 py-1 text-white disabled:opacity-50"
              onClick={() => {
                act((c) => pending.picked.reduce((next, id) => packGarment(next, id), c));
                setPending(null);
              }}
            >
              Pack selected
            </button>
            <button type="button" className="rounded border px-3 py-1" onClick={() => setPending(null)}>
              Discard
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
