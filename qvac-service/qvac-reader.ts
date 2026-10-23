import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import type { ModelState, OcrBlock } from "../src/features/ledger/receipt-contract.ts";
import { resolveLocalQvacPaths } from "./local-config.ts";
import type { ReceiptReader } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

// Loads OCR once, on first use, and keeps it warm for later receipts.
export function createQvacReader(appDirectory: string): ReceiptReader & { close(): Promise<void> } {
  const { cacheDirectory, configPath } = resolveLocalQvacPaths(appDirectory);
  let sdk: Sdk | undefined;
  let modelId: string | undefined;
  let state: ModelState["state"] = "not_loaded";
  let loading: Promise<string> | undefined;

  async function ensureModel(): Promise<string> {
    if (modelId) return modelId;
    loading ??= (async () => {
      state = "loading";
      await mkdir(cacheDirectory, { recursive: true });
      await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
      process.env.QVAC_CONFIG_PATH = configPath;
      sdk = await import("@qvac/sdk");
      const id = await sdk.loadModel({ modelSrc: sdk.OCR_LATIN, modelConfig: { langList: ["en"] } });
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
    modelState: () => ({ kind: "ocr", id: "OCR_LATIN", state }),
    async read(png) {
      const id = await ensureModel();
      // Hand QVAC a private temporary file, then delete it after reading.
      const directory = await mkdtemp(path.join(tmpdir(), "ledger-receipt-"));
      const imagePath = path.join(directory, "receipt.png");
      let blocks, stats;
      try {
        await writeFile(imagePath, png);
        const run = sdk!.ocr({ modelId: id, image: imagePath, options: { paragraph: false } });
        [blocks, stats] = await Promise.all([run.blocks, run.stats]);
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
      return {
        blocks: blocks.map(
          (block): OcrBlock => ({
            text: block.text,
            bbox: block.bbox ?? null,
            confidence: block.confidence ?? null,
          }),
        ),
        ocrMs: stats?.totalTime ?? null,
      };
    },
    async close() {
      if (sdk && modelId) {
        await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
      }
      if (sdk) await sdk.close().catch(() => undefined);
    },
  };
}

export const defaultAppDirectory = path.resolve(import.meta.dirname, "..");
