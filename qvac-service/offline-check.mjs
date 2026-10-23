import { readdir, readFile, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const topic = "Why buyers should stock a kettle that shows temperature";

const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { searchNotes } = await import("../src/features/deck/notes-index.ts");
const { buildProposalHistory, parseClaimProposals, PROPOSAL_JSON_SCHEMA } = await import("../src/features/deck/claim-proposals.ts");

function probe() {
  return new Promise((resolve) => {
    const req = https.get("https://1.1.1.1/", { timeout: 5000 }, (res) => {
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
  // 1. Prove the process itself cannot reach the internet.
  const network = classifyProbe(await probe());
  process.stderr.write(`Network probe: ${network}\n`);
  if (network !== "network-denied") throw new Error(`Expected network-denied, got ${network}`);

  // 2. Prove the models and the notes index are already on disk.
  const names = await readdir(cacheDirectory).catch(() => []);
  const files = await Promise.all(names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })));
  assertWarmedCache(files);
  const index = JSON.parse(await readFile(path.join(qvacDirectory, "notes-index.json"), "utf8"));

  // 3. Retrieve and propose cited cards with the network denied.
  process.env.QVAC_CONFIG_PATH = configPath;
  sdk = await import("@qvac/sdk");
  const startedAt = Date.now();
  const embedId = await sdk.loadModel({ modelSrc: sdk.GTE_LARGE_FP16, modelType: "embeddings" });
  loaded.push(embedId);
  const { embedding } = await sdk.embed({ modelId: embedId, text: topic });
  const passages = searchNotes(index, embedding, { limit: 4, minScore: 0.3 });
  const llmId = await sdk.loadModel({ modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
  loaded.push(llmId);
  const run = sdk.completion({
    modelId: llmId,
    history: buildProposalHistory({ topic, audience: "Retail partners" }, passages),
    stream: true,
    responseFormat: { type: "json_schema", json_schema: { name: "claim_cards", schema: PROPOSAL_JSON_SCHEMA } },
  });
  const result = parseClaimProposals((await run.final).contentText, passages);
  process.stdout.write(
    `${JSON.stringify({ network, topic, passages: passages.map(({ id, score }) => ({ id, score })), ...result, elapsedMs: Date.now() - startedAt }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  for (const modelId of loaded) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
