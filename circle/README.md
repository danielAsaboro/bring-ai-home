# Circle

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A warm personal phonebook for remembering context without treating people as leads.

## 2. Relatable problem

Calendars remember dates and contacts remember numbers, but neither reliably preserves what someone shared, what was promised, or why a follow-up matters.

## 3. Target users and jobs

People maintaining friendships, family relationships, mentorships, volunteer relationships, and thoughtful professional networks.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse alphabet tabs, inspect person cards and timelines, log interactions and memories, create gentle reminders, and organize meaningful circles.

## 6. Detailed use cases

Conversation memory; promise tracking; important dates; contextual follow-up; relationship grouping.

## 7. Bespoke metaphor and interaction model

A phonebook catalogue with alphabet tabs, annotated cards, and relationship trails—warm, personal, and deliberately unlike sales CRM.

## 8. Planned QVAC transformation

Planned transcription turns a voice recap into proposed interactions, promises, and dates; embeddings retrieve relevant context; generation drafts an optional follow-up.

## 9. Why local inference matters

The notes describe other people who never consented to cloud profiling. Local inference reduces unnecessary disclosure of their lives and relationships.

## 10. Capability-to-feature mapping

Transcription, text generation, and embeddings/RAG. Extraction produces drafts, never silent records or messages.

## 11. Filmable course demonstration

Log a call manually, then speak a messy recap and confirm only the correctly extracted memory, promise, date, and reminder.

## 12. Research evidence

[QVAC transcription](https://docs.qvac.tether.io/ai-capabilities/transcription/), [QVAC RAG](https://docs.qvac.tether.io/ai-capabilities/rag/), [Monica](https://www.monicahq.com/), and first-person discussions about [private relationship memory](https://www.reddit.com/r/apps/comments/1pishxn/i_built_a_privacyfirst_relationship_memory_app/) and [remembering personal details](https://www.reddit.com/r/SideProject/comments/1mnlnfl/i_built_a_private_personal_crm_to_help_me_stay_in/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Monica is open-source and self-hostable; contacts, notes, and calendars are low-friction substitutes. Circle differentiates through humane capture and a voice-to-confirmation course flow.

## 14. Technical feasibility and boundaries

No contact sync, messaging, social graph import, or automated outreach in the starter.

## 15. Safety, privacy, and failure modes

Relationship scoring and manipulative cadence are excluded. Users can keep capture minimal, edit it, reset it, and avoid recording sensitive third-party details.

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
