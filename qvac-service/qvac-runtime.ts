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

export async function loadProposalModel(sdk: Sdk, onProgress?: (percentage: number) => void) {
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
