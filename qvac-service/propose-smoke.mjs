// Run one real local proposal for a saved sample pattern and print the raw reply.
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const patternId = process.argv[2] ?? "p-contacts";

const runtime = await import("./qvac-runtime.ts");
const { buildProposalHistory, extractProposal } = await import("./proposal.ts");
const { samplePatterns } = await import("../src/features/pattern/patterns.ts");

let sdk;
let modelId;
try {
  const pattern = samplePatterns.find((p) => p.id === patternId);
  if (!pattern) throw new Error(`No sample pattern with id ${patternId}`);
  await runtime.configureLocalQvac(appDirectory);
  sdk = await import("@qvac/sdk");
  modelId = await runtime.loadProposalModel(sdk, (pct) => process.stderr.write(`Downloading ${pct.toFixed(0)}%\n`));
  const startedAt = Date.now();
  const raw = await runtime.completeText(sdk, modelId, buildProposalHistory(pattern.examples));
  let candidate = null;
  let parseError = null;
  try {
    candidate = extractProposal(raw);
  } catch (error) {
    parseError = error instanceof Error ? error.message : String(error);
  }
  process.stdout.write(
    `${JSON.stringify(
      { kind: "proposed-weave", patternId, model: runtime.PROPOSAL_MODEL, raw, candidate, parseError, elapsedMs: Date.now() - startedAt },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`QVAC proposal smoke failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
