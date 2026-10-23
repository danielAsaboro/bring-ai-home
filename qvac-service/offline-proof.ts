// Each pattern must match at least one non-empty file in the model cache.
export const REQUIRED_MODELS: Record<string, RegExp> = {
  ocr: /latin_g2/i,
  llm: /llama-3\.2-1b/i,
  embeddings: /gte-large/i,
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
      `QVAC cache is incomplete (${missing.join(", ")}). Warm it online first: run the service and use each feature once.`,
    );
  }
}

// Classify a probe to a public host. Only a refused connection counts as denial.
export function classifyProbe(result: { ok: true } | { ok: false; code: string | undefined }) {
  if (result.ok) return "network-allowed" as const;
  if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") return "dns-failed" as const;
  return "network-denied" as const;
}
