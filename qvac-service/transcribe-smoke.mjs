// Standalone smoke test: one narrated recording in, one transcript out.
// Runs outside Next.js so download, native runtime, and React problems stay separate.
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
if (!process.argv[2]) {
  process.stderr.write("Usage: npm run qvac:transcribe-smoke -- <your-narration.wav>\n");
  process.exit(1);
}
const sourcePath = path.resolve(process.argv[2]);
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { toNarration } = await import("../src/features/replay/narration.ts");

let sdk;
let modelId;
try {
  await access(sourcePath);
  const sourceDigest = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  const loadStarted = Date.now();
  modelId = await sdk.loadModel({
    modelSrc: sdk.WHISPER_TINY,
    modelConfig: { language: "en", translate: false, temperature: 0.0 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const loadMs = Date.now() - loadStarted;
  const started = Date.now();
  const segments = await sdk.transcribe({ modelId, audioChunk: sourcePath, metadata: true });
  const narration = toNarration(segments);
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "narration-evidence",
        sourceName: path.basename(sourcePath),
        sourceDigest,
        model: "WHISPER_TINY",
        loadMs,
        transcribeMs: Date.now() - started,
        ...narration,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `QVAC transcribe smoke failed: ${message}\nThe first run downloads WHISPER_TINY into ${cacheDirectory}.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
