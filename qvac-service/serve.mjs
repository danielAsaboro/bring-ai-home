import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { createHomebookServer, SERVICE_PORT } = await import("./server.ts");

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;

const loaded = [];
let sdk = null;
try {
  sdk = await import("@qvac/sdk");
} catch (error) {
  process.stderr.write(`QVAC SDK unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
}

// Load one model, or report why not and leave that capability off.
async function tryLoad(label, options) {
  if (!sdk) return null;
  try {
    const modelId = await sdk.loadModel(options);
    loaded.push(modelId);
    return modelId;
  } catch (error) {
    process.stderr.write(`${label} unavailable: ${error instanceof Error ? error.message : String(error)}\n`);
    return null;
  }
}

// Listen first. Each capability switches on when its model has loaded, so the
// binder gets a clear 503 instead of a hanging request while models download.
const capabilities = { label: null };
const server = createHomebookServer(capabilities);
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Homebook QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

const ocrId = await tryLoad("Label OCR", {
  modelSrc: sdk?.OCR_LATIN,
  modelType: sdk?.MODEL_TYPES.ggmlOcr,
  modelConfig: { langList: ["en"], magRatio: 1.5, contrastRetry: false, lowConfidenceThreshold: 0.5 },
});
if (ocrId) {
  capabilities.label = async (image) => {
    const run = sdk.ocr({ modelId: ocrId, image, options: { paragraph: false } });
    return { blocks: await run.blocks, model: "OCR_LATIN" };
  };
  process.stderr.write("Label OCR ready\n");
}

async function shutdown() {
  server.close();
  for (const modelId of loaded) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
