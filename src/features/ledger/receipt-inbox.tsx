"use client";

import { useState } from "react";

import { suggestedValues, type ReviewedValues } from "./book";
import { CATEGORIES, proposalInputFromDraft, type Category } from "./categories";
import { draftFromOcr, parseAmountCents, formatCents, type DraftTransaction, type Evidence } from "./draft-transactions";
import { createReceiptClient, type ReceiptClient } from "./receipt-client";
import type { ProposeResponse, SimilarResponse } from "./receipt-contract";
import { SAMPLE_BOOK } from "./sample-book";

const SAMPLE_URL = "/test-files/ledger/receipt-corner-cafe.png";

type ProposalStatus =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "error"; message: string }
  | { kind: "done"; response: ProposeResponse };

type SimilarStatus =
  | { kind: "idle" }
  | { kind: "working" }
  | { kind: "error"; message: string }
  | { kind: "done"; response: SimilarResponse };

type Status =
  | { kind: "idle" }
  | { kind: "reading" }
  | { kind: "error"; message: string }
  | { kind: "ready"; draft: DraftTransaction; ocrMs: number | null; blockCount: number };

function Source({ evidence }: { evidence: Evidence<unknown> | null }) {
  if (!evidence) return <span>not found</span>;
  const confidence = evidence.confidence === null ? "n/a" : evidence.confidence.toFixed(2);
  return (
    <small>
      from blocks {evidence.blockIndexes.join(", ")}: “{evidence.text}” · confidence {confidence}
    </small>
  );
}

export type ReviewDecision = {
  accept(draft: DraftTransaction, reviewed: ReviewedValues, proposal: { merchant: string; category: Category } | null): void;
  reject(draft: DraftTransaction): void;
  decided: string[];
};

