# Chronicle

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A private editorial archive that turns family media into issues, spreads, and stories.

## 2. Relatable problem

Large photo libraries preserve pixels but often lose names, context, spoken stories, and the narrative that makes a memory worth keeping.

## 3. Target users and jobs

Families, personal archivists, historians, and anyone curating a meaningful collection rather than another endless camera roll.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse issues and eras, turn through spreads, inspect a people index, create a memory, edit captions, and arrange a spread.

## 6. Detailed use cases

Memory capture; editorial sequencing; people and era browsing; caption stewardship; family storytelling.

## 7. Bespoke metaphor and interaction model

A tactile flip magazine of issues, clippings, inserts, captions, and page turns—not a gallery dashboard.

## 8. Planned QVAC transformation

Planned multimodal analysis proposes descriptions, transcription captures spoken context, RAG retrieves imperfectly remembered moments, and generation drafts editable copy.

## 9. Why local inference matters

Family images, locations, names, voices, and relationships form an intimate archive. Local inference keeps discovery close to the collection.

## 10. Capability-to-feature mapping

Multimodal input, transcription, embeddings/RAG, and text generation. Suggested people and captions require confirmation.

## 11. Filmable course demonstration

Build a spread manually, then speak a recollection, retrieve matching fixture memories, and compose an editable proposed issue with visible sources.

## 12. Research evidence

[QVAC multimodal](https://docs.qvac.tether.io/ai-capabilities/multimodal/), [QVAC transcription](https://docs.qvac.tether.io/ai-capabilities/transcription/), [Library of Congress personal archiving](https://www.loc.gov/static/programs/digital-preservation/personal-digital-archiving/), [Immich features](https://immich.app/features), and an [offline photo-library discussion](https://www.reddit.com/r/selfhosted/comments/1nxp2v3/omoide_an_offline_selfhosted_photo_video_library/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Immich is a capable self-hosted photo platform. Chronicle differentiates through authored editorial storytelling and preserving human context, not infrastructure or backup.

## 14. Technical feasibility and boundaries

The browser starter uses public-safe fixture media and is not an archival storage or backup system.

## 15. Safety, privacy, and failure modes

Face grouping and generated captions can be wrong or insensitive. Originals, human labels, and revision history remain authoritative.

## 16. Course-fit score

**9.05/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

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
