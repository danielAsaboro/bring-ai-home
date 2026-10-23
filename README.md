# Deck

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A presentation builder that treats an argument as a playable set of cards.

## 2. Relatable problem

Presentation tools make it easy to format slides before the author has clarified the argument, audience, evidence, pacing, or single job of each slide.

## 3. Target users and jobs

Founders, teachers, students, consultants, researchers, and anyone presenting a structured argument.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse decks, assemble cards, edit content and treatment, group and reorder cards into narrative rounds, and enter focused presentation mode.

## 6. Detailed use cases

Argument outlining; reusable evidence cards; narrative sequencing; pacing; presentation rehearsal.

## 7. Bespoke metaphor and interaction model

A strategy card game: slides are playable cards, narrative sections are rounds, and presentation mode is the match.

## 8. Planned QVAC transformation

Planned generation proposes card-sized claims and notes; RAG grounds cards in private sources; embeddings retrieve reusable evidence; fine-tuning can adapt critique to a rubric.

## 9. Why local inference matters

Unreleased strategy, research, financial plans, and client material often cannot be pasted into a public deck generator.

## 10. Capability-to-feature mapping

Text generation, RAG, embeddings, and optional fine-tuning. Citations and source cards remain inspectable; authorship remains human.

## 11. Filmable course demonstration

Build an eight-card launch story manually, then ingest fixture notes locally, review a cited card pool, remove generic proposals, and rebalance rounds.

## 12. Research evidence

[QVAC text generation](https://docs.qvac.tether.io/ai-capabilities/text-generation/), [QVAC RAG](https://docs.qvac.tether.io/ai-capabilities/rag/), [Pitch](https://pitch.com/), and presenter discussions about [story before design](https://www.reddit.com/r/powerpoint/comments/1sadhef/why_are_good_presentations_so_hard_to_make/) and [outlining before PowerPoint](https://www.reddit.com/r/powerpoint/comments/1uef1nt/after_making_hundreds_of_decks_the_one_habit_that/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

PowerPoint, Google Slides, Pitch, Canva, and AI deck builders make this crowded. Deck differentiates through card-level argument strategy and source-grounded local assistance.

## 14. Technical feasibility and boundaries

No PPTX fidelity, team collaboration, cloud import, or claim that generation replaces presentation thinking.

## 15. Safety, privacy, and failure modes

Generated claims can be generic, false, or unsupported. Source links, audience intent, editing, and rehearsal remain central.

## 16. Course-fit score

**8.35/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

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
