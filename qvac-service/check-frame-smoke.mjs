// Ask a local vision model whether one stored frame shows a plain-language condition.
// Usage: npm run qvac:check-smoke -- [frame.png] ["condition"]
import { createHash } from "node:crypto";
import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const { buildConditionPrompt, parseVerdict } = await import("../src/features/lookout/verdict.ts");

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const defaultFrame = path.join(appDirectory, "public/test-files/lookout/front-gate-3.png");
const framePath = path.resolve(process.argv[2] ?? defaultFrame);
const condition = process.argv[3] ?? "a parcel is left by the gate";
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const modelName = "SMOLVLM2_500M_MULTIMODAL_Q8_0";

let sdk;
let modelId;
try {
  await access(framePath);
  const prompt = buildConditionPrompt(condition);
  const frameDigest = createHash("sha256").update(await readFile(framePath)).digest("hex");

  // The SDK reads its config when it starts, so write it before the import.
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  modelId = await sdk.loadModel({
    modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
    modelConfig: { ctx_size: 1024, projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
    onProgress: (p) => process.stderr.write(`Downloading ${p.percentage.toFixed(0)}%\n`),
  });
  const startedAt = Date.now();
  const run = sdk.completion({
    modelId,
    history: [{ role: "user", content: prompt, attachments: [{ path: framePath }] }],
    stream: true,
  });
  let raw = "";
  for await (const token of run.tokenStream) raw += token;
  process.stdout.write(
    `${JSON.stringify(
      {
        kind: "proposed-verdict",
        frame: path.basename(framePath),
        frameDigest,
        condition,
        model: modelName,
        raw,
        verdict: parseVerdict(raw),
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(
    `QVAC frame check failed: ${message}\nThe first run downloads model files into ${cacheDirectory}. A stalled download is a network problem, not a code problem.\n`,
  );
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
