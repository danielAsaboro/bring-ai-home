# Expected command behavior

Output wording from a model is nondeterministic. Gates therefore assert properties and artifacts, not a memorized sentence.

| Command | Pass evidence | Required negative case |
|---|---|---|
| `npm run check` | Exit 0, no TypeScript diagnostics | Broken type exits non-zero |
| `npm test` | All safety tests pass | Registry/URL offline input is rejected |
| `npm run ep01` | Non-empty completion; stats in `evidence/ep01.jsonl` | Registry/download timeout is logged as failure |
| `npm run ep01 -- --offline --model-file …` | Exact local size accepted; non-empty completion; `offline: true` | Missing, URL, registry, wrong-size, and wrong-checksum inputs fail before QVAC |
| `npm run ep04` | Retrieved source contains `privacy audit` | Unsupported fact is not treated as evidence |
| `npm run ep05` | Transcript non-empty, then retrievable | Missing/corrupt audio fails visibly |
| `npm run ep06` | Deny creates nothing; approve creates exactly one new note | Non-interactive execution denies; overwrite and unsafe names fail |
| `npm run ep07:consumer -- --provider …` | Strict peer completion logged | Invalid key, stopped provider, tiny timeout, deterministic restart, and fallback are separately logged |
| `npm run ep08` | Answer contains citation marker and evidence bundle | Unsupported question produces insufficiency rather than an invented fact |

JSONL evidence is append-only runtime output and intentionally ignored by Git. Sanitized validation findings belong in `VALIDATION.md`.
