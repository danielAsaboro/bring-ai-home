# EP 3 — The Anatomy of Local Intelligence

| Field | Value |
|---|---|
| **Episode** | 3 of 10 |
| **Title** | The Anatomy of Local Intelligence |
| **SEO title** | How QVAC Works: Models, Tasks, Runtimes, and Devices Explained |
| **Runtime** | 8–10 minutes |
| **Tone** | Clear, visual, teacher-at-the-whiteboard energy |
| **Primary job** | Give viewers one durable mental model for every build that follows |
| **Upload name** | `Bring AI Home Ep.03 — The Anatomy of Local Intelligence` |

## Spoken script

### Part 1 — AI is not one box

```
Most AI diagrams lie by drawing one box.

Your application sends a message into a box labelled AI. A response comes out. Everything important disappears inside the arrow.

That picture is convenient when somebody else owns the infrastructure.

It is useless when you are trying to build the infrastructure yourself.

A local AI product is not one model sitting inside one application. It is a stack of decisions: what the user experiences, what task must happen, which model can perform it, which runtime can execute that model, which hardware is available, where memory lives, and whether another trusted device should help.

If those layers are blurred together, every limitation feels mysterious.

If you can separate them, local AI becomes ordinary engineering.

So in this episode, we are going to take the box apart.
```

### Part 2 — Start at the top: the experience

```
At the top of the stack is the experience.

It might be a chat screen, a voice recorder, a camera, a document search box, a coding agent, or a background process that organizes files while you sleep.

The user does not care which model produced a token. The user cares that the meeting was summarized, the photograph was understood, or the correct document was found.

This matters because builders often begin too low in the stack.

They choose a fashionable model and then search for a reason to put it inside a product.

Begin with the experience instead.

What is the user trying to accomplish? What information enters the system? What useful result must leave it? How long can they wait? What data must remain private? What happens when the device is offline?

Those questions determine the intelligence you need.

The model comes later.
```

### Part 3 — Applications are made of tasks

```
Beneath the experience is application logic: the code that decides what should happen next.

That code breaks the user’s intention into tasks.

A voice-note assistant might need transcription, text generation, embeddings, retrieval, and text-to-speech.

A photo organizer might need image classification, OCR, embeddings, and search.

An agent might need text generation, tool selection, permission checks, and execution.

These are different tasks. They do not have to use the same model.

This is one of the most important changes in your mental model.

Do not ask, “Which AI powers my application?”

Ask, “Which intelligence task is required at this moment?”

QVAC exposes a unified JavaScript and TypeScript interface across many tasks, but unified does not mean identical. Completion, embedding, transcription, vision, OCR, generation, and delegated inference still have different inputs, models, costs, and hardware requirements.

One SDK gives us a shared development surface.

The task still determines the tool.
```

### Part 4 — A model is an asset, not a product

```
Now we reach the model layer.

A model is a collection of learned parameters prepared to perform a kind of computation. It might generate language, convert speech into text, turn text into vectors, or interpret an image.

The model does not contain your interface, your permissions, your product rules, or your user’s long-term memory.

It is an asset your application loads to perform a task.

In QVAC, the basic lifecycle is explicit.

Load a model into memory.

Call the function for the task you need.

Reuse the loaded model while it remains useful.

Unload it when you need to release resources.

And close the SDK when the application is finished.

That lifecycle matters on every device, but especially on phones and laptops where memory, heat, and battery are part of the product.

Loading every model at startup is not ambition.

It is a memory leak with branding.
```

### Part 5 — The runtime makes the model executable

```
A model file cannot execute itself.

The runtime is the machinery that reads the model, schedules its operations, manages memory, and talks to the hardware beneath it.

This is where words such as Metal, Vulkan, OpenCL, ROCm, GGML, and llama.cpp begin to appear.

You do not need to become a kernel engineer to build a useful application. But you need to understand what this layer explains.

If a model is fast on one laptop and slow on another, the difference may be the hardware backend.

If a model fits on disk but crashes when loaded, the problem is working memory, not storage.

If a phone can transcribe speech but struggles with a large vision model, those are different workloads meeting different hardware limits.

QVAC’s pluggable runtime hides much of this complexity behind task APIs while still allowing the application to choose models, configuration, and device behavior.

Abstraction removes repetition.

It does not remove physics.
```

