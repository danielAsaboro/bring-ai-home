// Run this on the stronger machine (for example a Mac on the same home network).
// Usage: npm run qvac:rpc-host -- <this-machine-private-ipv4> [port]
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { createInterface } from "node:readline/promises";
import { fileURLToPath } from "node:url";

const { parseDelegateEndpoint } = await import("./delegate.ts");

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const configPath = path.join(qvacDirectory, "rpc-host-config.json");

let sdk;
let serverId;
try {
  const host = process.argv[2];
  const port = Number(process.argv[3] ?? 50052);
  // Same rule as the client: private IPv4 only.
  parseDelegateEndpoint(`${host}:${port}`);

  // The SDK's rpc-server example registers the RPC provider in the worker config.
  await mkdir(qvacDirectory, { recursive: true });
  await writeFile(
    configPath,
    `${JSON.stringify({ rpcServerProvider: "@qvac/sdk/ggml-rpc-server/provider" }, null, 2)}\n`,
  );
  process.env.QVAC_CONFIG_PATH = configPath;

  sdk = await import("@qvac/sdk");
  const server = await sdk.startRpcServer({ host, port, allowNonLoopbackHost: true });
  serverId = server.serverId;
  process.stderr.write(`Serving ggml RPC at ${server.url}. Set LOOKOUT_DELEGATE=${server.url} on the Lookout machine.\n`);
  const input = createInterface({ input: process.stdin, output: process.stderr });
  await input.question("Press Enter to stop after Lookout unloads its model.\n");
  input.close();
} catch (error) {
  process.stderr.write(`RPC host failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  if (sdk && serverId) await sdk.stopRpcServer({ serverId }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
}
