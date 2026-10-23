import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const defaultSource = fileURLToPath(
  new URL("../public/test-files/homebook/water-heater-label.png", import.meta.url),
);
const sourcePath = path.resolve(process.argv[2] ?? defaultSource);
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

let sdk;
let modelId;
try {
  await access(sourcePath);
  const sourceDigest = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  // Node strips the TypeScript types from this app module.
  const { proposeLabelFacts } = await import("../src/features/homebook/label-facts.ts");

  // Config must exist before the SDK is imported.
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.OCR_LATIN,
    modelType: sdk.MODEL_TYPES.ggmlOcr,
    modelConfig: { langList: ["en"], magRatio: 1.5, contrastRetry: false, lowConfidenceThreshold: 0.5 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const run = sdk.ocr({ modelId, image: sourcePath, options: { paragraph: false } });
  const [blocks, stats] = await Promise.all([run.blocks, run.stats]);
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "proposed-label-facts",
        sourceName: path.basename(sourcePath),
        sourceDigest,
        model: "OCR_LATIN",
        blocks,
        facts: proposeLabelFacts(blocks),
        stats: stats ?? null,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `QVAC label OCR smoke failed: ${message}\nThe first successful run downloads OCR assets into ${cacheDirectory}; warmed runs reuse that cache.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
