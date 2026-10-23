import { readdir, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const receiptPath = path.join(appDirectory, "public/test-files/ledger/receipt-corner-cafe.png");

const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { draftFromOcr } = await import("../src/features/ledger/draft-transactions.ts");

function probe() {
  return new Promise((resolve) => {
    const req = https.get("https://example.com/", { timeout: 5000 }, (res) => {
      res.resume();
      resolve({ ok: true });
    });
    req.on("timeout", () => req.destroy(Object.assign(new Error("timeout"), { code: "ETIMEDOUT" })));
    req.on("error", (error) => resolve({ ok: false, code: error.code }));
  });
}

let sdk;
let modelId;
try {
  const names = await readdir(cacheDirectory, { recursive: true });
  const files = await Promise.all(
    names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })),
  );
  assertWarmedCache(files);

  const network = classifyProbe(await probe());
  if (network !== "network-denied") {
    throw new Error(`Expected the process to be denied network access, got ${network}`);
  }

  process.env.QVAC_CONFIG_PATH = configPath;
  sdk = await import("@qvac/sdk");
  const startedAt = Date.now();
  modelId = await sdk.loadModel({ modelSrc: sdk.OCR_LATIN, modelConfig: { langList: ["en"] } });
  const run = sdk.ocr({ modelId, image: receiptPath, options: { paragraph: false } });
  const blocks = await run.blocks;
  const draft = draftFromOcr({
    receiptId: "offline",
    sourceDigest: "offline-check",
    blocks: blocks.map((b) => ({ text: b.text, bbox: b.bbox ?? null, confidence: b.confidence ?? null })),
  });
  process.stdout.write(
    `${JSON.stringify(
      {
        network,
        blockCount: blocks.length,
        totalCents: draft.totalCents?.value ?? null,
        totalMatchesSubtotalPlusTax: draft.checks.totalMatchesSubtotalPlusTax,
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  const message = error instanceof Error ? error.message : String(error);
  process.stderr.write(`Offline proof failed: ${message}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
