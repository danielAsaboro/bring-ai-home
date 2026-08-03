import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { close } from "@qvac/sdk";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { closeMemory, ingestText, loadEmbeddingModel, searchMemory } from "../lib/memory.js";

let modelId: string | undefined;
try {
  const transcript = await readFile(resolve("workspace", "meeting-transcript.txt"), "utf8");
  modelId = await loadEmbeddingModel();
  await ingestText(modelId, `Meeting transcript:\n${transcript}`);
  const results = await searchMemory(modelId, "What happened in the meeting?");
  if (results.length === 0) throw new Error("Transcript was not retrievable");
  await recordEvidence(5, "speech-to-memory", "verified", { results });
  console.log("PASS: the transcript is now retrievable local memory.");
} catch (error) {
  await recordEvidence(5, "index-failed", "verified", { error: errorMessage(error) });
  throw error;
} finally {
  if (modelId) await closeMemory(modelId);
  await close();
}
