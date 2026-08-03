import { access, mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { close, loadModel, transcribe, unloadModel } from "@qvac/sdk";
import { option } from "../lib/args.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { SPEECH_MODEL } from "../lib/models.js";
import { printProgress } from "../lib/progress.js";

const audioPath = resolve(option("--audio") ?? "fixtures/meeting.wav");
let speechId: string | undefined;

try {
  await access(audioPath);
  speechId = await loadModel({ modelSrc: SPEECH_MODEL, onProgress: printProgress });
  const transcript = await transcribe({ modelId: speechId, audioChunk: audioPath });
  if (!transcript.trim()) throw new Error("Transcription was empty");
  console.log(`Transcript:\n${transcript}\n`);

  await mkdir(resolve("workspace"), { recursive: true });
  await writeFile(resolve("workspace", "meeting-transcript.txt"), transcript, "utf8");
  await recordEvidence(5, "speech-to-text", "verified", { audioPath, transcript });
  console.log("PASS: local audio became local text. Indexing runs next.");
} catch (error) {
  await recordEvidence(5, "run-failed", "verified", { error: errorMessage(error), audioPath });
  throw error;
} finally {
  if (speechId) await unloadModel({ modelId: speechId, clearStorage: false });
  await close();
}
