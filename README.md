# Ledger

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

An owned account book where every balance can be traced to entries and evidence.

## 2. Relatable problem

Manual transaction entry is tedious, but sending bank messages, receipts, or statements to a remote parser exposes a detailed financial history.

## 3. Target users and jobs

People who want private expense tracking, careful imports, budgets, recurring bills, and understandable provenance.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Inspect monthly books, create and categorize transactions, import a deterministic CSV fixture, manage budgets and bills, and trace summaries to entries.

## 6. Detailed use cases

Manual bookkeeping; reviewed statement import; receipt provenance; reconciliation; budget and recurring-bill tracking.

## 7. Bespoke metaphor and interaction model

A ruled account book with folios, receipt pockets, and reconciliation stamps. The UI favors ownership and legibility over speculative-fintech gloss.

## 8. Planned QVAC transformation

Planned OCR extracts transaction candidates; generation proposes merchant normalization and categories; embeddings retrieve similar entries. Users review every draft.

## 9. Why local inference matters

Statements reveal balances, merchants, counterparties, dates, and habits. Local processing avoids granting a service or aggregator access to that history.

## 10. Capability-to-feature mapping

OCR, text generation, and embeddings/RAG assist clerical work. Totals, balances, budgets, and reconciliation remain deterministic code.

## 11. Filmable course demonstration

Import and categorize a statement manually; then process the same fixture locally, review candidates with provenance, correct one, and prove that deterministic totals agree.

## 12. Research evidence

[QVAC OCR](https://docs.qvac.tether.io/ai-capabilities/ocr/), [QVAC RAG](https://docs.qvac.tether.io/ai-capabilities/rag/), [CFPB data-sharing guidance](https://www.consumerfinance.gov/archive/blog/what-to-consider-when-sharing-your-financial-data/), [Actual Budget](https://actualbudget.org/), and a [privacy-first bank-SMS discussion](https://www.reddit.com/r/personalfinanceindia/comments/1tibdez/built_a_privacyfirst_expense_tracker_because_i/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Actual Budget already offers a strong local-first finance product. Spreadsheets are flexible substitutes. Ledger focuses the course on reviewed extraction, provenance, and deterministic boundaries.

## 14. Technical feasibility and boundaries

No bank connection, money movement, tax workflow, or financial advice. Fixtures are synthetic and imports are deterministic.

## 15. Safety, privacy, and failure modes

Parsing and categorization can be wrong. Candidates never silently affect balances; generated prose never performs arithmetic.

## 16. Course-fit score

**9.25/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

## 17. Run, test, and reset

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm test
npm run build
```

The complete starter will expose a visible **Reset demo data** action. Until its product wave is implemented, this directory contains the independently verified Next.js and test foundation.