### Part 6 — The device is part of the architecture

```
In cloud development, hardware can feel like somebody else’s problem.

In local AI, the device is part of your product specification.

A phone is always present, has a microphone and camera, and protects some of the user’s most private context. It is also limited by memory, sustained heat, and battery.

A laptop offers more memory and better sustained performance. It is a natural home for everyday reasoning, document retrieval, and larger local models.

A desktop or workstation can handle heavier vision, generation, fine-tuning, or long-running background work.

Good local-first architecture does not pretend these devices are equal.

It gives each device a role.

Capture on the phone. Retrieve and reason on the laptop. Generate or train on a stronger machine when necessary.

The application remains one experience even when the work is distributed across hardware.
```

### Part 7 — Local does not have to mean alone

```
QVAC supports local inference and delegated inference to peers.

That gives us one more layer beneath the device: a trusted network.

If the phone cannot perform a task well enough, it may ask a stronger peer to perform that task. But routing work is not only a performance decision.

It is an authority decision.

Before data moves, the application should ask: what is inside this request, which device will receive it, what capability does that device claim, and why is it trusted?

The safest routing rule is simple:

Grade sensitivity before cost or speed.

A private journal entry should not escape to an unknown machine because that machine advertised a faster model. A public image-generation prompt may have very different routing rules.

Local-first means the user controls the boundary.

Peer-to-peer expands the hardware available inside that boundary.

It should not quietly erase it.
```

### Part 8 — Three kinds of memory

```
There is one final distinction we need before building.

AI products use the word memory for at least three different things.

First is conversation context: the messages and tokens currently visible to the model. It is temporary and limited by the context window.

Second is retrieved memory: documents, notes, or prior events stored outside the model and fetched when relevant. This is where embeddings and RAG enter the stack.

Third is learned behavior: patterns represented in model weights or an adapter created through fine-tuning.

These are not interchangeable.

Putting a fact into the prompt does not train the model.

Fine-tuning a writing style does not create a reliable document database.

Saving every conversation does not mean the model can find the right one later.

Context is what the model sees now.

Retrieval decides what it should remember now.

Training changes how it behaves.
```

### Part 9 — Follow one request through the stack

```
Let us trace one request.

The user opens a meeting assistant and asks, “What did we decide about the launch date?”

The experience captures the question.

Application logic recognizes that the answer depends on private meeting records.

The retrieval task converts the question into an embedding and searches a local workspace.

The most relevant transcript passages are returned.

The application places those passages into a grounded prompt.

A language model is loaded through the local runtime and produces an answer.

The interface streams that answer and displays the source meeting beside it.

If the phone cannot run the chosen language model, the application may delegate only the grounded completion to a trusted laptop.

Every layer has one job.

The interface did not search the vectors. The embedding model did not write the answer. The language model did not decide which device was trustworthy. The runtime did not decide whether the meeting was private.

Architecture is the art of putting each decision where it belongs.
```

### Part 10 — Keep this map

```
Here is the complete map.

Experience.

Application logic.

Intelligence task.

Model.

Runtime.

Hardware.

Device or trusted peer.

And beside that stack: context, retrieved memory, and learned behavior—three different forms of state.

When something fails, walk down the map.

Is the experience asking for the wrong thing? Did the application choose the wrong task? Is the model unsuitable? Is the runtime using the wrong backend? Does the device lack memory? Did the routing policy cross a privacy boundary?

That is how we stop treating local AI as magic.

In the next episode, we will turn this map into running code.

One task. One model. One device.

No API key.

Just the first token produced on hardware you control.
```

## Research receipts

- [QVAC introduction and execution flow](https://docs.qvac.tether.io/introduction/)
- [QVAC installation and platform support](https://docs.qvac.tether.io/installation/)
- [QVAC plugin system](https://docs.qvac.tether.io/configuration/plugins/)

