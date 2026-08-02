# EP 9 — Inside Leash

| Field | Value |
|---|---|
| **Episode** | 9 of 10 |
| **Title** | Inside Leash |
| **SEO title** | Inside Leash: How a Private AI System Won the QVAC Hackathon |
| **Runtime** | 14–18 minutes |
| **Tone** | Honest founder teardown; evidence before triumph |
| **Primary job** | Show how the course’s separate ideas became one working product—and what should be rebuilt now |
| **Upload name** | `Bring AI Home Ep.09 — Inside Leash` |

## Spoken script

### Part 1 — The result is not the story

```
On July twenty-seventh, 2026, QVAC announced Leash as the grand-prize winner—first place overall—in its first Unleash Edge AI hackathon.

Leash also won the separate Build in Public prize.

I am proud of that result.

But a prize is a moment. Architecture is what survives the moment.

The useful story is not that judges selected Leash from a field of projects.

The useful story is what we attempted, which assumptions failed, which primitives held, how we proved the claims, and what another builder can take without building anything that looks like Leash.

For eight episodes, we separated local intelligence into pieces: execution, memory, perception, agency, and trusted delegation.

This is the episode where those pieces become one organism.
```

### Part 2 — Leash and Mycelium

```
Leash is the product surface: a private, offline-capable personal AI designed to live across devices the user controls.

Mycelium is the five-layer runtime underneath it.

The names matter because the interface and the organism are different things.

Users meet Leash through web, desktop, mobile, Telegram, and background services.

Mycelium provides the mesh, senses, mind, memory, and clients that make those surfaces feel like one intelligence.

Every AI path runs through QVAC on local hardware: language generation, embeddings, retrieval, vision, speech, image generation, delegated inference, and LoRA adaptation.

There is no configuration switch that swaps in a cloud model.

The provider module points at a local QVAC serve endpoint. Model weights live on the devices. Optional outbound services are disclosed separately and are not cloud inference.

That constraint was not only a hackathon rule.

It forced the architecture to tell the truth.
```

### Part 3 — Layer one: mesh

```
The first Mycelium layer is the mesh.

Hypha is the headless service that gives devices identities, pairs peers, exposes capabilities, delegates inference, synchronizes shared context, and records what happened.

The mesh passes whole intelligence tasks between independent devices. It does not pretend several machines have become one pooled supercomputer.

The primary hackathon machine was an M4 Mac mini with twenty-four gigabytes of memory. A MacBook Pro acted as an optional stronger peer. An iPhone provided a mobile surface.

Each device remained its own device, with its own model runtime and hardware limits.

When Leash delegated a turn, the consumer selected a peer capable of the requested modality, passed the task over the encrypted path, and streamed the provider’s result back.

Private devices delegated for free. A separate optional path explored metered providers using reproducible local settlement—not a public marketplace disguised as a demo.

The lesson is simple: coordinate devices before pretending one device can do everything.
```

### Part 4 — Layer two: senses

```
The second layer is senses.

Notes, files, prior chats, activity, photographs, screenshots, voice, and feeds become structured local context.

Embeddings and RAG make text retrievable. OCR turns images of documents into text. Speech models handle voice. Vision models interpret selected photographs and screen frames.

The watcher demonstrated an important retention pattern: perceive a frame locally, extract the useful meaning, then remove the raw frame rather than quietly building a surveillance archive.

Senses also own source identity.

An answer is more trustworthy when the interface can show whether it came from a note, a meeting transcript, a memory, a photograph, or the model’s general language ability.

Perception without provenance creates a system that knows things but cannot explain how.

Leash treated source chips and citations as part of the sensory path—not decoration added after generation.
```

### Part 5 — Layer three: mind

