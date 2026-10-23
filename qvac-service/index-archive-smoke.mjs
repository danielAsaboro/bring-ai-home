import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const indexPath = path.join(qvacDirectory, "archive-index.json");
const modelName = "GTE_LARGE_FP16";

let modelId;
let sdk;
try {
  // Node strips the TypeScript types from these two app modules.
  const { sampleArchive } = await import("../src/features/chronicle/archive.ts");
  const { buildMemoryIndex } = await import(
    "../src/features/chronicle/memory-index.ts"
  );

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify({ cacheDirectory }, null, 2)}\n`,
    "utf8",
  );
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.GTE_LARGE_FP16,
    modelType: "embeddings",
    onProgress: (p) => {
      process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`);
    },
  });
  const startedAt = Date.now();
  const index = await buildMemoryIndex(sampleArchive, modelName, async (texts) => {
    const { embedding } = await sdk.embed({ modelId, text: texts });
    return embedding;
  });
  const elapsedMs = Date.now() - startedAt;
  await writeFile(indexPath, `${JSON.stringify(index)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify(
      {
        model: index.model,
        dimensions: index.dimensions,
        memories: index.entries.length,
        elapsedMs,
        indexPath,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`QVAC index smoke failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) {
    await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  if (sdk) await sdk.close().catch(() => undefined);
}
