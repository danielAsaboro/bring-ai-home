import { readdir, stat } from "node:fs/promises";
import https from "node:https";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const { resolveLocalQvacPaths } = await import("./local-config.ts");
const { createQvacEngine } = await import("./qvac-engine.ts");
const { sampleCloset } = await import("../src/features/closet/sample-closet.ts");
const { buildOutfitConstraints, validateOutfitProposal } = await import("../src/features/closet/outfit-proposal.ts");
const { lookText, rankLooks } = await import("../src/features/closet/look-search.ts");

const { cacheDirectory } = resolveLocalQvacPaths(appDirectory);
const occasion = "rainy work day";

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

let engine;
try {
  const names = await readdir(cacheDirectory).catch(() => []);
  const files = await Promise.all(
    names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })),
  );
  assertWarmedCache(files);

  const network = classifyProbe(await probe());
  if (network !== "network-denied") {
    throw new Error(`Expected this process to be denied network access, got ${network}`);
  }

  engine = await createQvacEngine(appDirectory);
  const closet = sampleCloset();
  const startedAt = Date.now();

  const texts = closet.looks.map((look) => lookText(look, closet.garments));
  const { embeddings } = await engine.embed([occasion, ...texts]);
  const [queryVector, ...lookVectors] = embeddings;
  const looks = rankLooks(closet.looks.map((l) => l.id), lookVectors, queryVector);

  const constraints = buildOutfitConstraints(closet, occasion);
  const { raw, model } = await engine.outfit(constraints);
  const outfit = validateOutfitProposal(raw, constraints);

  process.stdout.write(
    `${JSON.stringify({ network, occasion, looks, outfit: { model, ...outfit }, elapsedMs: Date.now() - startedAt }, null, 2)}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (engine) await engine.close();
}
