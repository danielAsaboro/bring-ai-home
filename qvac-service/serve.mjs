import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const runtime = await import("./qvac-runtime.ts");
const { createPatternServer, SERVICE_PORT } = await import("./server.ts");
const { buildProposalHistory } = await import("./proposal.ts");

let sdk;
let modelId;
let proposer = null;
try {
  await runtime.configureLocalQvac(appDirectory);
  sdk = await import("@qvac/sdk");
  modelId = await runtime.loadProposalModel(sdk);
  proposer = async (examples) => ({
    raw: await runtime.completeText(sdk, modelId, buildProposalHistory(examples)),
    model: runtime.PROPOSAL_MODEL,
  });
} catch (error) {
  process.stderr.write(
    `Proposal model unavailable: ${error instanceof Error ? error.message : String(error)}\n` +
      "The service will answer 503 and Pattern keeps working by hand.\n",
  );
}

const server = createPatternServer({ proposer });
server.listen(SERVICE_PORT, "127.0.0.1", () => {
  process.stderr.write(`Pattern QVAC service on http://127.0.0.1:${SERVICE_PORT}\n`);
});

async function shutdown() {
  server.close();
  if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  if (sdk) await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
