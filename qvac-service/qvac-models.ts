// The only file that imports @qvac/sdk for the service. Every model loads on first use.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ModelState } from "../src/features/replay/service-contract.ts";
import type { Drafter, Embedder, Transcriber, Viewer } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

export function prepareQvacConfig(appDirectory: string) {
  const cacheDirectory = path.join(appDirectory, ".qvac", "models");
  const configPath = path.join(appDirectory, ".qvac", "config.json");
  mkdirSync(cacheDirectory, { recursive: true });
  writeFileSync(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;
  return { cacheDirectory, configPath };
}

let sdkPromise: Promise<Sdk> | undefined;
export function sdk() {
  sdkPromise ??= import("@qvac/sdk");
  return sdkPromise;
}

// Close the SDK only if something actually loaded it.
export async function closeSdk() {
  if (!sdkPromise) return;
  try {
    await (await sdkPromise).close();
  } catch {
    // The SDK never loaded or is already closed; nothing is left to release.
  }
}

// One lazy model: load once, report state honestly, unload on shutdown.
export function lazyModel(kind: string, id: string, load: (qvac: Sdk) => Promise<string>) {
  let modelId: string | undefined;
  let state: ModelState["state"] = "not_loaded";
  let loading: Promise<string> | undefined;
  return {
    modelState: (): ModelState => ({ kind, id, state }),
    async ensure() {
      if (modelId) return modelId;
      loading ??= (async () => {
        state = "loading";
        modelId = await load(await sdk());
        state = "ready";
        return modelId;
      })().catch((error: unknown) => {
        state = "error";
        loading = undefined;
        throw error;
      });
      return loading;
    },
    async close() {
      if (modelId) await (await sdk()).unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
    },
  };
}

export function createQvacTranscriber(): Transcriber & { close(): Promise<void> } {
  const model = lazyModel("transcription", "WHISPER_TINY", (q) =>
    q.loadModel({
      modelSrc: q.WHISPER_TINY,
      modelConfig: { language: "en", translate: false, temperature: 0.0 },
    }),
  );
  return {
    modelState: model.modelState,
    async transcribe(wavPath) {
      const modelId = await model.ensure();
      const segments = await (await sdk()).transcribe({ modelId, audioChunk: wavPath, metadata: true });
      return segments.map((s) => ({ text: s.text, startMs: s.startMs, endMs: s.endMs }));
    },
    close: model.close,
  };
}

export function createQvacViewer(): Viewer & { close(): Promise<void> } {
  const model = lazyModel("multimodal", "SMOLVLM2_500M_MULTIMODAL_Q8_0", (q) =>
    q.loadModel({
      modelSrc: q.SMOLVLM2_500M_MULTIMODAL_Q8_0,
      modelConfig: { ctx_size: 1024, projectionModelSrc: q.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
    }),
  );
  return {
    modelState: model.modelState,
    async describe(imagePath, prompt) {
      const modelId = await model.ensure();
      const run = (await sdk()).completion({
        modelId,
        history: [{ role: "user", content: prompt, attachments: [{ path: imagePath }] }],
        stream: true,
      });
      return (await run.final).contentText;
    },
    close: model.close,
  };
}

export function createQvacDrafter(): Drafter & { close(): Promise<void> } {
  const model = lazyModel("llm", "LLAMA_3_2_1B_INST_Q4_0", (q) =>
    q.loadModel({ modelSrc: q.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" }),
  );
  return {
    modelState: model.modelState,
    async complete(history, schema) {
      const modelId = await model.ensure();
      const run = (await sdk()).completion({
        modelId,
        history,
        stream: true,
        responseFormat: { type: "json_schema", json_schema: schema },
      });
      return (await run.final).contentText;
    },
    close: model.close,
  };
}

export function createQvacEmbedder(): Embedder & { close(): Promise<void> } {
  const model = lazyModel("embeddings", "GTE_LARGE_FP16", (q) =>
    q.loadModel({ modelSrc: q.GTE_LARGE_FP16, modelType: "embeddings" }),
  );
  return {
    modelState: model.modelState,
    async embed(texts) {
      const modelId = await model.ensure();
      const { embedding } = await (await sdk()).embed({ modelId, text: texts });
      return embedding;
    },
    close: model.close,
  };
}
