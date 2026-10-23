import { PROPOSAL_JSON_SCHEMA } from "../src/features/ledger/categories.ts";
import type { ModelState } from "../src/features/ledger/receipt-contract.ts";
import { resolveLocalQvacPaths } from "./local-config.ts";
import type { Proposer } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

// A small local LLM that proposes a merchant name and a category. Loaded on first use.
export function createQvacProposer(appDirectory: string): Proposer & { close(): Promise<void> } {
  const { configPath } = resolveLocalQvacPaths(appDirectory);
  let sdk: Sdk | undefined;
  let modelId: string | undefined;
  let state: ModelState["state"] = "not_loaded";
  let loading: Promise<string> | undefined;

  async function ensureModel() {
    if (modelId) return modelId;
    loading ??= (async () => {
      state = "loading";
      // qvac-reader.ts writes this config; both readers share one cache.
      process.env.QVAC_CONFIG_PATH = configPath;
      sdk = await import("@qvac/sdk");
      const id = await sdk.loadModel({ modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" });
      modelId = id;
      state = "ready";
      return id;
    })().catch((error: unknown) => {
      state = "error";
      loading = undefined;
      throw error;
    });
    return loading;
  }

  return {
    modelState: () => ({ kind: "llm", id: "LLAMA_3_2_1B_INST_Q4_0", state }),
    async complete(history) {
      const id = await ensureModel();
      const run = sdk!.completion({
        modelId: id,
        history,
        stream: true,
        responseFormat: {
          type: "json_schema",
          json_schema: { name: "proposal", schema: PROPOSAL_JSON_SCHEMA },
        },
      });
      const final = await run.final;
      return final.contentText;
    },
    async close() {
      if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
    },
  };
}
