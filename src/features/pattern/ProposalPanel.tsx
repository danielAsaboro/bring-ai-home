"use client";

import { useState } from "react";

import type { Example } from "./patterns";
import { requestProposal, type ProposalResponse } from "./proposal-client";

const button = "rounded border border-stone-400 px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-40";

export function ProposalPanel({
  examples,
  request = requestProposal,
}: {
  examples: Example[];
  request?: (examples: Example[]) => Promise<ProposalResponse>;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProposalResponse | null>(null);

  return (
    <section aria-label="Proposal" className="space-y-2 rounded border border-dashed border-amber-400 p-3">
      <h3 className="font-semibold">Propose a weave from examples</h3>
      <p className="text-xs text-stone-600">Runs on this machine through the local QVAC service. A proposal never changes your weave by itself.</p>
      <button
        className={button}
        disabled={busy || examples.length === 0}
        onClick={async () => {
          setBusy(true);
          setResult(await request(examples));
          setBusy(false);
        }}
      >
        {busy ? "Proposing…" : "Propose rules"}
      </button>
      {result?.status === "ok" && (
        <div>
          <p className="text-sm">Raw proposal from {result.model} (not applied):</p>
          <pre aria-label="Raw proposal" className="overflow-x-auto bg-stone-100 p-2 text-xs">{result.raw}</pre>
        </div>
      )}
      {result && result.status !== "ok" && <p role="status" className="text-sm text-rose-700">{result.message}</p>}
    </section>
  );
}