```
The third layer is mind.

This is where the Conductor decides how a turn should be handled.

It grades intent, modality, difficulty, and sensitivity. It chooses a local model or trusted peer. It selects a focused toolset. It decides whether a specialist agent is appropriate. It adjusts the effort and step budget.

Privacy filtering happens before cost ranking.

A private request cannot route to an untrusted public provider merely because that route is faster or cheaper.

Leash itself is the default agent. Specialists are defined with restricted tools, skills, models, and turn limits. Sub-agents run isolated loops and return bounded summaries rather than flooding the parent context with every intermediate token.

Skills can provide instructions, deterministic steps, scripts, and assets. Imported capabilities begin disabled until reviewed.

The mind is not one clever prompt.

It is the policy layer that decides which form of intelligence receives authority for the current turn.
```

### Part 6 — Layer four: memory

```
The fourth layer is memory.

Leash separates explicit facts from retrieved context and learned behavior.

Typed memories can be inspected and corrected. RAG workspaces preserve sourceable private knowledge. Conversation records provide history and evidence. A local training pipeline curates examples and produces LoRA adapters that can change model behavior without replacing the base model.

The original spike trained an adapter on-device in roughly one hundred and fifty-three seconds. The resulting file was about twenty megabytes and measurably changed model behavior in the validation task.

That number was not presented as proof that a tiny training run creates a perfect digital twin.

It proved the lifecycle:

Curate data.

Train locally.

Evaluate the adapter.

Load it during completion.

Keep or reject it based on evidence.

Personalization should be reversible. A user should be able to remove an adapter without losing the underlying memory or base model.
```

### Part 7 — Layer five: clients

```
The fifth layer is clients.

Web provides the full control surface. Desktop wraps the local runtime into an installable experience. Mobile keeps the assistant present and handles capture, task synchronization, local inference where supported, and delegation to stronger devices. Telegram provides an owner-controlled bridge. Background daemons handle mesh, sensing, and publishing workflows.

The clients are not separate assistants pretending to share a brand.

They are doors into the same system.

That distinction changes where state belongs.

Conversation truth should not live only in one browser tab. Peer membership should not belong to the chat interface. Model availability should not be hardcoded separately in every client. Approval decisions should produce records the system can understand across surfaces.

A multi-device product becomes coherent when clients remain replaceable and the organism beneath them owns the durable state.
```

### Part 8 — Follow one Leash turn

```
Let us follow one request through all five layers.

The user asks, “What is blocking the mobile launch, and create the task I need to resolve it.”

The client sends the current turn.

Leash rebuilds usable history from local stores.

The Conductor recognizes private project context, retrieval, and a consequential task action.

Senses search the local workspace and return the meeting passage describing the mobile audit.

Mind selects a model, exposes only the retrieval and task tools, and prepares a grounded prompt.

If the local device lacks the required model, mesh may route the completion to a paired private peer.

The answer streams with the source passage.

The model proposes a task. The client displays an approval card. Only after approval does deterministic code create it.

Memory records the resulting task and its source.

One user request crossed every layer without giving any layer authority it did not need.
```

### Part 9 — Prove primitives before building product

```
The most important engineering decision happened before the full product existed.

We created four spike gates.

Could QVAC run local completion and embeddings fast enough on the target hardware?

Could RAG retrieve evidence and produce a visibly grounded answer?

Could one device delegate a complete inference task to another over the encrypted path?

Could the hardware train and load a LoRA adapter?

All four had to pass before the surrounding product expanded.

The captured spike measured a warm one-billion-parameter completion at about seventy tokens per second, local retrieval at roughly twenty-three milliseconds, delegated provider generation at about forty-five tokens per second, and a completed local adapter-training run.

The exact numbers belong to those devices and versions. The pattern is portable.

Identify the riskiest claims in the product. Build the smallest experiment that could disprove each one. Save structured evidence. Only then build the interface around the primitives that survived.
```

### Part 10 — Evidence is a product feature

```
Leash shipped an evidence bundle because “trust me, it is local” is not a privacy guarantee.

The repository records model loads, completions, embeddings, retrieval, delegation, training, latency, tokens, and device identity in structured logs.

It includes chat indexes, QVAC summaries, Hypha summaries from both sides of the mesh, a machine-readable inventory of outbound network surfaces, and explicit redaction of credential-like fields.

The airplane-mode path was treated as an acceptance test. QVAC-only inference was enforced through a single localhost chokepoint rather than a statement in marketing copy.

This proof culture improved engineering as much as judging.

When a delegated result appeared, we could ask which device produced the tokens.

When retrieval failed, we could inspect the scores and sources.

When a model felt slow, we had time-to-first-token and throughput instead of adjectives.

Observability is how a private system earns the right to make private claims.
```

