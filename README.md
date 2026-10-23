# Replay

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A tape library for recording, editing, and following repeatable work.

## 2. Relatable problem

Written procedures are expensive to create, go stale, and force people to switch constantly between the guide and the task.

## 3. Target users and jobs

Individuals and small teams documenting recurring computer work, onboarding, QA reproduction, reports, and handoffs.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse tapes, manually author and edit steps, play a guided run, pause/skip/retry/annotate, and inspect run history.

## 6. Detailed use cases

Reusable checklist; interactive SOP; guided run; failure annotation; revision and run history.

## 7. Bespoke metaphor and interaction model

A tape deck: workflows are recordings, steps are frames, and a guided run moves a visible playhead.

## 8. Planned QVAC transformation

Planned transcription converts narration into draft steps; multimodal input interprets screenshots; generation identifies parameters, preconditions, and stop conditions.

## 9. Why local inference matters

Screen recordings can expose customer data, internal systems, messages, credentials, and unreleased work. Local interpretation keeps raw capture off a remote service.

## 10. Capability-to-feature mapping

Transcription, multimodal input, text generation, and RAG. The course may later integrate privileged execution, but the starter never claims it.

## 11. Filmable course demonstration

Author and run a report tape manually; then narrate a demonstration and review proposed steps, inputs, checks, and a safe stop.

## 12. Research evidence

[QVAC transcription](https://docs.qvac.tether.io/ai-capabilities/transcription/), [Scribe](https://scribe.com/), and discussions about [demonstration-to-workflow](https://www.reddit.com/r/automation/comments/1usf45e/i_demonstrate_a_repetitive_task_once_and_it/) and [offline screen-to-guide capture](https://www.reddit.com/r/ProductivityApps/comments/1uvalr3/i_kept_explaining_the_same_tasks_over_and_over_so/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Scribe and Tango are mature for capture and interactive guidance. Replay focuses on the bridge from an honest manual runner to locally learned, inspectable workflow assistance.

## 14. Technical feasibility and boundaries

No arbitrary screen capture, browser extension, OS automation, or external-app control in the starter.

## 15. Safety, privacy, and failure modes

Layouts change and recorded coordinates fail. Future execution requires permissions, semantic anchors, preconditions, dry runs, post-action verification, and visible failure evidence.

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

The header has a visible **Reset demo data** action that restores the fictional sample tapes. Library state lives in `localStorage` behind one adapter, `src/features/replay/library-store.ts`. Replay never performs a step for you; a run records what you say happened.