function ReviewForm({
  draft,
  proposal,
  review,
}: {
  draft: DraftTransaction;
  proposal: { merchant: string; category: Category } | null;
  review: ReviewDecision;
}) {
  const start = suggestedValues(draft, proposal);
  const [date, setDate] = useState(start.date);
  const [merchant, setMerchant] = useState(start.merchant);
  const [category, setCategory] = useState<Category>(start.category);
  const [amount, setAmount] = useState(start.amountCents ? formatCents(start.amountCents) : "");
  const [problem, setProblem] = useState<string | null>(null);

  if (review.decided.includes(draft.id)) return <p role="status">This draft has been decided.</p>;

  return (
    <form
      aria-label="Review draft"
      onSubmit={(event) => {
        event.preventDefault();
        const amountCents = parseAmountCents(amount);
        if (amountCents === null) {
          setProblem("Enter the amount with two decimals, for example 10.53");
          return;
        }
        try {
          review.accept(draft, { date, merchant, category, amountCents }, proposal);
        } catch (error) {
          setProblem(error instanceof Error ? error.message : String(error));
        }
      }}
    >
      <label>
        Date <input value={date} onChange={(e) => setDate(e.target.value)} />
      </label>
      <label>
        Merchant <input value={merchant} onChange={(e) => setMerchant(e.target.value)} />
      </label>
      <label>
        Category
        <select value={category} onChange={(e) => setCategory(e.target.value as Category)}>
          {CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
      </label>
      <label>
        Amount <input value={amount} onChange={(e) => setAmount(e.target.value)} />
      </label>
      {problem && <p role="alert">{problem}</p>}
      <button type="submit">Accept into ledger</button>
      <button type="button" onClick={() => review.reject(draft)}>
        Reject draft
      </button>
    </form>
  );
}

export function ReceiptInbox({ client, review }: { client?: ReceiptClient; review?: ReviewDecision }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [proposal, setProposal] = useState<ProposalStatus>({ kind: "idle" });
  const [similar, setSimilar] = useState<SimilarStatus>({ kind: "idle" });
  const api = () => client ?? createReceiptClient();

  async function findSimilar(draft: DraftTransaction) {
    const proposed = proposal.kind === "done" && proposal.response.result.ok ? proposal.response.result.proposal : null;
    const text = proposed ? `${proposed.merchant} (${proposed.category})` : (draft.merchant?.value ?? "");
    setSimilar({ kind: "working" });
    try {
      setSimilar({ kind: "done", response: await api().similar({ text }) });
    } catch (error) {
      setSimilar({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  async function propose(draft: DraftTransaction) {
    setProposal({ kind: "working" });
    try {
      setProposal({ kind: "done", response: await api().propose(proposalInputFromDraft(draft)) });
    } catch (error) {
      setProposal({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  async function read(fileName: string, bytes: ArrayBuffer) {
    setStatus({ kind: "reading" });
    setProposal({ kind: "idle" });
    setSimilar({ kind: "idle" });
    try {
      const receiptId = `${Date.now()}`;
      const result = await api().readReceipt({ receiptId, fileName, pngBytes: bytes });
      setStatus({
        kind: "ready",
        draft: draftFromOcr({
          receiptId: result.receiptId,
          sourceDigest: result.sourceDigest,
          blocks: result.blocks,
        }),
        ocrMs: result.ocrMs,
        blockCount: result.blocks.length,
      });
    } catch (error) {
      setStatus({ kind: "error", message: error instanceof Error ? error.message : String(error) });
    }
  }

  async function readSample() {
    const response = await fetch(SAMPLE_URL);
    await read("receipt-corner-cafe.png", await response.arrayBuffer());
  }

  return (
    <section aria-labelledby="receipt-inbox">
      <h2 id="receipt-inbox">Receipt pocket</h2>
      <p>Receipts are read on this computer. Results are drafts and never change your balances.</p>
      <label>
        Receipt image (PNG)
        <input
          type="file"
          accept="image/png"
          onChange={async (event) => {
            const file = event.target.files?.[0];
            if (file) await read(file.name, await file.arrayBuffer());
          }}
        />
      </label>
      <button type="button" onClick={readSample} disabled={status.kind === "reading"}>
        Read sample receipt
      </button>

      {status.kind === "reading" && <p role="status">Reading receipt locally…</p>}
      {status.kind === "error" && <p role="alert">Could not read receipt: {status.message}</p>}
      {status.kind === "ready" && (
        <article aria-label="Draft transaction">
          <h3>Draft transaction (not in the ledger)</h3>
          <p>
            {status.blockCount} OCR blocks · {status.ocrMs === null ? "time unknown" : `${status.ocrMs} ms`} · source{" "}
            <code>{status.draft.sourceDigest.slice(0, 12)}</code>
          </p>
          <dl>
            <dt>Merchant text</dt>
            <dd>
              {status.draft.merchant?.value ?? "—"} <Source evidence={status.draft.merchant} />
            </dd>
            <dt>Date</dt>
            <dd>
              {status.draft.date?.value ?? "—"} <Source evidence={status.draft.date} />
            </dd>
            <dt>Printed total</dt>
            <dd>
              {status.draft.totalCents ? formatCents(status.draft.totalCents.value) : "—"}{" "}
              <Source evidence={status.draft.totalCents} />
            </dd>
          </dl>
          <p>
            Arithmetic check:{" "}
            {status.draft.checks.totalMatchesSubtotalPlusTax === null
              ? "not enough evidence"
              : status.draft.checks.totalMatchesSubtotalPlusTax
                ? "subtotal + tax equals total"
                : "subtotal + tax does NOT equal total, review the amounts"}
          </p>
          <table>
            <thead>
              <tr>
                <th>Line</th>
                <th>Amount</th>
                <th>Evidence</th>
              </tr>
            </thead>
            <tbody>
              {status.draft.lines.map((line) => (
                <tr key={line.evidence.blockIndexes.join("-")}>
                  <td>{line.description}</td>
                  <td>{formatCents(line.amountCents)}</td>
                  <td>
                    <Source evidence={line.evidence} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <section aria-label="Proposal">
            <button
              type="button"
              onClick={() => propose(status.draft)}
              disabled={proposal.kind === "working"}
            >
              Propose merchant and category
            </button>
            {proposal.kind === "working" && <p role="status">Asking the local model…</p>}
            {proposal.kind === "error" && <p role="alert">Could not propose: {proposal.message}</p>}
            {proposal.kind === "done" && proposal.response.result.ok && (
              <p>
                Proposal (not applied): <strong>{proposal.response.result.proposal.merchant}</strong> ·{" "}
                {proposal.response.result.proposal.category} <small>by {proposal.response.model}</small>
              </p>
            )}
            {proposal.kind === "done" && !proposal.response.result.ok && (
              <p role="alert">
                Proposal rejected: {proposal.response.result.reason}. Raw output: <code>{proposal.response.raw}</code>
              </p>
            )}
          </section>
          <section aria-label="Similar past entries">
            <button type="button" onClick={() => findSimilar(status.draft)} disabled={similar.kind === "working"}>
              Find similar past entries
            </button>
            {similar.kind === "working" && <p role="status">Comparing with your book…</p>}
            {similar.kind === "error" && <p role="alert">Could not compare: {similar.message}</p>}
            {similar.kind === "done" && similar.response.matches.length === 0 && <p>No close past entries.</p>}
            {similar.kind === "done" && similar.response.matches.length > 0 && (
              <ul>
                {similar.response.matches.map((match) => {
                  const entry = SAMPLE_BOOK.find((e) => e.id === match.entryId);
                  return (
                    <li key={match.entryId}>
                      {entry ? `${entry.date} ${entry.merchant} · ${entry.category}` : match.entryId} · similarity{" "}
                      {match.score.toFixed(3)}
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
          {review && (
            <ReviewForm
              key={`${status.draft.id}-${proposal.kind}`}
              draft={status.draft}
              proposal={proposal.kind === "done" && proposal.response.result.ok ? (proposal.response.result.proposal as { merchant: string; category: Category }) : null}
              review={review}
            />
          )}
        </article>
      )}
    </section>
  );
}