### Part 11 — The parts that did not fit

```
Leash did not finish every ambition.

Text-to-video exhausted the memory of the twenty-four-gigabyte M4 and was deferred. Image generation remained available; the failed video gate stayed documented.

Computer-use tools worked locally behind jails and approvals, but peer delegation for computer use had not been hardened through a complete live two-machine run.

The metered-compute path remained off by default and settled against a local development chain rather than pretending a public economy already existed.

Android was an early preview. Some local voice and desktop-owned capabilities were not yet available there.

And cross-mesh vision initially failed because the OpenAI-compatible serve path accepted string content but dropped multimodal message arrays.

We fixed that path, carried the patch, and upstreamed the improvement to QVAC.

A known-issues page does not weaken a project.

It draws the line between demonstrated capability and desired capability.
```

### Part 12 — What I would rebuild now

```
The hackathon submission closed on June twenty-second. The QVAC stack kept moving.

I would rebuild long conversations around the newer context and cache controls: TurboQuant compression, thinking-token removal, and improved server-side KV-cache behavior for agents.

I would simplify the agent boundary around the current local serve and tool-calling paths rather than preserving glue written for older SDK versions.

I would expand mobile voice using the newer iOS and Android GPU speech paths and treat multilingual speech as a primary surface rather than an enhancement.

I would re-evaluate document and ambient vision using newer batching, OCR, and phone-GPU support.

I would use batch completion for background jobs that currently queue serially.

And I would make private media generation a real Leash capability using shipped image and video paths only where the target device passes an explicit memory gate.

VisionPsy-Nano is especially interesting for cheap ambient vision, but QVAC’s official SDK support was still described as coming. That belongs on the evaluation list—not in the shipped-feature column.

A roadmap becomes credible when every item names the capability, target device, acceptance test, and current status.
```

### Part 13 — What to steal

```
You do not need Leash’s five layers or its product shape.

Take five patterns instead.

First: sensitivity before cost. Privacy is a routing gate, not a preference score.

Second: prove primitives before product. Let failed spikes kill weak architecture early.

Third: keep tasks, models, runtimes, devices, and clients as separate decisions.

Fourth: treat approvals and citations as interface features. Trust must be visible at the moment it matters.

Fifth: ship evidence with claims. Offline means an offline test. Local means a traceable execution path. Fast means a measurement tied to hardware and version.

Those patterns did more for Leash than any single model.

Models will change.

The discipline of building owned intelligence should survive them.
```

### Part 14 — The product after the prize

```
Leash won first place because the complete system made an ambitious argument: private intelligence can perceive, remember, act, and grow across devices without installing a cloud model as its permanent landlord.

But the prize does not complete that argument.

Users do.

Maintenance does.

Reproducibility does.

Closing the gaps on ordinary hardware does.

The hackathon version is evidence that the architecture can exist.

The next version has to become simpler, more reliable, and more useful than the demo that proved it.

In the final episode, the camera turns away from Leash.

You have seen the philosophy, the stack, the code path, the memory, the senses, the tools, the mesh, and the full product.

The remaining question is what you will build with them.
```

## Research receipts

- [Official QVAC Hackathon I results](https://x.com/qvac/status/2081721551603552341)
- [Leash repository](https://github.com/danielAsaboro/Leash)
- [Leash documentation](https://docs.useleash.xyz/)
- [Merged Leash contribution to QVAC](https://github.com/tetherto/qvac/pull/2459)
- [QVAC SDK 0.14 announcement](https://x.com/qvac/status/2071569948091338894)
- [QVAC SDK 0.16 announcement](https://x.com/qvac/status/2081733632134410363)
- [VisionPsy SDK status](https://x.com/qvac/status/2082450894067757306)

