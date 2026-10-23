import type { WatcherProposer } from "./server.ts";
import { WATCHER_JSON_SCHEMA } from "../src/features/lookout/watcher.ts";

type Sdk = typeof import("@qvac/sdk");

export const LANGUAGE_MODEL = "LLAMA_3_2_1B_INST_Q4_0";

// A small local LLM that proposes a watcher as JSON. Loaded on first use.
export function createQvacProposer(): WatcherProposer & { close(): Promise<void> } {
  let sdk: Sdk | undefined;
  let loading: Promise<string> | undefined;

  function ensureModel() {
    loading ??= (async () => {
      sdk = await import("@qvac/sdk");
      return sdk.loadModel({ modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
    })().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  }

  return {
    model: LANGUAGE_MODEL,
    async complete(history) {
      const modelId = await ensureModel();
      const run = sdk!.completion({
        modelId,
        history,
        stream: true,
        responseFormat: { type: "json_schema", json_schema: { name: "watcher", schema: WATCHER_JSON_SCHEMA } },
      });
      return (await run.final).contentText;
    },
    async close() {
      const modelId = await loading?.catch(() => undefined);
      if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
    },
  };
}
