# Closet

> **Status:** Non-AI starter foundation. The QVAC capabilities below are planned course work, not features currently present in the app.

## 1. Product thesis

A private fashion feed built from clothes the user actually owns.

## 2. Relatable problem

People struggle to see their wardrobe as combinations, remember what works, track what is wearable, and plan trips without overpacking.

## 3. Target users and jobs

Wardrobe organizers, capsule-wardrobe users, travelers, outfit planners, and people trying to wear more of what they own.

## 4. Why this is a complete application

It has a durable collection, repeat visits, editing, inspection, state transitions, history, and a return loop. Its value does not depend on opening a chat box.

## 5. Non-AI starter experience

Browse outfit posts and stories, inspect and edit garments, assemble looks, track clean/worn/washing/repair states, and build a packing carousel.

## 6. Detailed use cases

Wardrobe catalogue; outfit creation; garment-state tracking; saved collections; visual packing.

## 7. Bespoke metaphor and interaction model

A fashion social feed with posts, stories, collections, and carousels—but with original branding and the user’s own closet at the center.

## 8. Planned QVAC transformation

Planned multimodal input proposes garment metadata; a custom classifier supplies domain labels; embeddings retrieve looks; generation proposes constraint-aware outfits.

## 9. Why local inference matters

Body images, sizes, purchases, travel plans, and daily routines form sensitive context even when the clothes look ordinary.

## 10. Capability-to-feature mapping

Multimodal input, custom image classification, embeddings, and text generation. The bundled generic classifier is not a wardrobe model.

## 11. Filmable course demonstration

Create a garment and outfit manually; then add a fixture photo, review proposed metadata, and request a trip carousel from owned clean items under a packing limit.

## 12. Research evidence

[QVAC multimodal](https://docs.qvac.tether.io/ai-capabilities/multimodal/), [QVAC image classification](https://docs.qvac.tether.io/ai-capabilities/image-classification/), [Whering](https://whering.co.uk/), and user comparisons covering [packing and outfit planning](https://www.reddit.com/r/capsulewardrobe/comments/18kiagn/wardrobeclothingstyle_apps/) and [organization versus social features](https://www.reddit.com/r/capsulewardrobe/comments/1kc64q4/so_what_wardrobe_indexing_apps_are_people_using/).

These sources are evidence of capabilities, existing workflows, or first-person pain signals; they are not presented as market-size proof.

## 13. Alternatives and differentiation

Whering, Stylebook, Acloset, Indyx, and OpenWardrobe establish a mature feature bar. Closet’s course angle is reviewed local vision inside a complete, playful product.

## 14. Technical feasibility and boundaries

No virtual try-on, body analysis, shopping marketplace, trend feed, or claim that a proposed look will fit.

## 15. Safety, privacy, and failure modes

Digitization is burdensome and some users explicitly do not want AI styling. Manual organization remains first-class and all fixtures are public-safe.

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
