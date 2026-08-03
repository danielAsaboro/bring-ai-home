import {
  loadModel,
  ragCloseWorkspace,
  ragIngest,
  ragSearch,
  unloadModel,
  type RagSearchResult,
} from "@qvac/sdk";
import { stat } from "node:fs/promises";
import { resolve } from "node:path";
import { EMBEDDING_MODEL } from "./models.js";
import { printProgress } from "./progress.js";

export const COURSE_WORKSPACE = "bring-ai-home";

export async function loadEmbeddingModel(): Promise<string> {
  const localFile = process.env.COURSE_EMBEDDING_MODEL_FILE;
  if (localFile) {
    if (/^(registry|https?):\/\//.test(localFile)) throw new Error("Embedding override must be a local file");
    const path = resolve(localFile);
    const metadata = await stat(path);
    if (!metadata.isFile() || metadata.size !== EMBEDDING_MODEL.expectedSize) {
      throw new Error(`Embedding model must be a ${EMBEDDING_MODEL.expectedSize}-byte local file`);
    }
    return loadModel({ modelSrc: path, modelType: "llamacpp-embedding", onProgress: printProgress });
  }
  return loadModel({ modelSrc: EMBEDDING_MODEL, modelType: "llamacpp-embedding", onProgress: printProgress });
}

export async function ingestText(modelId: string, text: string): Promise<number> {
  const result = await ragIngest({
    modelId,
    workspace: COURSE_WORKSPACE,
    documents: text,
    chunk: true,
    chunkOpts: { chunkSize: 400, chunkOverlap: 40, chunkStrategy: "paragraph" },
  });
  return result.processed.length;
}

export async function searchMemory(modelId: string, query: string, topK = 3): Promise<RagSearchResult[]> {
  return ragSearch({ modelId, workspace: COURSE_WORKSPACE, query, topK });
}

export async function closeMemory(modelId: string): Promise<void> {
  await ragCloseWorkspace({ workspace: COURSE_WORKSPACE });
  await unloadModel({ modelId, clearStorage: false });
}
