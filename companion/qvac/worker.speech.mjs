import { initializeWorkerCore, ensureRPCSetup } from "../node_modules/@qvac/sdk/dist/server/worker-core.js";
import { registerPlugin } from "../node_modules/@qvac/sdk/dist/server/plugins/index.js";
import { whisperPlugin } from "../node_modules/@qvac/sdk/dist/server/bare/plugins/whispercpp-transcription/plugin.js";

const { hasRPCConfig } = initializeWorkerCore();
registerPlugin(whisperPlugin);
if (hasRPCConfig) ensureRPCSetup();
