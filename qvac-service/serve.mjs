import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { createLookoutServer, SERVICE_PORT } = await import("./server.ts");
const { createQvacChecker } = await import("./qvac-checker.ts");
const { createQvacProposer } = await import("./qvac-proposer.ts");

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;

// LOOKOUT_VISION=off starts the boundary without a model, to see the 503 path.
const checker = process.env.LOOKOUT_VISION === "off" ? null : createQvacChecker(appDirectory);
const proposer = process.env.LOOKOUT_LANGUAGE === "off" ? null : createQvacProposer();
const server = createLookoutServer({ checker, proposer });
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Lookout QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

async function shutdown() {
  server.close();
  await proposer?.close();
  await checker?.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
