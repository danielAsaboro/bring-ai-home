// Run under sandbox-exec (macOS): propose, gate, and rank similar patterns with no network.
import { readdir, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const runtime = await import("./qvac-runtime.ts");
const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { buildProposalHistory, extractProposal } = await import("./proposal.ts");
const { checkProposal } = await import("../src/features/pattern/rule-schema.ts");
const { replayGate, samplePatterns } = await import("../src/features/pattern/patterns.ts");
const { patternText, rankSimilar } = await import("../src/features/pattern/similar.ts");

function probe() {
  return new Promise((resolve) => {
    const req = https.get("https://example.com/", { timeout: 5000 }, (res) => {
      res.resume();
      resolve({ ok: true });
    });
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    req.on("error", (error) => resolve({ ok: false, code: error.code }));
  });
}

let sdk;
const loaded = [];
try {
  const { cacheDirectory, configPath } = runtime.resolveLocalQvacPaths(appDirectory);
  const names = await readdir(cacheDirectory);
  assertWarmedCache(await Promise.all(names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size }))));

  const network = classifyProbe(await probe());
  if (network !== "network-denied") throw new Error(`Expected process network denial, got ${network}`);

  process.env.QVAC_CONFIG_PATH = configPath; // reuse the warmed config; do not rewrite it
  sdk = await import("@qvac/sdk");
  const startedAt = Date.now();
  const pattern = samplePatterns.find((p) => p.id === "p-contacts");
  const llm = await runtime.loadProposalModel(sdk);
  loaded.push(llm);
  const raw = await runtime.completeText(sdk, llm, buildProposalHistory(pattern.examples));
  let check;
  try {
    check = checkProposal(extractProposal(raw));
  } catch (error) {
    check = { ok: false, reasons: [error.message] };
  }
  const gate = check.ok ? replayGate(check.rules, pattern) : null;

  const embedder = await runtime.loadEmbeddingModel(sdk);
  loaded.push(embedder);
  const vectors = await runtime.embedTexts(sdk, embedder, samplePatterns.map(patternText));
  const similar = rankSimilar(samplePatterns, vectors, pattern.id, { limit: 3, minScore: 0 });

  process.stdout.write(
    `${JSON.stringify({ network, patternId: pattern.id, raw, check, gate, similar, elapsedMs: Date.now() - startedAt }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  for (const modelId of loaded) await sdk?.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
