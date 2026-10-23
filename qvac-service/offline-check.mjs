// Run under the sandbox: npm run qvac:offline (macOS).
// Proves three things in one process: the public network is refused, the model
// cache is warm, and a stored frame is still checked locally.
import { createHash } from "node:crypto";
import { readdir, readFile, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const framePath = path.join(appDirectory, "public/test-files/lookout/front-gate-3.png");

const { assertNoDelegate, assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { PARCEL_CONDITION } = await import("../src/features/lookout/measure.ts");
const { buildConditionPrompt, parseVerdict } = await import("../src/features/lookout/verdict.ts");
const { createQvacChecker } = await import("./qvac-checker.ts");

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

let checker;
try {
  assertNoDelegate(process.env.LOOKOUT_DELEGATE);
  const names = await readdir(cacheDirectory);
  const files = await Promise.all(
    names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })),
  );
  assertWarmedCache(files);

  const network = classifyProbe(await probe());
  if (network !== "network-denied") throw new Error(`Expected network-denied, got ${network}`);

  process.env.QVAC_CONFIG_PATH = configPath;
  checker = createQvacChecker(appDirectory);
  const png = await readFile(framePath);
  const startedAt = Date.now();
  const raw = await checker.check(png, buildConditionPrompt(PARCEL_CONDITION));
  process.stdout.write(
    `${JSON.stringify(
      {
        network,
        frame: path.basename(framePath),
        frameDigest: createHash("sha256").update(png).digest("hex"),
        condition: PARCEL_CONDITION,
        model: checker.model,
        verdict: parseVerdict(raw),
        elapsedMs: Date.now() - startedAt,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await checker?.close();
}
