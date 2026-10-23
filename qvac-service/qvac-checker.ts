import { mkdir, rm, writeFile } from "node:fs/promises";
import { createHash } from "node:crypto";
import path from "node:path";

import type { FrameChecker } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

export const VISION_MODEL = "SMOLVLM2_500M_MULTIMODAL_Q8_0";

// SmolVLM2 with its projection model. Loaded on first use, kept warm afterwards.
// Extra modelConfig (lesson 07) is passed straight to loadModel.
export function createQvacChecker(
  appDirectory: string,
  extraModelConfig: Record<string, string> = {},
): FrameChecker & { close(): Promise<void> } {
  const framesDirectory = path.join(appDirectory, ".qvac", "frames");
  let sdk: Sdk | undefined;
  let loading: Promise<string> | undefined;

  function ensureModel() {
    loading ??= (async () => {
      sdk = await import("@qvac/sdk");
      return sdk.loadModel({
        modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
        modelConfig: {
          ctx_size: 1024,
          projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0,
          ...extraModelConfig,
        },
      });
    })().catch((error: unknown) => {
      loading = undefined;
      throw error;
    });
    return loading;
  }

  return {
    model: VISION_MODEL,
    async check(png, prompt) {
      const modelId = await ensureModel();
      // Attachments are file paths. The frame is written to this machine's disk,
      // read by the local model, and deleted.
      await mkdir(framesDirectory, { recursive: true });
      const framePath = path.join(framesDirectory, `${createHash("sha256").update(png).digest("hex")}.png`);
      await writeFile(framePath, png);
      try {
        const run = sdk!.completion({
          modelId,
          history: [{ role: "user", content: prompt, attachments: [{ path: framePath }] }],
          stream: true,
        });
        let raw = "";
        for await (const token of run.tokenStream) raw += token;
        return raw;
      } finally {
        await rm(framePath, { force: true });
      }
    },
    async close() {
      if (sdk && loading) {
        const modelId = await loading.catch(() => undefined);
        if (modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
      }
      if (sdk) await sdk.close().catch(() => undefined);
    },
  };
}
