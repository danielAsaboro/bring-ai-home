// Pure checks for the offline proof. The runner is offline-check.mjs.

// Each pattern must match at least one non-empty file in the model cache.
export const REQUIRED_MODELS: Record<string, RegExp> = {
  transcription: /ggml-tiny\.bin$/i,
  vision: /(^|[^-])smolvlm2-500m-video-instruct-q8_0\.gguf$/i,
  projection: /mmproj-smolvlm2-500m-video-instruct-q8_0\.gguf$/i,
  llm: /llama-3\.2-1b-instruct-q4_0\.gguf$/i,
  embeddings: /gte-large_fp16\.gguf$/i,
};

export function assertWarmedCache(
  files: readonly { name: string; bytes: number }[],
  required: Record<string, RegExp> = REQUIRED_MODELS,
) {
  const missing = Object.entries(required)
    .filter(([, pattern]) => !files.some((f) => pattern.test(f.name) && f.bytes > 0))
    .map(([label]) => label);
  if (missing.length > 0) {
    throw new Error(
      `QVAC cache is incomplete (${missing.join(", ")}). Warm it online first: run the service and use every feature once.`,
    );
  }
}

export type ProbeResult = { ok: true } | { ok: false; code: string | undefined };

// A TCP connect to a public IP literal, so DNS cannot be mistaken for network denial.
// Only a refused or unreachable connection counts as proof.
export function classifyProbe(result: ProbeResult) {
  if (result.ok) return "network-allowed" as const;
  if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") return "dns-failed" as const;
  if (result.code === "ETIMEDOUT" || result.code === undefined) return "inconclusive" as const;
  return "network-denied" as const;
}
