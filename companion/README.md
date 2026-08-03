# Bring AI Home companion

One cumulative, version-pinned TypeScript application for the practical course episodes.

## Baseline

- Node `24.15.0`
- npm `11.12.1`
- `@qvac/sdk@0.16.0`

Install with `npm ci`. The lockfile is authoritative.

## Learn through Git history

Every `step(epNN)` commit introduces one bounded idea. Every `checkpoint(epNN)` commit closes an episode, and its annotated `epNN-complete` tag identifies the exact code shown at the end of that lesson.

```bash
git log --reverse --oneline
git show 474988a
git switch --detach ep05-complete
npm ci
npm run check
```

Use `git diff ep04-complete..ep05-complete` to see only the capability added by Episode 5. See [CHECKPOINTS.md](CHECKPOINTS.md) for the progression and commit contract.

## Evidence convention

Model-dependent commands write JSONL records under `evidence/`. First-run model downloads require network access. `ep01 --offline` rejects registry and URL inputs, requires an explicit local GGUF, and verifies its exact pinned byte size before QVAC starts. Add `--verify-checksum` for a full SHA-256 integrity pass.

On macOS, create the fictional meeting fixture with `npm run fixture:audio`. It says only the Project Hearth sentence used in this course.

## Episode commands

| Episode | Command | Result |
|---:|---|---|
| 1 | `npm run ep01` | Prepare and stream one local completion |
| 1 offline | `npm run ep01 -- --offline --model-file /absolute/model.gguf` | Use only an explicit local file; no registry fallback |
| 3 | `npm run ep03` | Inspect the pinned model descriptor |
| 4 | `npm run ep04` | Ingest and query the launch brief |
| 5 | `npm run ep05` | Convert a sensory fixture into retrievable text |
| 6 | `npm run ep06` | Run one validated, approval-gated tool loop |
| 7 | `npm run ep07:provider` / `npm run ep07:consumer -- --provider <key>` | Delegate inference between peers |
| 8 | `npm run ep08` | Run the integrated assistant slice |

Each command is an acceptance target with an implementation, expected output, negative path, and evidence capture. Hardware-dependent limits remain explicit in the validation ledger.

See [EXPECTED.md](EXPECTED.md) for pass/fail patterns and [VALIDATION.md](VALIDATION.md) for the verified status of this checkout.

To forbid registry lookup for memory lessons, set `COURSE_EMBEDDING_MODEL_FILE` to an absolute, complete EmbeddingGemma GGUF. The companion rejects URL/registry overrides and wrong-size files.

To forbid registry lookup in Episodes 6–8, set `COURSE_MODEL_FILE` to the absolute Llama GGUF.
Set `COURSE_DEVICE=cpu` to test a CPU fallback explicitly; the default is `gpu`.
