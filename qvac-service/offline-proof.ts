// Each pattern must match at least one non-empty file in the model cache.
export const REQUIRED_MODELS: Record<string, RegExp> = {
  embeddings: /gte-large/i,
  captions: /llama-3\.2-1b/i,
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
      `QVAC cache is incomplete (${missing.join(", ")}). Warm it online with qvac:index-smoke and qvac:caption-smoke first.`,
    );
  }
}

// Classify a probe to a reachable public host. Only a refused connection counts.
export function classifyProbe(result: { ok: true } | { ok: false; code: string | undefined }) {
  if (result.ok) return "network-allowed" as const;
  if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") return "dns-failed" as const;
  return "network-denied" as const;
}
