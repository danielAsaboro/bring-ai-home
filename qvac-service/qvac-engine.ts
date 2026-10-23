import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";

import { buildOutfitHistory, outfitSchema } from "../src/features/closet/outfit-proposal.ts";
import { buildDetailsHistory, GARMENT_PROPOSAL_SCHEMA } from "../src/features/closet/garment-proposal.ts";
import { DESCRIBE_GARMENT_PROMPT, resolveLocalQvacPaths, VISION_MODEL } from "./local-config.ts";
import type { ClosetEngine, GarmentImage } from "./server.ts";

type Sdk = typeof import("@qvac/sdk");

// Loads QVAC once, then each model on first use. All inference stays local.
export async function createQvacEngine(appDirectory: string): Promise<ClosetEngine & { close(): Promise<void> }> {
  const { cacheDirectory, configPath } = resolveLocalQvacPaths(appDirectory);
  await mkdir(cacheDirectory, { recursive: true });
  await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = configPath;
  const sdk: Sdk = await import("@qvac/sdk");
  const loaded = new Map<string, Promise<string>>();

  function model(key: string, load: () => Promise<string>) {
    let pending = loaded.get(key);
    if (!pending) {
      pending = load().catch((error: unknown) => {
        loaded.delete(key); // a failed load can be retried
        throw error;
      });
      loaded.set(key, pending);
    }
    return pending;
  }

  const vision = () =>
    model(VISION_MODEL, () =>
      sdk.loadModel({
        modelSrc: sdk.SMOLVLM2_500M_MULTIMODAL_Q8_0,
        modelConfig: { ctx_size: 1024, projectionModelSrc: sdk.MMPROJ_SMOLVLM2_500M_MULTIMODAL_Q8_0 },
      }),
    );

  const LLM_MODEL = "LLAMA_3_2_1B_INST_Q4_0";
  const llm = () => model(LLM_MODEL, () => sdk.loadModel({ modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0, modelType: "llm" }));

  const EMBED_MODEL = "GTE_LARGE_FP16";
  const embedder = () => model(EMBED_MODEL, () => sdk.loadModel({ modelSrc: sdk.GTE_LARGE_FP16, modelType: "embeddings" }));

  // QVAC ships a small bundled classifier (food/report/other). A wardrobe
  // classifier is a custom GGUF you point at with CLOSET_CLASSIFIER_GGUF.
  const customClassifier = process.env.CLOSET_CLASSIFIER_GGUF;
  const CLASSIFIER_MODEL = customClassifier ? `custom:${path.basename(customClassifier)}` : "bundled-mobilenetv3-small";
  const classifier = () =>
    model(CLASSIFIER_MODEL, () =>
      customClassifier
        ? sdk.loadModel({ modelSrc: customClassifier, modelType: "ggml-classification" })
        : sdk.loadModel({ modelType: "ggml-classification" }),
    );

  // The vision model reads attachments from disk, so stage the upload briefly.
  async function withTempImage<T>(image: GarmentImage, work: (file: string) => Promise<T>) {
    const dir = await mkdtemp(path.join(tmpdir(), "closet-"));
    const file = path.join(dir, image.mime === "image/png" ? "garment.png" : "garment.jpg");
    try {
      await writeFile(file, image.bytes);
      return await work(file);
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  }

  return {
    async describe(image) {
      const modelId = await vision();
      return withTempImage(image, async (file) => {
        const run = sdk.completion({
          modelId,
          history: [{ role: "user", content: DESCRIBE_GARMENT_PROMPT, attachments: [{ path: file }] }],
          stream: true,
        });
        let text = "";
        for await (const token of run.tokenStream) text += token;
        const description = text.replace(/\s+/g, " ").trim();
        if (!description) throw new Error("The model returned an empty description");
        return { description, model: VISION_MODEL };
      });
    },
    async details(description) {
      const modelId = await llm();
      const run = sdk.completion({
        modelId,
        history: buildDetailsHistory(description),
        stream: true,
        responseFormat: {
          type: "json_schema",
          json_schema: { name: "garment", schema: GARMENT_PROPOSAL_SCHEMA as unknown as Record<string, unknown> },
        },
      });
      const final = await run.final;
      return { raw: final.contentText, model: LLM_MODEL };
    },
    async outfit(constraints) {
      const modelId = await llm();
      const run = sdk.completion({
        modelId,
        history: buildOutfitHistory(constraints),
        stream: true,
        responseFormat: { type: "json_schema", json_schema: { name: "outfit", schema: outfitSchema(constraints) } },
      });
      const final = await run.final;
      return { raw: final.contentText, model: LLM_MODEL };
    },
    async embed(texts) {
      const modelId = await embedder();
      const { embedding } = await sdk.embed({ modelId, text: texts });
      return { embeddings: embedding as number[][], model: EMBED_MODEL };
    },
    async classify(image) {
      const modelId = await classifier();
      const results = await sdk.classify({ modelId, image: image.bytes });
      return { results, model: CLASSIFIER_MODEL };
    },
    async close() {
      for (const pending of loaded.values()) {
        const modelId = await pending.catch(() => null);
        if (modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
      }
      await sdk.close().catch(() => undefined);
    },
  };
}
