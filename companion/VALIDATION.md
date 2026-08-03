# Validation ledger

Last updated: 2026-08-03, macOS arm64.

| Surface | Status | Evidence |
|---|---|---|
| Dependency graph | Verified | `npm ci --ignore-scripts` installed 188 dependency packages from the lockfile; `npm ls --depth=0` reports the five exact direct pins cleanly |
| TypeScript | Verified | `npm run check` exits 0 |
| Pure safety tests | Verified | Nine tests pass: approval policy, read/write boundaries, safe filenames, exclusive writes, argument validation, provider-key/timeout validation, and offline source rejection |
| Model descriptor | Verified | `npm run ep03` prints 1B, Q4_0, 773,025,824 bytes, and pinned checksum |
| QVAC core + LLM worker RPC | Verified | Instrumented LLM-only worker connects to a local IPC socket |
| Offline artifact path | Verified | An explicit local regular file on the recording machine matched the pinned 773,025,824-byte size; its machine-specific absolute path is intentionally not published |
| Offline completion | Verified | Explicit 773,025,824-byte local GGUF, explicit LLM worker, CPU placement, no `downloadAsset` or registry descriptor; non-empty completion returned and `offline: true` evidence was written. Initial external-volume loads were slow; a `no_mmap` attempt exposed an SDK/backend mismatch and was removed |
| Full SHA-256 pass | Not yet verified | External-volume read stalled; checksum remains the SDK registry expectation, not a fresh measurement |
| Embedding worker and RAG | Verified | Exact local 277,852,192-byte EmbeddingGemma file; Episode 4 ingested one chunk and retrieved the passage containing `privacy audit` |
| Assistant retrieval stage | Verified | Episode 8 retrieved one local passage and wrote `workspace/retrieval.json` |
| Audio fixture | Verified | `npm run fixture:audio` creates a 16 kHz, mono, 16-bit PCM WAV containing only the fictional course sentence |
| Speech-to-memory | Verified | Separate 43,537,433-byte Whisper Tiny preparation download completed; fictional WAV transcribed non-empty (`Project Hareth` substitution retained as quality evidence), then indexed and retrieved |
| Agent loop | Verified for denial path | Local model produced schema-valid `save_note` JSON; non-interactive policy denied it and wrote nothing. Interactive approval path is covered by exclusive-write tests but still needs recording-day capture |
| Grounded assistant | Verified | Local retrieval produced one source; local Llama answer cited `[1]` and evidence was retained |
| Delegation loopback | Verified | Strict provider completion succeeded; stopped-provider strict mode timed out at 2 seconds; explicit fallback succeeded; deterministic seed reproduced the same provider key across restart and a new strict consumer succeeded |
| Two-physical-device run | Not yet verified | The same provider/consumer commands and matrix must be repeated on two recording devices before filming claims about cross-device behavior |
| Repository hygiene | Verified | Final `git diff --check` passes; generated worker bundles, runtime evidence, workspaces, and dependencies are ignored; no companion QVAC provider or worker process remains running |

No failed item may be described in a recording as demonstrated. Record only after replacing its row with a dated pass and retaining sanitized evidence.
