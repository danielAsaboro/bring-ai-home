import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { createDeckServer, SERVICE_PORT } = await import("./server.ts");

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
// deck gets a clear 503 instead of a hanging request while models download.
const capabilities = { retrieve: null, propose: null, embed: null, critique: null };
const server = createDeckServer(capabilities);
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Deck QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

const index = await readFile(path.join(qvacDirectory, "notes-index.json"), "utf8")
  .then((text) => JSON.parse(text))
  .catch(() => {
    process.stderr.write("No notes index yet. Run npm run qvac:ingest-notes first.\n");
    return null;
  });
const embedId = await tryLoad("Embeddings", { modelSrc: sdk?.GTE_LARGE_FP16, modelType: "embeddings" });
const embedOne = async (text) => (await sdk.embed({ modelId: embedId, text })).embedding;
if (embedId) {
  capabilities.embed = async (texts) => ({
    vectors: (await sdk.embed({ modelId: embedId, text: texts })).embedding,
    model: "GTE_LARGE_FP16",
  });
  process.stderr.write("Embeddings ready\n");
}

if (index && embedId) {
  const { searchNotes } = await import("../src/features/deck/notes-index.ts");
  capabilities.retrieve = async (query) => ({
    passages: searchNotes(index, await embedOne(query), { limit: 3, minScore: 0.3 }),
    model: "GTE_LARGE_FP16",
  });
  process.stderr.write("Note retrieval ready\n");
}

const llmId = await tryLoad("Text model", { modelSrc: sdk?.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
async function completeJson(history, name, schema) {
  const run = sdk.completion({
    modelId: llmId,
    history,
    stream: true,
    responseFormat: { type: "json_schema", json_schema: { name, schema } },
  });
  return (await run.final).contentText;
}
if (index && embedId && llmId) {
  const { searchNotes } = await import("../src/features/deck/notes-index.ts");
  const { buildProposalHistory, PROPOSAL_JSON_SCHEMA } = await import("../src/features/deck/claim-proposals.ts");
  capabilities.propose = async (request) => {
    const passages = searchNotes(index, await embedOne(request.topic), { limit: 4, minScore: 0.3 });
    // No retrieved sections means nothing to cite, so the model is not asked.
    if (passages.length === 0) return { text: "", passages, model: "LLAMA_3_2_1B_INST_Q4_0" };
    const text = await completeJson(buildProposalHistory(request, passages), "claim_cards", PROPOSAL_JSON_SCHEMA);
    return { text, passages, model: "LLAMA_3_2_1B_INST_Q4_0 + GTE_LARGE_FP16" };
  };
  process.stderr.write("Card proposals ready\n");
}

// Rubric critique uses the house-rubric LoRA adapter from qvac:finetune-rubric
// when it exists, and says so. Without it, the base model critiques.
const adapterDirectory = path.join(qvacDirectory, "adapters/house-rubric");
const adapter = await readdir(adapterDirectory)
  .then((names) => names.find((n) => n.endsWith(".gguf")))
  .catch(() => undefined);
const criticId = adapter
  ? await tryLoad("Rubric adapter", {
      modelSrc: sdk?.LLAMA_3_2_1B_INST_Q4_0,
      modelType: "llm",
      modelConfig: { lora: path.join(adapterDirectory, adapter) },
    })
  : llmId;
if (criticId) {
  const { buildCritiqueHistory, CRITIQUE_JSON_SCHEMA } = await import("../src/features/deck/house-rubric.ts");
  capabilities.critique = async (deck) => {
    const run = sdk.completion({
      modelId: criticId,
      history: buildCritiqueHistory(deck),
      stream: true,
      responseFormat: { type: "json_schema", json_schema: { name: "critique", schema: CRITIQUE_JSON_SCHEMA } },
    });
    const usingAdapter = Boolean(adapter) && criticId !== llmId;
    return {
      text: (await run.final).contentText,
      model: usingAdapter ? `LLAMA_3_2_1B_INST_Q4_0 + ${adapter}` : "LLAMA_3_2_1B_INST_Q4_0",
      adapter: usingAdapter,
    };
  };
  process.stderr.write(`Rubric critique ready (${adapter ? `adapter ${adapter}` : "base model, no adapter"})\n`);
}

async function shutdown() {
  server.close();
  for (const modelId of loaded) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
