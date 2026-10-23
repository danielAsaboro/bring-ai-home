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
const { delegateModelConfig, describePlacement, parseDelegateEndpoint } = await import("./delegate.ts");

// LOOKOUT_DELEGATE=192.168.1.20:50052 hands vision tensors to a stronger
// machine on the home network. Unset, everything runs here.
const delegate = parseDelegateEndpoint(process.env.LOOKOUT_DELEGATE);

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;

// LOOKOUT_VISION=off starts the boundary without a model, to see the 503 path.
const checker = process.env.LOOKOUT_VISION === "off" ? null : createQvacChecker(appDirectory, delegateModelConfig(delegate));
const proposer = process.env.LOOKOUT_LANGUAGE === "off" ? null : createQvacProposer();
const placement = describePlacement(delegate);
const server = createLookoutServer({ checker, proposer, placement });
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Lookout QVAC service on http://127.0.0.1:${SERVICE_PORT} (vision: ${placement})\n`);
});

async function shutdown() {
  server.close();
  await proposer?.close();
  await checker?.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
