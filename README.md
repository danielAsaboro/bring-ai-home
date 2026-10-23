# Lookout

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

An event-first control room for locally owned visual sources.

## 2. Relatable problem

Motion alerts are noisy, notification settings are brittle, and important events disappear inside hours of footage.

## 3. Target users and jobs

Home-lab users, property owners, caregivers, studio operators, and people monitoring a bounded local space.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse fixture sources, arm/disarm them, configure ordinary time/motion/change rules, review an event tape, and acknowledge events.

## 6. Detailed use cases

Explicit watcher state; event review; rule configuration; acknowledgement; fixture replay.

## 7. Bespoke metaphor and interaction model

A control room where events lead, feeds support them, and armed state is impossible to miss.

## 8. Planned QVAC transformation

Planned multimodal inference evaluates semantic conditions; custom classification handles narrow labels; generation turns plain language into an inspectable watcher proposal.

## 9. Why local inference matters

Household footage captures residents, visitors, neighbors, voices, routines, and property. Sending continuous footage to a model service expands exposure.

## 10. Capability-to-feature mapping

Multimodal input, custom image classification, and text generation. Semantic conditions require evaluation and thresholds, not blind trust.

## 11. Filmable course demonstration

Configure motion/time rules on fixture sources, then propose “tell me when a parcel is left by the gate,” replay fixture events, and tune errors.

## 12. Research evidence

[QVAC multimodal](https://docs.qvac.tether.io/ai-capabilities/multimodal/), [Frigate](https://docs.frigate.video/), [ICO home CCTV guidance](https://ico.org.uk/for-the-public/home-cctv-systems/), and discussions about [local detection reducing false positives](https://www.reddit.com/r/homeassistant/comments/odnp6e) and [alarm false positives/negatives](https://www.reddit.com/r/homeassistant/comments/1d57i1k).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Frigate is a serious complete local NVR with object detection and review. Lookout is a course-focused UI for semantic watcher design, not a replacement NVR.

## 14. Technical feasibility and boundaries

Public-safe fixture frames only. No camera ingestion, recording, live alerting, biometric identification, or security guarantee.

## 15. Safety, privacy, and failure modes

False negatives can be dangerous and false positives cause alarm fatigue. Retention, privacy masking, minimization, arming, and human review must remain explicit.

## 16. Course-fit score

**8.55/10.** The portfolio score weights relatability, local/privacy necessity, filmable transformation, coherent QVAC coverage, implementation feasibility, and case-study depth. See the [portfolio ranking](../README.md#ranked-course-sequence).

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
