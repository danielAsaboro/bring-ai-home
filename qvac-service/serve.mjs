import { fileURLToPath } from "node:url";

const { createClosetServer, SERVICE_PORT } = await import("./server.ts");
const { createQvacEngine } = await import("./qvac-engine.ts");

const appDirectory = fileURLToPath(new URL("../", import.meta.url));

let engine = {};
try {
  engine = await createQvacEngine(appDirectory);
} catch (error) {
  process.stderr.write(
    `QVAC unavailable: ${error instanceof Error ? error.message : String(error)}\n` +
      "The service will answer 503 and Closet keeps working manually.\n",
  );
}

// Loopback only: the browser on this machine is the only client.
const server = createClosetServer(engine);
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Closet QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

async function shutdown() {
  server.close();
  if (typeof engine.close === "function") await engine.close();
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
