# Homebook

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

The living binder for a home: rooms, assets, documents, maintenance, and projects stay connected.

## 2. Relatable problem

Home records fragment across physical binders, email, calendars, drives, spreadsheets, and memory—usually becoming urgent only after something breaks.

## 3. Target users and jobs

Homeowners, first-time buyers, caretakers, landlords with a small number of properties, and future residents inheriting context.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Navigate rooms, register assets, schedule and complete maintenance, file manual/receipt/warranty metadata, and record before-and-after projects.

## 6. Detailed use cases

Asset register; maintenance history; warranty retrieval; manual filing; project timeline; handover record.

## 7. Bespoke metaphor and interaction model

A property binder built from floor plans, room tabs, asset plates, service records, and maintenance stamps.

## 8. Planned QVAC transformation

Planned OCR reads labels and receipts; multimodal analysis proposes asset details; RAG answers from manuals and service records; generation drafts summaries.

## 9. Why local inference matters

Addresses, serial numbers, receipts, contractors, costs, and access details make a home dossier more sensitive than an ordinary notes folder.

## 10. Capability-to-feature mapping

OCR, multimodal input, RAG, and text generation. Safety and warranty answers must cite source records.

## 11. Filmable course demonstration

Register a water heater manually; then process a fixture label and receipt, review extracted facts, and answer a question from its stored manual.

## 12. Research evidence

[QVAC OCR](https://docs.qvac.tether.io/ai-capabilities/ocr/), [QVAC RAG](https://docs.qvac.tether.io/ai-capabilities/rag/), [HomeZada](https://www.homezada.com/), and homeowner discussions about [scattered records and missed warranties](https://www.reddit.com/r/FirstTimeHomeBuyer/comments/1syjwh3/how_do_you_actually_keep_track_of_everything_with/) and [binders plus reminders](https://www.reddit.com/r/homeowner/comments/1v6ivkh/how_do_you_keep_track_of_appliance_warranties/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

HomeZada is comprehensive; calendars, folders, and spreadsheets work for disciplined users. Homebook emphasizes room-and-asset context and a calm binder metaphor.

## 14. Technical feasibility and boundaries

Fixture attachments and metadata only. It is not a safety inspector, contractor marketplace, insurer, or repository for irreplaceable originals.

## 15. Safety, privacy, and failure modes

Model numbers, warranty terms, and maintenance instructions can be misread. Source documents and professional guidance remain authoritative.

## 16. Course-fit score

**9.00/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

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
