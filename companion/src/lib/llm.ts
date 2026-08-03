import {
  close,
  completion,
  loadModel,
  unloadModel,
  VERBOSITY,
  type CompletionFinal,
} from "@qvac/sdk";
import { printProgress } from "./progress.js";
import { COURSE_MODEL } from "./models.js";
import { verifyCourseModelFile } from "./local-model.js";
export { COURSE_MODEL } from "./models.js";

export async function loadCourseModel(options?: {
  providerPublicKey?: string;
  fallbackToLocal?: boolean;
  timeoutMs?: number;
  modelSrc?: string;
}): Promise<string> {
  const requestedLocalFile = options?.modelSrc ?? process.env.COURSE_MODEL_FILE;
  const localModel = requestedLocalFile
    ? (await verifyCourseModelFile(requestedLocalFile)).path
    : undefined;
  return loadModel({
    modelSrc: localModel ?? COURSE_MODEL,
    modelType: "llamacpp-completion",
    modelConfig: {
      device: process.env.COURSE_DEVICE ?? "gpu",
      ctx_size: 4096,
      temp: 0.2,
      predict: 384,
      verbosity: VERBOSITY.ERROR,
    },
    ...(options?.providerPublicKey
      ? {
          delegate: {
            providerPublicKey: options.providerPublicKey,
            fallbackToLocal: options.fallbackToLocal ?? false,
            timeout: options.timeoutMs ?? 60_000,
          },
        }
      : {}),
    onProgress: printProgress,
  });
}

export async function runCompletion(
  modelId: string,
  history: Array<{ role: "system" | "user" | "assistant" | "tool"; content: string }>,
): Promise<CompletionFinal> {
  const run = completion({ modelId, history, stream: true });
  for await (const event of run.events) {
    if (event.type === "contentDelta") process.stdout.write(event.text);
    if (event.type === "toolError") process.stderr.write(`\nTool parse error: ${event.error.message}\n`);
  }
  return run.final;
}

export async function shutdownModel(modelId?: string): Promise<void> {
  if (modelId) await unloadModel({ modelId, clearStorage: false });
  await close();
}
