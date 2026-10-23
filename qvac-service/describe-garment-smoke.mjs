import { createHash } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { resolveLocalQvacPaths, buildGarmentDescription, VISION_MODEL, DESCRIBE_GARMENT_PROMPT } =
  await import("./local-config.ts");

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = path.resolve(
  process.argv[2] ?? path.join(appDirectory, "public/garments/yellow-raincoat.png"),
);
const { cacheDirectory, configPath } = resolveLocalQvacPaths(appDirectory);

let sdk;
let modelId;
try {
  const sourceBytes = await readFile(sourcePath);
  const sourceDigest = createHash("sha256").update(sourceBytes).digest("hex");

  // The SDK reads its config at import time, so write it first.
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  const startedAt = Date.now();
  modelId = await sdk.loadModel({
    modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
    modelConfig: { ctx_size: 1024, projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const loadMs = Date.now() - startedAt;
  const run = sdk.completion({
    modelId,
    history: [{ role: "user", content: DESCRIBE_GARMENT_PROMPT, attachments: [{ path: sourcePath }] }],
    stream: true,
  });
  let rawText = "";
  for await (const token of run.tokenStream) rawText += token;
  const result = buildGarmentDescription({
    sourceName: path.basename(sourcePath),
    sourceDigest,
    model: VISION_MODEL,
    rawText,
    stats: await run.stats,
  });
  process.stdout.write(`${JSON.stringify({ ...result, loadMs }, null, 2)}\n`);
} catch (error) {
  process.stderr.write(
    `QVAC describe smoke failed: ${error instanceof Error ? error.message : String(error)}\n` +
      `The first successful run downloads model files into ${cacheDirectory}; later runs reuse that cache.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
