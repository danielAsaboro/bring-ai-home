"use client";

import { useState } from "react";

import { acceptDraft, createBook, rejectDraft, totals, type Book } from "./book";
import { formatCents } from "./draft-transactions";
import type { ReceiptClient } from "./receipt-client";
import { ReceiptInbox } from "./receipt-inbox";
import { SAMPLE_BOOK } from "./sample-book";

export function LedgerApp({ client, now = () => new Date() }: { client?: ReceiptClient; now?: () => Date }) {
  const [book, setBook] = useState<Book>(() => createBook(SAMPLE_BOOK));
  const sums = totals(book.entries);

  return (
    <>
      <ReceiptInbox
        client={client}
        review={{
          decided: book.decided,
          accept: (draft, reviewed, proposal) => setBook((b) => acceptDraft(b, draft, reviewed, proposal, now())),
          reject: (draft) => setBook((b) => rejectDraft(b, draft)),
        }}
      />
      <section aria-labelledby="book">
        <h2 id="book">Book</h2>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Merchant</th>
              <th>Category</th>
              <th>Amount</th>
              <th>Source</th>
            </tr>
          </thead>
          <tbody>
            {book.entries.map((entry) => (
              <tr key={entry.id}>
                <td>{entry.date}</td>
                <td>{entry.merchant}</td>
                <td>{entry.category}</td>
                <td>{formatCents(entry.amountCents)}</td>
                <td>{entry.source}</td>
              </tr>
            ))}
          </tbody>
        </table>
        <p aria-label="Book total">Total: {formatCents(sums.allCents)}</p>
        <ul aria-label="Totals by category">
          {sums.byCategory.map((row) => (
            <li key={row.category}>
              {row.category}: {formatCents(row.cents)}
            </li>
          ))}
        </ul>
      </section>
      <section aria-labelledby="audit">
        <h2 id="audit">Receipt audit</h2>
        {book.audit.length === 0 ? (
          <p>No receipts accepted yet.</p>
        ) : (
          <ul>
            {book.audit.map((record) => (
              <li key={record.entryId}>
                {record.entryId} from draft {record.draftId} · source {record.sourceDigest.slice(0, 12)} · OCR total{" "}
                {record.ocrTotalCents === null ? "none" : formatCents(record.ocrTotalCents)} · proposal{" "}
                {record.proposal ? `${record.proposal.merchant} / ${record.proposal.category}` : "none"} · changed by
                reviewer: {record.changedByReviewer.length ? record.changedByReviewer.join(", ") : "nothing"}
              </li>
            ))}
          </ul>
        )}
      </section>
    </>
  );
}
