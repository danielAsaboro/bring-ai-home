import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { close } from "@qvac/sdk";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { loadCourseModel, runCompletion, shutdownModel } from "../lib/llm.js";

let modelId: string | undefined;

try {
  const retrieval = JSON.parse(await readFile(resolve("workspace", "retrieval.json"), "utf8")) as {
    question: string;
    sources: Array<{ content: string; score: number }>;
  };
  const { question, sources } = retrieval;
  const context = sources.map((source, index) => `[${index + 1}] ${source.content}`).join("\n\n");

  modelId = await loadCourseModel();
  const final = await runCompletion(modelId, [
    { role: "system", content: "Answer only from the supplied local context. Cite passages as [1], [2]. If context is insufficient, say so." },
    { role: "user", content: `Question: ${question}\n\nLocal context:\n${context}` },
  ]);
  console.log("\n");
  if (!final.contentText.includes("[")) throw new Error("Answer did not cite retrieved context");
  await recordEvidence(8, "assistant-answer", "verified", { question, sources, answer: final.contentText, stats: final.stats });
  console.log("PASS: the answer was generated from cited local memory.");
} catch (error) {
  await recordEvidence(8, "run-failed", "verified", { error: errorMessage(error) });
  throw error;
} finally {
  await shutdownModel(modelId);
  await close();
}
