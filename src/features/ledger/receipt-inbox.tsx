"use client";

import { useState } from "react";

import { draftFromOcr, formatCents, type DraftTransaction, type Evidence } from "./draft-transactions";
import { createReceiptClient, type ReceiptClient } from "./receipt-client";

const SAMPLE_URL = "/test-files/ledger/receipt-corner-cafe.png";

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

export function ReceiptInbox({ client }: { client?: ReceiptClient }) {
  const [status, setStatus] = useState<Status>({ kind: "idle" });

  async function read(fileName: string, bytes: ArrayBuffer) {
    setStatus({ kind: "reading" });
    try {
      const api = client ?? createReceiptClient();
      const receiptId = `${Date.now()}`;
      const result = await api.readReceipt({ receiptId, fileName, pngBytes: bytes });
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
        </article>
      )}
    </section>
  );
}
