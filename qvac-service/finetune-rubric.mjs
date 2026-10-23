import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const adapterDirectory = path.join(qvacDirectory, "adapters/house-rubric");
const datasetDirectory = path.join(appDirectory, "qvac-service/rubric");

let sdk;
let modelId;
try {
  await mkdir(adapterDirectory, { recursive: true });
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;
  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    modelConfig: { ctx_size: 1024 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const startedAt = Date.now();
  const handle = sdk.finetune({
    modelId,
    options: {
      trainDatasetDir: path.join(datasetDirectory, "train.jsonl"),
      validation: { type: "dataset", path: path.join(datasetDirectory, "eval.jsonl") },
      outputParametersDir: adapterDirectory,
      numberOfEpochs: 3,
      learningRate: 1e-4,
      assistantLossOnly: true,
      loraRank: 8,
      loraSeed: 7,
    },
  });
  for await (const tick of handle.progressStream) {
    process.stderr.write(`epoch ${tick.current_epoch + 1} step ${tick.global_steps} ${tick.is_train ? "train" : "val"} loss ${tick.loss?.toFixed(4)}\n`);
  }
  const result = await handle.result;
  process.stdout.write(`${JSON.stringify({ model: "LLAMA_3_2_1B_INST_Q4_0", result, adapterDirectory, elapsedMs: Date.now() - startedAt }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`QVAC rubric finetune failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
