# Episode 3 — architecture map

Map one request before changing its implementation.

| Layer | Meeting-recall implementation | Failure question |
|---|---|---|
| Experience | Ask a question and receive a cited answer | Is the interaction asking for too much at once? |
| Application | Retrieve evidence, construct context, stream an answer | Did orchestration preserve the source boundary? |
| Task | Embedding search followed by constrained completion | Is this the narrowest useful task sequence? |
| Model | EmbeddingGemma plus Llama 3.2 1B Instruct Q4_0 | Do quality and memory fit the target? |
| Runtime | QVAC embedding and llama.cpp completion workers | Did the intended backend actually load? |
| Hardware | Apple Silicon CPU/GPU and unified memory | Is pressure caused by weights, context, or concurrency? |
| Placement | Local device; explicitly paired peer is optional | Did any private context cross an unexpected boundary? |
| State | source documents, embeddings, request context | Which state is durable, derived, or disposable? |

When a run fails, name the first broken layer before proposing a fix.
