// Pure checks for the offline proof. Tested with hand-written inputs.

// Each pattern must match at least one non-empty file in the model cache.
export const REQUIRED_MODELS: Record<string, RegExp> = {
  vision: /smolvlm2/i,
  projection: /mmproj/i,
};

export function assertWarmedCache(
  files: readonly { name: string; bytes: number }[],
  required: Record<string, RegExp> = REQUIRED_MODELS,
) {
  const missing = Object.entries(required)
    .filter(([, pattern]) => !files.some((f) => pattern.test(f.name) && f.bytes > 0))
    .map(([label]) => label);
  if (missing.length > 0) {
    throw new Error(`QVAC cache is incomplete (${missing.join(", ")}). Warm it online with qvac:check-smoke first.`);
  }
}

// Classify a probe to a public host. Only a refused connection counts as proof.
export function classifyProbe(result: { ok: true } | { ok: false; code: string | undefined }) {
  if (result.ok) return "network-allowed" as const;
  if (result.code === "ENOTFOUND" || result.code === "EAI_AGAIN") return "dns-failed" as const;
  return "network-denied" as const;
}

// The offline proof runs vision on this machine only. A delegate would need
// LAN access, which the sandbox denies on purpose.
export function assertNoDelegate(value: string | undefined) {
  if (value) throw new Error("Unset LOOKOUT_DELEGATE: the offline proof keeps inference on this machine");
}
