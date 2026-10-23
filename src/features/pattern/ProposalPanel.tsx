"use client";

import { useState } from "react";

import type { Example } from "./patterns";
import { requestProposal, type ProposalResponse } from "./proposal-client";
import { describeRule, type Rule } from "./rules";

const button = "rounded border border-stone-400 px-2 py-1 text-sm hover:bg-stone-100 disabled:opacity-40";

export function ProposalPanel({
  examples,
  onApply,
  request = requestProposal,
}: {
  examples: Example[];
  onApply: (rules: Rule[], model: string) => void;
  request?: (examples: Example[]) => Promise<ProposalResponse>;
}) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<ProposalResponse | null>(null);

  return (
    <section aria-label="Proposal" className="space-y-2 rounded border border-dashed border-amber-400 p-3">
      <h3 className="font-semibold">Propose a weave from examples</h3>
      <p className="text-xs text-stone-600">Runs on this machine through the local QVAC service. A proposal never changes your weave until you apply it, and applying it saves your current weave first.</p>
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
      {result?.status === "ok" && result.check.ok && (
        <div className="space-y-2">
          <p className="text-sm">Proposed by {result.model}:</p>
          <ol aria-label="Proposed rules" className="list-decimal pl-5 text-sm">
            {result.check.rules.map((rule, i) => (
              <li key={i}>{describeRule(rule)}</li>
            ))}
          </ol>
          <div className="flex gap-2">
            <button
              className={button}
              onClick={() => {
                if (result.check.ok) onApply(result.check.rules, result.model);
                setResult(null);
              }}
            >
              Apply as new revision
            </button>
            <button className={button} onClick={() => setResult(null)}>Discard</button>
          </div>
        </div>
      )}
      {result?.status === "ok" && !result.check.ok && (
        <div role="status" className="text-sm text-rose-700">
          <p>The proposal was not readable as Pattern rules. Nothing was applied.</p>
          <ul className="list-disc pl-5">
            {result.check.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
          <details>
            <summary>Raw reply</summary>
            <pre className="overflow-x-auto bg-stone-100 p-2 text-xs">{result.raw}</pre>
          </details>
        </div>
      )}
      {result && result.status !== "ok" && <p role="status" className="text-sm text-rose-700">{result.message}</p>}
    </section>
  );
}
