import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const defaultSource = fileURLToPath(new URL("../public/test-files/homebook/utility-room-heater.png", import.meta.url));
const sourcePath = path.resolve(process.argv[2] ?? defaultSource);
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

let sdk;
let modelId;
try {
  await access(sourcePath);
  const sourceDigest = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  const { IDENTIFY_PROMPT, parseAssetIdentity } = await import("../src/features/homebook/asset-identity.ts");
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
    modelConfig: { ctx_size: 1024, projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const run = sdk.completion({
    modelId,
    history: [{ role: "user", content: IDENTIFY_PROMPT, attachments: [{ path: sourcePath }] }],
    stream: true,
  });
  let text = "";
  for await (const token of run.tokenStream) text += token;
  process.stdout.write(
    `${JSON.stringify(
      {
        sourceName: path.basename(sourcePath),
        sourceDigest,
        model: "SMOLVLM2_500M_MULTIMODAL_Q8_0",
        identity: parseAssetIdentity(text),
        stats: (await run.stats) ?? null,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`QVAC identify smoke failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
