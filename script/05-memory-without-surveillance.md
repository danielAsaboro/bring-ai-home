# EP 5 — Memory Without Surveillance

| Field | Value |
|---|---|
| **Episode** | 5 of 10 |
| **Title** | Memory Without Surveillance |
| **SEO title** | Build Private Local RAG with QVAC |
| **Runtime** | 10–13 minutes |
| **Tone** | Practical, precise, trust-focused |
| **Primary job** | Turn the first local completion into grounded answers over private documents |
| **Upload name** | `Bring AI Home Ep.05 — Memory Without Surveillance` |

## Spoken script

### Part 1 — A model that knows nothing about you

```
Our local model can generate language.

It still knows nothing about us.

It has not read our notes, our project decisions, our company handbook, or the transcript from yesterday’s meeting.

We could paste one document into every prompt. That works until the documents become numerous, long, frequently updated, or too private to move casually between systems.

We could fine-tune the model. That may change its behavior or teach a stable pattern, but it is an awkward database. Correcting one fact should not require another training run.

What we need is memory that remains outside the model.

Memory we can inspect.

Memory we can update.

Memory we can delete.

And memory that never has to leave the user’s hardware in order to become useful.

That is the job of retrieval-augmented generation: RAG.
```

### Part 2 — Retrieval before generation

```
The name sounds more complicated than the idea.

Before the model generates an answer, the application retrieves relevant evidence.

That evidence is placed inside the model’s current context. The model answers using what it was given.

Retrieval augmented generation.

The important word is retrieval.

The language model does not search your hard drive through intuition. Your application must find the relevant passages and provide them.

This creates a useful separation of responsibilities.

The retrieval system answers: “Which pieces of stored information are most relevant to this question?”

The language model answers: “Given this evidence, how should I explain the result?”

When those responsibilities are confused, we get fluent guesses.

When they are separated, we can inspect the evidence before trusting the answer.
```

### Part 3 — Fine-tuning is not factual memory

```
Use fine-tuning when you need to change how a model behaves: its style, format, vocabulary, or performance on a stable repeated task.

Use retrieval when you need to change what information is available: policies, notes, manuals, messages, records, or documents that evolve.

If the company changes its leave policy on Monday, a retrieval system can replace or re-ingest the relevant document.

A fine-tuned model would require another training process—and might still reproduce the old answer hidden in its weights.

Fine-tuning can make a model better at reading legal language.

Retrieval gives it the contract currently under review.

Fine-tuning can teach a support-response format.

Retrieval gives it the latest product manual.

Training creates learned behavior.

Retrieval supplies current evidence.

Most serious systems eventually use both. Today, we are building the evidence path.
```

### Part 4 — Turn meaning into coordinates

```
To retrieve by meaning, we need embeddings.

An embedding model converts text into a list of numbers—a vector—that represents useful semantic features of the text.

Passages with related meaning tend to land closer together in that vector space, even when they do not share the exact same words.

Suppose one document says, “The release moved to the first Monday in October.”

The user asks, “When are we launching?”

A keyword search may miss the connection between release and launching.

An embedding search can recognize that the ideas are related.

We embed the stored passages once.

At question time, we embed the question using the same embedding model.

Then we compare the question vector with the stored vectors and return the nearest matches.

Embeddings do not answer the question.

They help us find the text that can.
```

### Part 5 — Chunking decides what can be found

```
Before embedding a long document, we usually divide it into chunks.

Chunking is not administrative cleanup. It determines the unit of memory the system can retrieve.

If chunks are too large, a relevant sentence arrives surrounded by noise and consumes valuable context.

If chunks are too small, the retrieved passage may lose the heading, definition, or neighboring sentence that gives it meaning.

A good chunk should be independently understandable while remaining narrow enough to retrieve precisely.

Preserve useful structure when possible: headings, paragraphs, document names, dates, and section boundaries.

Do not assume one character count works for meeting transcripts, contracts, source code, and tables.

Chunking is a product decision informed by the documents and the questions users will ask.

The quality of RAG is often decided before the model sees the prompt.
```

### Part 6 — Build the local workspace

