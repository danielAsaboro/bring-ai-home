# Pattern

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A reversible transformation workbench where examples, rules, outputs, and revisions stay inspectable.

## 2. Relatable problem

People repeatedly clean exports and reformat text by hand because formulas, regex, Power Query, or scripting feel disproportionate to the job.

## 3. Target users and jobs

Analysts, operations teams, researchers, administrators, and non-programmers working with recurring messy text or tabular exports.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse patterns, add before/after examples, compose ordered deterministic rules, run samples, compare outputs, and preserve revisions.

## 6. Detailed use cases

Text normalization; field extraction; recurring export cleanup; rule rehearsal; revision comparison.

## 7. Bespoke metaphor and interaction model

A weaver’s loom: examples are threads, ordered rules form the weave, and outputs are swatches that can be compared.

## 8. Planned QVAC transformation

Planned generation infers candidate rules from examples and corrections; fine-tuning can adapt proposals to a domain; embeddings find similar patterns.

## 9. Why local inference matters

Business exports and operational records can be confidential. Local inference lets examples remain on the worker’s machine.

## 10. Capability-to-feature mapping

Text generation, fine-tuning, and embeddings. Inferred rules must become explicit deterministic operations before they can run.

## 11. Filmable course demonstration

Build a four-rule weave manually, then infer a proposed weave from examples, expose one failure, correct it, and replay all samples.

## 12. Research evidence

[QVAC fine-tuning](https://docs.qvac.tether.io/ai-capabilities/fine-tuning/), [OpenRefine](https://openrefine.org/), and discussions about [weekly Power Query cleanup](https://www.reddit.com/r/spreadsheets/comments/1sxz770/what_made_you_go_from_ignoring_power_query_to/) and [Flash Fill failures](https://www.reddit.com/r/excel/comments/1eboko8).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

OpenRefine and Power Query are powerful mature tools; Excel Flash Fill already demonstrates inference from examples. Pattern is smaller, visual, and designed around correction and rule legibility.

## 14. Technical feasibility and boundaries

The starter handles a bounded fixture transformation model, not arbitrary code, huge datasets, or silent source mutation.

## 15. Safety, privacy, and failure modes

Few examples are ambiguous and can overfit. Raw input, previews, counterexamples, revisions, and deterministic replay stay visible.

## 16. Course-fit score

**8.70/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

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
