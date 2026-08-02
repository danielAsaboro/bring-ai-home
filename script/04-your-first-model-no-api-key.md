# EP 4 — Your First Model—No API Key

| Field | Value |
|---|---|
| **Episode** | 4 of 10 |
| **Title** | Your First Model—No API Key |
| **SEO title** | Run Your First Local AI Model with QVAC |
| **Runtime** | 9–12 minutes, excluding the first model download |
| **Tone** | Calm pair-programming; explain every meaningful line |
| **Primary job** | Produce a streamed local completion and prove the warm path works offline |
| **Upload name** | `Bring AI Home Ep.04 — Your First Model, No API Key` |

## Spoken script

### Part 1 — Today the machine answers

```
We have spent four videos talking about intelligence on hardware you control.

Today, the machine answers.

We are going to create a clean JavaScript project, install QVAC, load a small language model, stream a response, release the model, and then repeat the completion without a network connection.

No cloud-model account.

No vendor API key.

No hidden endpoint pretending to be local because the interface happens to run in your browser.

There is one honest caveat.

The model has to reach your machine before it can run on your machine. The first execution may download model weights, and that time depends on your connection. Once those weights are cached, the execution path can be local.

So we will treat the first download as preparation.

The real test begins after the model is here.
```

### Part 2 — Check the ground beneath us

```
I am following the official QVAC quickstart as it exists while recording this episode.

At this version, the Node path requires Node twenty-two point seventeen or newer and npm ten point nine or newer.

I will check both versions in the terminal before installing anything.

That may feel boring, but native AI dependencies punish guesswork. When a quickstart fails, verify the runtime, operating system, architecture, available disk space, and memory before changing the code.

I am using the desktop Node path because it is the shortest route to understanding the model lifecycle. QVAC also supports Bare and Expo, but mobile introduces packaging and device-specific concerns that would hide the idea we are learning today.

One environment.

One task.

One successful lifecycle.
```

### Part 3 — Create the smallest possible project

```
In the terminal, I create a directory named qvac-examples and enter it.

I initialize an npm project and set its module type to module so we can use modern JavaScript imports.

Then I install one package: at-qvac-slash-sdk.

That package is the unified development surface we described in the previous episode. The model weights are not secretly bundled inside it. QVAC will retrieve the model source we choose and cache it separately.

Our project needs one script: quickstart dot j-s.

The purpose of this file is deliberately narrow.

Load.

Complete.

Unload.

If those three stages work, we have the foundation for everything else in this course.
```

### Part 4 — Load a model

```
At the top of the file, I import four things from the SDK.

Load model.

The preconfigured Llama three point two, one-billion-parameter, instruction-tuned, Q-four model source.

Completion.

And unload model.

The model constant is not the model itself. It points QVAC toward a model published in its distributed registry.

I pass that source to load model.

During the first run, the progress callback tells us how many bytes have been downloaded and what percentage is complete. If the transfer stops, QVAC’s download lifecycle preserves partial files so the same operation can resume later.

When loading succeeds, we receive a model identifier.

That identifier represents the model currently prepared in memory. It is what later task calls use to target the correct model.
```

### Part 5 — Ask one precise question

```
Next, I create a history containing one user message:

“Explain quantum computing in one sentence.”

The wording is not important. The constraint is.

A small local model benefits from a clear task, a clear output shape, and enough context to know when it is finished.

Then I call completion with the model identifier, the history, and streaming enabled.

Completion gives us a result object containing a token stream. I iterate over that stream and write each token to standard output as it arrives.

This is the moment to understand what streaming means.

The model is not composing a finished paragraph somewhere else and downloading it at the end. Tokens become available incrementally as local inference produces them. Our application can render those tokens immediately, cancel the request, measure latency, or pass structured events into a richer interface.

Let us run it.
```

### Part 6 — Read the receipt

```
The answer is appearing in this terminal.

Now let us inspect the receipt.

There is no OpenAI key, Anthropic key, or remote inference token in this project.

The address bar is not the proof. The interface is not the proof. The model lifecycle is the proof.

QVAC loaded the model asset into a local runtime. Completion targeted the returned local model identifier. The token stream arrived from that operation.

This is a small model answering a small question. We should not confuse the emotional importance of the first local token with a claim that this model can solve every product problem.

The achievement is control.

We now possess the execution path.
```

### Part 7 — Release what you load

```
After the stream finishes, I call unload model with the model identifier.

This line is not cleanup theatre.

A loaded model occupies memory. On a development machine, forgetting to release it may be annoying. On a phone, it may determine whether the operating system kills your application.

Real products need an intentional lifecycle.

Load models when their capabilities are required.

Reuse them when repeated work justifies the memory.

Unload them when the user leaves the feature or the operating system needs resources.

Cancel work that no longer matters.

Suspend or resume appropriately when a mobile application moves into the background.

Local AI makes infrastructure part of application design.

That responsibility is the price of ownership—and the source of control.
```

### Part 8 — Prove the warm path offline

```
Now we perform the test that matters.

The model has already been downloaded and cached. I disconnect this machine from the network.

Then I run the same script with a different question.

The model loads from local storage. The completion begins. Tokens appear again.

This is the warm path: the assets are present, the runtime is available, and the essential inference operation does not depend on reaching a cloud model.

Be precise when demonstrating this.

“Works offline” does not mean the model teleported onto the device. Distribution may require a network. Updates may require a network. Optional peers may require a network.

It means that after the required assets are installed, the intelligence task itself can execute without a remote inference provider.

That is a claim we can test rather than a slogan we have to trust.
```

### Part 9 — When it does not work

```
If your first run fails, do not replace random lines until the error changes.

Classify the failure using the map from episode three.

Did npm fail to install the SDK? Check the runtime version and platform requirements.

Did the model fail to download? Check connectivity, disk space, logs, and whether the resumable download can continue.

Did the model download but fail to load? Check available memory and hardware compatibility.

Did completion run too slowly? Measure whether the device is using an accelerated backend, then consider a smaller model or a narrower task.

Did the process remain alive after the result? Confirm that the model was unloaded and the SDK lifecycle was closed appropriately.

The error belongs to a layer.

Find the layer before inventing a fix.
```

### Part 10 — The first vertical slice

```
We now have our first complete vertical slice.

A user message entered the application.

Application logic created a completion task.

QVAC loaded a model through the local runtime.

The device produced tokens.

The application streamed them to the user.

Then it released the model.

That is not yet a product. It has no durable memory, no private knowledge, no tools, no senses, and no mesh.

But it is honest.

The intelligence is running where we say it is running.

In the next episode, we will make it useful.

We will give this model access to information it was never trained on—without retraining it and without uploading the documents.

First tokens are proof of execution.

Private retrieval is where execution becomes personal.
```

## Research receipts

- [Official QVAC quickstart](https://docs.qvac.tether.io/quickstart/)
- [Installation and current requirements](https://docs.qvac.tether.io/installation/)
- [Model download lifecycle](https://docs.qvac.tether.io/models/download-lifecycle/)
- [QVAC runtime lifecycle](https://docs.qvac.tether.io/runtime/lifecycle/)

