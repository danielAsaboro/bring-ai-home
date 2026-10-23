// The only file that imports @qvac/sdk for the service. Every model loads on first use.
import { mkdirSync, writeFileSync } from "node:fs";
import path from "node:path";

import type { ModelState } from "../src/features/replay/service-contract.ts";
import type { Transcriber } from "./server.ts";

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
