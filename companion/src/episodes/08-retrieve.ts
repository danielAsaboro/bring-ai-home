import { mkdir, readFile, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { close } from "@qvac/sdk";
import { option } from "../lib/args.js";
import { closeMemory, ingestText, loadEmbeddingModel, searchMemory } from "../lib/memory.js";

const question = option("--question") ?? "Why did Project Hearth move, and who owns the next step?";
let modelId: string | undefined;
try {
  const document = await readFile(resolve("fixtures", "launch-brief.md"), "utf8");
  modelId = await loadEmbeddingModel();
  await ingestText(modelId, document);
  const sources = await searchMemory(modelId, question);
  if (sources.length === 0) throw new Error("No local context was retrieved");
  await mkdir(resolve("workspace"), { recursive: true });
  await writeFile(resolve("workspace", "retrieval.json"), JSON.stringify({ question, sources }, null, 2), "utf8");
  console.log(`PASS: retrieved ${sources.length} local passages.`);
} finally {
  if (modelId) await closeMemory(modelId);
  await close();
}
