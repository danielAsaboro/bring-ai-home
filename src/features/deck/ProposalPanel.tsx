"use client";

import { useState } from "react";

import { AssistError, type AssistClient } from "./assist-client";
import { sourceLabel, type ClaimProposal } from "./claim-proposals";
import type { Deck } from "./deck";

const field = "rounded border border-slate-400 bg-white px-2 py-1 text-sm text-slate-900";
const button = "rounded bg-indigo-800 px-3 py-1 text-sm font-medium text-white hover:bg-indigo-900 disabled:opacity-50";
const ghost = "rounded border border-slate-400 px-2 py-0.5 text-xs hover:bg-slate-100";

export type AcceptedClaim = { title: string; body: string; source: string; roundId: string };

// The model proposes, the app has already validated citations, and only the
// Accept button adds a card.
export function ProposalPanel({ deck, client, onAccept }: { deck: Deck; client: AssistClient; onAccept: (card: AcceptedClaim) => void }) {
  const [topic, setTopic] = useState("");
  const [roundId, setRoundId] = useState(deck.rounds[0]?.id ?? "");
  const [proposals, setProposals] = useState<ClaimProposal[]>([]);
  const [dropped, setDropped] = useState<{ title: string; reason: string }[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const targetRound = deck.rounds.some((r) => r.id === roundId) ? roundId : deck.rounds[0]?.id;

  async function propose() {
    setBusy(true);
    setError(null);
    try {
      const result = await client.propose(topic, deck.audience);
      setProposals(result.proposals);
      setDropped(result.dropped);
      if (result.passages.length === 0) setError("No note section matched, so nothing was proposed.");
    } catch (e) {
      setError(e instanceof AssistError ? e.message : "Proposal failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section aria-label="Proposed claim cards" className="space-y-2 rounded-lg border border-slate-300 bg-white p-3">
      <h3 className="text-sm font-semibold">Propose cited claim cards</h3>
      <form
        className="flex flex-wrap gap-1"
        onSubmit={(e) => {
          e.preventDefault();
          if (topic.trim()) void propose();
        }}
      >
        <input className={`${field} min-w-0 flex-1`} aria-label="Card topic" placeholder="What should this round argue?" value={topic} onChange={(e) => setTopic(e.target.value)} />
        <select className={field} aria-label="Target round" value={targetRound} onChange={(e) => setRoundId(e.target.value)}>
          {deck.rounds.map((r) => (
            <option key={r.id} value={r.id}>
              {r.title}
            </option>
          ))}
        </select>
        <button className={button} disabled={busy}>
          Propose cards
        </button>
      </form>
      {error && <p role="alert" className="text-sm text-red-800">{error}</p>}
      <ul className="space-y-2">
        {proposals.map((p) => (
          <li key={p.id} className="rounded border border-dashed border-indigo-400 p-2 text-sm">
            <p className="font-medium">{p.title}</p>
            <p>{p.body}</p>
            {p.citations.map((c) => (
              <blockquote key={c.id} className="mt-1 border-l-2 border-slate-300 pl-2 text-xs text-slate-600">
                <cite className="block not-italic">{c.noteTitle} · {c.section}</cite>
                {c.text}
              </blockquote>
            ))}
            <span className="mt-1 flex gap-1">
              <button
                className={ghost}
                onClick={() => {
                  onAccept({ title: p.title, body: p.body, source: sourceLabel(p), roundId: targetRound });
                  setProposals((list) => list.filter((x) => x.id !== p.id));
                }}
              >
                Accept {p.title}
              </button>
              <button className={ghost} onClick={() => setProposals((list) => list.filter((x) => x.id !== p.id))}>
                Reject {p.title}
              </button>
            </span>
          </li>
        ))}
      </ul>
      {dropped.length > 0 && (
        <details className="text-xs text-slate-600">
          <summary>{dropped.length} proposal(s) removed by the app</summary>
          <ul>
            {dropped.map((d, i) => (
              <li key={i}>
                {d.title}: {d.reason}
              </li>
            ))}
          </ul>
        </details>
      )}
    </section>
  );
}
