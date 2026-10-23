import { createQvacEmbedder } from "./qvac-embedder.ts";
import { createQvacProposer } from "./qvac-proposer.ts";
import { createQvacReader, defaultAppDirectory } from "./qvac-reader.ts";
import { createReceiptServer } from "./server.ts";

const port = Number(process.env.LEDGER_QVAC_PORT ?? 4318);
const reader = createQvacReader(defaultAppDirectory);
const proposer = createQvacProposer(defaultAppDirectory);
const embedder = createQvacEmbedder(defaultAppDirectory);
const server = createReceiptServer(reader, { proposer, embedder });

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Ledger QVAC service listening on http://127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(async () => {
    await proposer.close();
    await embedder.close();
    await reader.close(); // closes the SDK last
    process.exit(0);
  });
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
