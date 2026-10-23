import { createReceiptServer, unavailableReader } from "./server.ts";

const port = Number(process.env.LEDGER_QVAC_PORT ?? 4318);
const server = createReceiptServer(unavailableReader);

server.listen(port, "127.0.0.1", () => {
  process.stdout.write(`Ledger QVAC service listening on http://127.0.0.1:${port}\n`);
});

function shutdown() {
  server.close(() => process.exit(0));
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
