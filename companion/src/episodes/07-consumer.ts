import { hasFlag, option } from "../lib/args.js";
import { validateDelegationTimeout, validateProviderPublicKey } from "../lib/delegation.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { loadCourseModel, runCompletion, shutdownModel } from "../lib/llm.js";

const rawProviderPublicKey = option("--provider") ?? process.argv[2];
if (!rawProviderPublicKey || rawProviderPublicKey.startsWith("--")) {
  throw new Error("Usage: npm run ep07:consumer -- --provider <provider-public-key> [--fallback] [--timeout 60000]");
}
const providerPublicKey = validateProviderPublicKey(rawProviderPublicKey);
const fallback = hasFlag("--fallback");
const timeoutMs = validateDelegationTimeout(option("--timeout") ?? "60000");
let modelId: string | undefined;

try {
  const started = Date.now();
  modelId = await loadCourseModel({ providerPublicKey, fallbackToLocal: fallback, timeoutMs });
  const final = await runCompletion(modelId, [{ role: "user", content: "Reply: peer inference reached." }]);
  const elapsedMs = Date.now() - started;
  if (!final.contentText.trim()) throw new Error("Peer completion was empty");
  await recordEvidence(7, "consumer-completion", "verified", {
    providerPublicKey,
    fallback,
    timeoutMs,
    elapsedMs,
    output: final.contentText,
    stats: final.stats,
  });
  console.log(`\nPASS in ${elapsedMs}ms. fallback=${fallback}`);
} catch (error) {
  await recordEvidence(7, "consumer-failed", "verified", {
    providerPublicKey,
    fallback,
    timeoutMs,
    error: errorMessage(error),
  });
  throw error;
} finally {
  await shutdownModel(modelId);
}