```
QVAC provides a built-in vector-store path so we do not need to install a separate database for our first RAG system.

We begin by loading an embedding model. The current documentation uses the preconfigured GTE Large model source.

Then we create a named workspace for our documents.

We pass the embedding model identifier, the workspace name, and our document text into rag ingest.

QVAC embeds the documents and persists their vectors in that workspace.

The workspace name matters because memory needs boundaries.

A personal journal should not share a search space with public documentation merely because both belong to the same application.

Separate workspaces can represent users, projects, security domains, or retention policies.

Local storage solves the question of where the vectors live.

It does not solve who should be allowed to search them.

Access control remains our application’s responsibility.
```

### Part 7 — Search is not yet RAG

```
Now we call rag search with the embedding model, the workspace, the user’s question, and the number of results we want returned.

The search produces ranked passages containing an identifier, content, and similarity score.

At this moment, we have retrieval.

We do not yet have retrieval-augmented generation.

To complete the pipeline, the application constructs a prompt containing the retrieved passages and clear instructions:

Answer using only the supplied context.

If the context does not contain the answer, say that the answer was not found.

Identify which passage supports each important claim.

Then we send that grounded history to the language model through completion.

Retrieval chooses the evidence.

Prompt construction establishes the rules.

Completion produces the explanation.
```

### Part 8 — Ask a question only the documents can answer

```
Our demo workspace contains a small fictional project archive.

One meeting note says the launch moved from September twenty-eighth to October fifth because the mobile audit needs another week.

I ask: “When is the launch, and why did it move?”

The query is embedded locally.

Rag search returns the meeting passage.

The application places that passage into the prompt.

The local language model answers: October fifth, because the mobile audit requires another week.

Beside the answer, we display the source document and the retrieved passage.

The citation is not decoration.

It allows the user to distinguish something the system found from something the model merely said.

In grounded products, the evidence should be easier to inspect than the prose is to believe.
```

### Part 9 — Test the absence of knowledge

```
Now I ask: “What catering company did we choose for the launch?”

That information does not exist in the workspace.

This is the more important test.

A weak RAG demo celebrates a correct answer when retrieval succeeds.

A trustworthy RAG product also behaves correctly when retrieval fails.

An empty or low-quality result should not be converted into confident fiction.

The application can refuse, ask the user to clarify, or say that no supporting passage was found.

Do not copy a similarity threshold from somebody else’s tutorial and treat it as universal truth. Scores vary with the embedding model, documents, chunking, and index.

Build an evaluation set containing answerable questions, unanswerable questions, ambiguous questions, and questions whose answer changed over time.

Retrieval quality must be measured against your corpus.
```

### Part 10 — Updates, deletion, and trust

```
Memory is not trustworthy merely because it is local.

Users need to know what was stored, where it came from, when it changed, and how to remove it.

QVAC’s managed RAG surface includes operations for reindexing, deleting embeddings, listing workspaces, closing workspaces, and deleting workspace data.

Those lifecycle operations belong in the product, not only in an administrator’s script.

If a user deletes a note, its chunks and embeddings should not remain as invisible semantic residue.

If a policy changes, the old version should not silently outrank the new one.

If two people use the same device, their workspaces should not leak into each other.

Privacy is not only preventing data from reaching the cloud.

Privacy is giving the user legible control over the memory that remains.
```

### Part 11 — The complete private-memory path

```
We now have a system that can know something personal without baking that information into model weights and without sending the documents to a cloud model.

Documents enter a controlled workspace.

Chunks become embeddings.

The vectors and source text persist locally.

A question becomes an embedding.

Similarity search retrieves relevant passages.

Those passages enter the model’s current context.

The local model produces an answer.

The application shows the evidence.

And when the evidence is absent, the system knows how to say, “I don’t know.”

That is memory without surveillance.

In the next episode, we will expand what can enter this memory.

Not only typed documents.

Voice. Images. Screenshots. Printed pages. The world as the user encounters it.

We have given the system memory.

Next, we give it senses.
```

## Research receipts

- [QVAC RAG overview and managed workspace example](https://docs.qvac.tether.io/ai-capabilities/rag/)
- [QVAC text embeddings](https://docs.qvac.tether.io/ai-capabilities/text-embeddings/)
- [QVAC API summary](https://docs.qvac.tether.io/reference/api/)
- [QVAC fine-tuning](https://docs.qvac.tether.io/ai-capabilities/fine-tuning/)
