import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { close } from "@qvac/sdk";
import { option } from "../lib/args.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { closeMemory, ingestText, loadEmbeddingModel, searchMemory } from "../lib/memory.js";

const query = option("--query") ?? "Why was the launch delayed?";
const fixture = resolve("fixtures", "launch-brief.md");
let modelId: string | undefined;

try {
  const document = await readFile(fixture, "utf8");
  modelId = await loadEmbeddingModel();
  const chunks = await ingestText(modelId, document);
  const results = await searchMemory(modelId, query);
  console.log(`Ingested ${chunks} chunks. Query: ${query}`);
  results.forEach((result, index) => console.log(`\n${index + 1}. score=${result.score}\n${result.content}`));
  if (!results.some((result) => result.content.toLowerCase().includes("privacy audit"))) {
    throw new Error("Acceptance phrase 'privacy audit' was not retrieved");
  }
  await recordEvidence(4, "rag-query", "verified", { query, chunks, results });
  console.log("\nPASS: the relevant private passage was retrieved.");
} catch (error) {
  await recordEvidence(4, "run-failed", "verified", { error: errorMessage(error) });
  throw error;
} finally {
  if (modelId) await closeMemory(modelId);
  await close();
}
