import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { createCaptionServer, SERVICE_PORT } = await import("./server.ts");
const { buildCaptionHistory, parseCaptionDraft } = await import("./caption-draft.ts");

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;

let sdk;
let modelId;
let drafter = null;
try {
  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({ modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
  drafter = async (memory) => {
    const run = sdk.completion({ modelId, history: buildCaptionHistory({ memory }), stream: true });
    let raw = "";
    for await (const token of run.tokenStream) raw += token;
    return { draft: parseCaptionDraft(raw), model: "LLAMA_3_2_1B_INST_Q4_0" };
  };
} catch (error) {
  process.stderr.write(
    `Caption model unavailable: ${error instanceof Error ? error.message : String(error)}\n` +
      "The service will answer 503 and Chronicle keeps working manually.\n",
  );
}

const server = createCaptionServer({ drafter });
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Chronicle QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

async function shutdown() {
  server.close();
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
