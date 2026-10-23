import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

import type { ChatMessage } from "./proposal.ts";

export const PROPOSAL_MODEL = "LLAMA_3_2_1B_INST_Q4_0";

export function resolveLocalQvacPaths(appDirectory: string) {
  const qvacDirectory = path.join(appDirectory, ".qvac");
  return {
    qvacDirectory,
    cacheDirectory: path.join(qvacDirectory, "models"),
    configPath: path.join(qvacDirectory, "config.json"),
  };
}

// Point the SDK at an app-local cache before @qvac/sdk is imported.
export async function configureLocalQvac(appDirectory: string) {
  const paths = resolveLocalQvacPaths(appDirectory);
  await mkdir(paths.cacheDirectory, { recursive: true });
  await writeFile(paths.configPath, `${JSON.stringify({ cacheDirectory: paths.cacheDirectory }, null, 2)}\n`, "utf8");
  process.env.QVAC_CONFIG_PATH = paths.configPath;
  return paths;
}

type Sdk = typeof import("@qvac/sdk");

// The LoRA base must be fine-tunable. We use the SDK's own fine-tuning example model.
export const TUNED_BASE_MODEL = "QWEN3_600M_INST_Q4";

export function proposalModelLabel(adapterPath: string | null): string {
  return adapterPath ? `${TUNED_BASE_MODEL}+LoRA` : PROPOSAL_MODEL;
}

export async function loadProposalModel(sdk: Sdk, onProgress?: (percentage: number) => void, adapterPath: string | null = null) {
  if (adapterPath) {
    return sdk.loadModel({
      modelSrc: sdk.QWEN3_600M_INST_Q4,
      modelType: "llm",
      modelConfig: { ctx_size: 1024, lora: adapterPath },
    });
  }
  return sdk.loadModel({
    modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0,
    modelType: "llm",
    onProgress: onProgress ? (p) => onProgress(p.percentage) : undefined,
  });
}

export const EMBEDDING_MODEL = "GTE_LARGE_FP16";

export async function loadEmbeddingModel(sdk: Sdk) {
  return sdk.loadModel({ modelSrc: sdk.GTE_LARGE_FP16, modelType: "embeddings" });
}

export async function embedTexts(sdk: Sdk, modelId: string, texts: string[]): Promise<number[][]> {
  const { embedding } = await sdk.embed({ modelId, text: texts });
  return embedding;
}

export async function completeText(sdk: Sdk, modelId: string, history: ChatMessage[]): Promise<string> {
  const run = sdk.completion({ modelId, history, stream: true });
  let raw = "";
  for await (const token of run.tokenStream) raw += token;
  return raw;
}

export async function loadTuningBase(sdk: Sdk) {
  return sdk.loadModel({ modelSrc: sdk.QWEN3_600M_INST_Q4, modelType: "llm", modelConfig: { ctx_size: 512 } });
}

export function startLoraRun(
  sdk: Sdk,
  modelId: string,
  dirs: { train: string; eval: string; output: string; checkpoints: string },
) {
  return sdk.finetune({
    modelId,
    options: {
      trainDatasetDir: dirs.train,
      validation: { type: "dataset", path: dirs.eval },
      outputParametersDir: dirs.output,
      checkpointSaveDir: dirs.checkpoints,
      numberOfEpochs: 2,
      learningRate: 1e-4,
      assistantLossOnly: true,
      loraSeed: 7,
    },
  });
}
