// Train a small LoRA adapter on your approved weaves. Everything stays on this machine.
import { mkdir, readdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const runtime = await import("./qvac-runtime.ts");
const { buildTrainingRecords, splitTrainEval, toJsonl } = await import("./finetune-data.ts");
const { samplePatterns } = await import("../src/features/pattern/patterns.ts");
const { approvedFixturePatterns } = await import("./test-data/finetune-patterns.ts");

let sdk;
let modelId;
try {
  const { qvacDirectory } = await runtime.configureLocalQvac(appDirectory);
  const dataDir = path.join(qvacDirectory, "finetune");
  const output = path.join(qvacDirectory, "lora", "pattern");
  const checkpoints = path.join(output, "checkpoints");
  await mkdir(checkpoints, { recursive: true });

  const { train, eval: held } = splitTrainEval(buildTrainingRecords([...samplePatterns, ...approvedFixturePatterns]));
  const trainPath = path.join(dataDir, "train.jsonl");
  const evalPath = path.join(dataDir, "eval.jsonl");
  await mkdir(dataDir, { recursive: true });
  await writeFile(trainPath, toJsonl(train), "utf8");
  await writeFile(evalPath, toJsonl(held), "utf8");
  process.stderr.write(`Training on ${train.length} approved weaves, validating on ${held.length}\n`);

  sdk = await import("@qvac/sdk");
  modelId = await runtime.loadTuningBase(sdk);
  const run = runtime.startLoraRun(sdk, modelId, { train: trainPath, eval: evalPath, output, checkpoints });
  for await (const tick of run.progressStream) {
    process.stderr.write(`epoch ${tick.current_epoch + 1} step ${tick.global_steps} ${tick.is_train ? "train" : "val"} loss ${tick.loss?.toFixed(4)}\n`);
  }
  const result = await run.result;
  const adapters = (await readdir(output)).filter((name) => name.endsWith(".gguf"));
  process.stdout.write(`${JSON.stringify({ kind: "lora-run", base: runtime.TUNED_BASE_MODEL, result, output, adapters }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(`LoRA fine-tune failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
