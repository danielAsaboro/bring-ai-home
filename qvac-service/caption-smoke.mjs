import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const memoryId = process.argv[2] ?? "m-beach-1998";

let modelId;
let sdk;
try {
  const { sampleArchive } = await import("../src/features/chronicle/archive.ts");
  const { buildCaptionHistory, parseCaptionDraft } = await import("./caption-draft.ts");
  const memory = sampleArchive.find((m) => m.id === memoryId);
  if (!memory) throw new Error(`No memory with id ${memoryId}`);

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const run = sdk.completion({ modelId, history: buildCaptionHistory({ memory }), stream: true });
  let raw = "";
  for await (const token of run.tokenStream) raw += token;
  const stats = await run.stats;
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "proposed-caption",
        memoryId,
        currentCaption: memory.caption,
        draft: parseCaptionDraft(raw),
        model: "LLAMA_3_2_1B_INST_Q4_0",
        stats: stats ?? null,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`QVAC caption smoke failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
