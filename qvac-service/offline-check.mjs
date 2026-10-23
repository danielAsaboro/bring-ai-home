import { readdir, readFile, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const labelPath = path.join(appDirectory, "public/test-files/homebook/water-heater-label.png");
const question = "How often should I flush the water heater?";

const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { proposeLabelFacts } = await import("../src/features/homebook/label-facts.ts");
const { searchManuals } = await import("../src/features/homebook/manual-index.ts");

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

  // 2. Prove the models are already on disk.
  const names = await readdir(cacheDirectory).catch(() => []);
  const files = await Promise.all(
    names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })),
  );
  assertWarmedCache(files);
  const index = JSON.parse(await readFile(path.join(qvacDirectory, "manual-index.json"), "utf8"));

  // 3. Run OCR and retrieval with the network denied.
  process.env.QVAC_CONFIG_PATH = configPath;
  sdk = await import("@qvac/sdk");
  const startedAt = Date.now();
  const ocrId = await sdk.loadModel({
    modelSrc: sdk.OCR_LATIN,
    modelType: sdk.MODEL_TYPES.ggmlOcr,
    modelConfig: { langList: ["en"], magRatio: 1.5, contrastRetry: false, lowConfidenceThreshold: 0.5 },
  });
  loaded.push(ocrId);
  const blocks = await sdk.ocr({ modelId: ocrId, image: labelPath, options: { paragraph: false } }).blocks;
  const embedId = await sdk.loadModel({ modelSrc: sdk.GTE_LARGE_FP16, modelType: "embeddings" });
  loaded.push(embedId);
  const { embedding } = await sdk.embed({ modelId: embedId, text: question });
  const pages = searchManuals(index, embedding, { limit: 2, minScore: 0.3 }).map(({ title, page, score }) => ({ title, page, score }));
  process.stdout.write(
    `${JSON.stringify({ network, labelFacts: proposeLabelFacts(blocks), question, pages, elapsedMs: Date.now() - startedAt }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  for (const modelId of loaded) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
