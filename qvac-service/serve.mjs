import { randomUUID } from "node:crypto";
import { mkdir, readFile, rm, writeFile } from "node:fs/promises";
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
const capabilities = { label: null, identify: null, ask: null };
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

const vlmId = await tryLoad("Photo identification", {
  modelSrc: sdk?.SMOLVLM2_500M_MULTIMODAL_Q8_0,
  modelConfig: { ctx_size: 1024, projectionModelSrc: sdk?.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
});
if (vlmId) {
  const { IDENTIFY_PROMPT } = await import("../src/features/homebook/asset-identity.ts");
  const inbox = path.join(qvacDirectory, "inbox");
  await mkdir(inbox, { recursive: true });
  capabilities.identify = async (image, mimeType) => {
    // Attachments are read from a path, so the photo lives briefly in .qvac/inbox.
    const file = path.join(inbox, `${randomUUID()}.${mimeType === "image/png" ? "png" : "jpg"}`);
    await writeFile(file, image);
    try {
      const run = sdk.completion({
        modelId: vlmId,
        history: [{ role: "user", content: IDENTIFY_PROMPT, attachments: [{ path: file }] }],
        stream: true,
      });
      let text = "";
      for await (const token of run.tokenStream) text += token;
      return { text, model: "SMOLVLM2_500M_MULTIMODAL_Q8_0" };
    } finally {
      await rm(file, { force: true });
    }
  };
  process.stderr.write("Photo identification ready\n");
}

// Manual answers need the index from qvac:ingest-manuals, an embedder, and an LLM.
const index = await readFile(path.join(qvacDirectory, "manual-index.json"), "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => {
    process.stderr.write("No manual index yet. Run npm run qvac:ingest-manuals first.\n");
    return null;
  });
const embedId = index ? await tryLoad("Manual embeddings", { modelSrc: sdk?.GTE_LARGE_FP16, modelType: "embeddings" }) : null;
const llmId = index ? await tryLoad("Answer model", { modelSrc: sdk?.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" }) : null;
if (index && embedId && llmId) {
  const { searchManuals } = await import("../src/features/homebook/manual-index.ts");
  const { answerFromManuals } = await import("../src/features/homebook/cited-answer.ts");
  capabilities.ask = async (question, docIds) => {
    const result = await answerFromManuals(
      question,
      {
        embedQuery: async (text) => (await sdk.embed({ modelId: embedId, text })).embedding,
        search: (vector, ids) => searchManuals(index, vector, { limit: 3, minScore: 0.3, docIds: ids }),
        complete: async (history) => {
          const run = sdk.completion({ modelId: llmId, history, stream: true });
          let text = "";
          for await (const token of run.tokenStream) text += token;
          return text;
        },
      },
      docIds,
    );
    return { ...result, model: "LLAMA_3_2_1B_INST_Q4_0 + GTE_LARGE_FP16" };
  };
  process.stderr.write("Manual answers ready\n");
}

async function shutdown() {
  server.close();
  for (const modelId of loaded) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
