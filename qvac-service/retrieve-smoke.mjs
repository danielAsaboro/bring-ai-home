import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const indexPath = path.join(qvacDirectory, "archive-index.json");
const recollection =
  process.argv.slice(2).join(" ") ||
  "that time on the sand with the red blanket, when the kite would not go up";

let modelId;
let sdk;
try {
  const { retrieveMoments } = await import("../src/features/chronicle/retrieve.ts");
  const { sampleArchive } = await import("../src/features/chronicle/archive.ts");
  const index = JSON.parse(await readFile(indexPath, "utf8"));

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
  });
  const { embedding } = await sdk.embed({ modelId, text: recollection });
  const moments = retrieveMoments(index, embedding, { limit: 3, minScore: 0.3 });
  process.stdout.write(
    `${JSON.stringify(
      {
        recollection,
        model: index.model,
        moments: moments.map((moment) => ({
          ...moment,
          title: sampleArchive.find((m) => m.id === moment.memoryId)?.title,
        })),
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `QVAC retrieve smoke failed: ${message}\nRun npm run qvac:index-smoke first to build ${indexPath}.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) {
    await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  if (sdk) await sdk.close().catch(() => undefined);
}
