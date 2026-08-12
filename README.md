# Bring AI Home

Ten ordinary, useful applications designed to become extraordinary when private, local AI is added.

This repository contains the **before** state for a course about integrating [QVAC](https://docs.qvac.tether.io/): real products with complete non-AI workflows, not chat demos waiting for a model. Every app is an independent Next.js project with its own lockfile, data model, tests, and handwoven visual world. The starters use local fixture data and browser persistence. They contain no account, backend, analytics, remote database, model service, fake intelligence, or dormant AI button.

## Ranked course sequence

| Rank | App | Score | Product world | The local-AI transformation |
| ---: | --- | ---: | --- | --- |
| 1 | [Redact](./redact) | 9.25 | Classified dossier and light table | Private documents become reviewable redaction candidates without uploading the original |
| 2 | [Ledger](./ledger) | 9.25 | Ruled account book | Statements and receipts become traceable transaction drafts while arithmetic stays deterministic |
| 3 | [Chronicle](./chronicle) | 9.05 | Flip magazine | Family media and spoken recollections become searchable, editable memory spreads |
| 4 | [Circle](./circle) | 9.05 | Personal phonebook catalogue | Voice recaps become confirmed memories, promises, dates, and gentle follow-ups |
| 5 | [Homebook](./homebook) | 9.00 | Property binder | Labels, receipts, and manuals become a grounded home knowledge system |
| 6 | [Pattern](./pattern) | 8.70 | Weaver's loom | Before/after examples become explicit, editable, replayable transformation rules |
| 7 | [Replay](./replay) | 8.70 | Tape deck | A narrated demonstration becomes a proposed workflow with preconditions and safe stops |
| 8 | [Closet](./closet) | 8.55 | Private fashion feed | Garment photos become reviewed catalogue data and owned-item outfit proposals |
| 9 | [Lookout](./lookout) | 8.55 | Event-first control room | Plain-language watcher conditions become inspectable local visual rules |
| 10 | [Deck](./deck) | 8.35 | Narrative card game | Private source material becomes a cited card pool and an editable argument—not a generic slide dump |

Scores use a 10-point weighted model: relatability 20%, local/privacy necessity 20%, filmable transformation 20%, coherent QVAC coverage 15%, implementation feasibility 15%, and case-study depth 10%. Usefulness and product potential break ties.

## Delivery waves

- **Wave 1:** Redact, Ledger, Chronicle
- **Wave 2:** Circle, Homebook, Pattern
- **Wave 3:** Replay, Closet
- **Wave 4:** Lookout, Deck

Each wave is visually and functionally reviewed before the next. The order is about teaching strength, not a verdict on which product deserves to exist.

## Why local inference

These products hold the kinds of context people hesitate to paste into a cloud chat: unredacted IDs, complete spending histories, family photographs, private relationship notes, household records, screen recordings, camera footage, and body or wardrobe images. QVAC documents local text generation, multimodal input, OCR, transcription, embeddings/RAG, fine-tuning, and image classification. The course adds those capabilities where they improve an existing workflow; deterministic calculations, permissions, audit history, and user decisions remain application code.

## Repository contract

Every directory is independently installable:

```bash
cd redact
npm install
npm run dev
```

Every project provides `lint`, `typecheck`, `test`, `test:e2e`, and `build` scripts. There is intentionally no root workspace, shared component package, or shared visual system. The products share engineering standards—not an aesthetic.

## Current state

Wave 0 establishes the verified Next.js baseline, independent lockfiles, test harnesses, research-backed ranking, and truthful case-study foundations. Product workflows are implemented in ranked waves. Planned QVAC sections describe the course transformation; no starter currently claims that QVAC is integrated.
