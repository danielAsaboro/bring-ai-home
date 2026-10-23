import type { ModelState } from "../src/features/ledger/receipt-contract.ts";
import { resolveLocalQvacPaths } from "./local-config.ts";
import type { Embedder } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

// GTE large turns short entry text into vectors. Loaded on first use.
export function createQvacEmbedder(appDirectory: string): Embedder & { close(): Promise<void> } {
  const { configPath } = resolveLocalQvacPaths(appDirectory);
  let sdk: Sdk | undefined;
  let modelId: string | undefined;
  let state: ModelState["state"] = "not_loaded";
  let loading: Promise<string> | undefined;

  async function ensureModel() {
    if (modelId) return modelId;
    loading ??= (async () => {
      state = "loading";
      process.env.QVAC_CONFIG_PATH = configPath;
      sdk = await import("@qvac/sdk");
      const id = await sdk.loadModel({ modelSrc: sdk.GTE_LARGE_FP16, modelType: "embeddings" });
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
    modelState: () => ({ kind: "embeddings", id: "GTE_LARGE_FP16", state }),
    async embed(texts) {
      const id = await ensureModel();
      const { embedding } = await sdk!.embed({ modelId: id, text: texts });
      return embedding;
    },
    async close() {
      if (sdk && modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
    },
  };
}
