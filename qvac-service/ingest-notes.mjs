import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const indexPath = path.join(qvacDirectory, "notes-index.json");
const notesDirectory = path.join(appDirectory, "public/test-files/deck");

let sdk;
let modelId;
try {
  const { SAMPLE_NOTES, buildNotesIndex, chunkNote } = await import("../src/features/deck/notes-index.ts");
  const chunks = [];
  for (const note of SAMPLE_NOTES) {
    chunks.push(...chunkNote(note, await readFile(path.join(notesDirectory, note.file), "utf8")));
  }

  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;
  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.GTE_LARGE_FP16,
    modelType: "embeddings",
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const startedAt = Date.now();
  const index = await buildNotesIndex(chunks, "GTE_LARGE_FP16", async (texts) => {
    const { embedding } = await sdk.embed({ modelId, text: texts });
    return embedding;
  });
  await writeFile(indexPath, `${JSON.stringify(index)}\n`, "utf8");
  process.stdout.write(
    `${JSON.stringify(
      { model: index.model, dimensions: index.dimensions, notes: SAMPLE_NOTES.length, chunks: index.entries.length, elapsedMs: Date.now() - startedAt, indexPath },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`QVAC notes ingest failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
