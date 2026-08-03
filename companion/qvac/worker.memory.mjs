import { initializeWorkerCore, ensureRPCSetup } from "../node_modules/@qvac/sdk/dist/server/worker-core.js";
import { registerPlugin } from "../node_modules/@qvac/sdk/dist/server/plugins/index.js";
import { embeddingsPlugin } from "../node_modules/@qvac/sdk/dist/server/bare/plugins/llamacpp-embedding/plugin.js";

const { hasRPCConfig } = initializeWorkerCore();
registerPlugin(embeddingsPlugin);
if (hasRPCConfig) ensureRPCSetup();
