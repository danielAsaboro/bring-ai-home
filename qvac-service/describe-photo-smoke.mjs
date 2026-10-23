import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const defaultSource = fileURLToPath(
  new URL("../public/test-files/chronicle/beach-picnic.png", import.meta.url),
);
const sourcePath = path.resolve(process.argv[2] ?? defaultSource);
const sourceName = path.basename(sourcePath);
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const modelName = "SMOLVLM2_500M_MULTIMODAL_Q8_0";

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
    modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
    modelConfig: {
      ctx_size: 1024,
      projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
    },
    onProgress: (p) => {
      process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`);
    },
  });
  const run = sdk.completion({
    modelId,
    history: [
      {
        role: "user",
        content:
          "Describe this family photo in one plain sentence. Mention only what is visible.",
        attachments: [{ path: sourcePath }],
      },
    ],
    stream: true,
  });
  let text = "";
  for await (const token of run.tokenStream) text += token;
  const stats = await run.stats;
  const description = text.replace(/\s+/g, " ").trim();
  if (!description) throw new Error("The model returned an empty description");
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "proposed-description",
        sourceName,
        sourceDigest,
        model: modelName,
        description,
        stats: stats ?? null,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `QVAC describe smoke failed: ${message}\nThe first successful run downloads model assets into ${cacheDirectory}; warmed runs reuse that local cache.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) {
    await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  if (sdk) await sdk.close().catch(() => undefined);
}
