import { fileURLToPath } from "node:url";

import { SERVICE_PORT } from "../src/features/replay/service-contract.ts";
import { closeSdk, createQvacDrafter, createQvacEmbedder, createQvacTranscriber, createQvacViewer, prepareQvacConfig } from "./qvac-models.ts";
import { createReplayServer } from "./server.ts";

prepareQvacConfig(fileURLToPath(new URL("../", import.meta.url)));

const transcriber = createQvacTranscriber();
const viewer = createQvacViewer();
const drafter = createQvacDrafter();
const embedder = createQvacEmbedder();
const closers = [transcriber, viewer, drafter, embedder];
const server = createReplayServer({ transcriber, viewer, drafter, embedder });

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
