import { fileURLToPath } from "node:url";

import { SERVICE_PORT } from "../src/features/replay/service-contract.ts";
import { createQvacTranscriber, closeSdk, prepareQvacConfig } from "./qvac-models.ts";
import { createReplayServer } from "./server.ts";

prepareQvacConfig(fileURLToPath(new URL("../", import.meta.url)));

const transcriber = createQvacTranscriber();
const closers = [transcriber];
const server = createReplayServer({ transcriber });

server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stdout.write(`Replay QVAC service listening on http://127.0.0.1:${SERVICE_PORT}\n`);
});

function shutdown() {
  server.close(async () => {
    for (const c of closers) await c.close();
    await closeSdk();
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
