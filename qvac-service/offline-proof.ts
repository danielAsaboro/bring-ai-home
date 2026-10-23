// Each pattern must match at least one non-empty file in the model cache.
// The OCR names were observed in .qvac/models; the others follow the model names.
export const REQUIRED_MODELS: Record<string, RegExp> = {
  "label OCR recogniser": /latin_g2/i,
  "label OCR detector": /craft/i,
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
      `QVAC cache is incomplete (${missing.join(", ")}). Warm it online with qvac:label-smoke and qvac:ingest-manuals first.`,
    );
  }
}

// Classify a probe to a public IP address. A literal IP avoids DNS, so a
// resolver failure cannot be mistaken for denied network access.
export function classifyProbe(result: { ok: true } | { ok: false; code: string | undefined }) {
  if (result.ok) return "network-allowed" as const;
  if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") return "dns-failed" as const;
  return "network-denied" as const;
}
