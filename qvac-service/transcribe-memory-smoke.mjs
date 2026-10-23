import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2]) {
  process.stderr.write(
    "Usage: npm run qvac:transcribe-smoke -- <path-to-your-recording.wav>\n",
  );
  process.exit(1);
}
const sourcePath = path.resolve(process.argv[2]);
const sourceName = path.basename(sourcePath);
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const modelName = "WHISPER_TINY";

let modelId;
let sdk;
try {
  await access(sourcePath);
  const sourceBytes = await readFile(sourcePath);
  const sourceDigest = createHash("sha256").update(sourceBytes).digest("hex");
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify({ cacheDirectory }, null, 2)}\n`,
    "utf8",
  );
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.WHISPER_TINY,
    modelConfig: { language: "en", translate: false, temperature: 0.0 },
    onProgress: (p) => {
      process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`);
    },
  });
  const segments = await sdk.transcribe({
    modelId,
    audioChunk: sourcePath,
    metadata: true,
  });
  const transcript = segments
    .map((segment) => segment.text.trim())
    .filter(Boolean)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
  if (!transcript) throw new Error("No speech was recognised in this recording");
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "proposed-memory",
        sourceName,
        sourceDigest,
        model: modelName,
        transcript,
        segments,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`QVAC transcribe smoke failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) {
    await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  if (sdk) await sdk.close().catch(() => undefined);
}
