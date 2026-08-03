# Course checkpoints

This repository is teaching material with executable history. Commits use two levels:

- `step(epNN): ...` introduces one idea small enough to inspect, run, and discuss on camera.
- `checkpoint(epNN): ...` closes an episode after its acceptance commands pass.

Episode checkpoints are annotated with `epNN-complete`. Check out a tag to reproduce the code at the end of that episode:

```bash
git switch --detach ep04-complete
npm ci
npm run check
```

The commit body records the relevant verification command. Model-dependent commands distinguish a code gate from a hardware/model gate; a commit is never described as having reproduced inference unless that runtime actually passed.

## Intended progression

| Episode | Build progression | Completion gate |
|---:|---|---|
| 1 | pinned model → offline guard → worker lifecycle → streamed completion | local completion plus offline negative tests |
| 2 | placement scorecard | one capability has an explicit execution boundary |
| 3 | model descriptor inspector | pinned artifact metadata prints cleanly |
| 4 | private fixture → embedding workspace → retrieval command | `privacy audit` is retrieved |
| 5 | deterministic audio → local transcription → transcript indexing | audio becomes searchable memory |
| 6 | tool contract → approval boundary → bounded agent loop | denial writes nothing; approval writes once |
| 7 | peer validation → provider → consumer → failure policy | strict, timeout, restart, and fallback paths are visible |
| 8 | retrieval artifact → grounded generation → integrated command | answer cites evidence and admits absence |

Episodes 0, 9, and 10 are narrative, case-study, and shipping lessons. Their code checkpoints contain supporting documentation rather than invented implementation changes.

Never rewrite published checkpoint history. Corrections receive a new commit so viewers can see both the original state and the repair.
