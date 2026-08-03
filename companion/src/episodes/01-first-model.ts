import { downloadAsset } from "@qvac/sdk";
import { hasFlag, option } from "../lib/args.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";
import { COURSE_MODEL, loadCourseModel, runCompletion, shutdownModel } from "../lib/llm.js";
import { verifyCourseModelFile } from "../lib/local-model.js";
import { printProgress } from "../lib/progress.js";

const episode = 1;
const offline = hasFlag("--offline");
const warmOnly = hasFlag("--warm-only");
const verifyChecksum = hasFlag("--verify-checksum");
const prompt = option("--prompt") ?? "Reply with one short sentence confirming that you are running locally.";
const modelFile = option("--model-file");
let modelId: string | undefined;
let verifiedModelPath: string | undefined;

await recordEvidence(episode, "run-start", "verified", {
  sdk: "@qvac/sdk@0.16.0",
  node: process.version,
  model: COURSE_MODEL.name,
  offline,
  prompt,
  modelFile,
});

try {
  if (offline) {
    if (!modelFile) throw new Error("True offline mode requires --model-file <cached GGUF path>");
    const verified = await verifyCourseModelFile(modelFile, { checksum: verifyChecksum });
    verifiedModelPath = verified.path;
    console.log(
      `Offline mode: using an explicit ${verified.bytes}-byte local file; registry and URL inputs are disabled.${
        verified.sha256 ? " Pinned SHA-256 verified." : " Add --verify-checksum for a full integrity pass."
      }`,
    );
  } else {
    console.log("First run may use the network to download model assets.");
    await downloadAsset({ assetSrc: COURSE_MODEL, onProgress: printProgress });
  }
  if (warmOnly) {
    console.log("Model assets are warm. Run again with --offline to prove the warm path.");
    await recordEvidence(episode, "assets-warm", "verified", { offline });
  } else {
    modelId = await loadCourseModel({ ...(verifiedModelPath ? { modelSrc: verifiedModelPath } : {}) });
    console.log(`Model loaded: ${modelId}\n`);
    const final = await runCompletion(modelId, [{ role: "user", content: prompt }]);
    console.log("\n");
    if (!final.contentText.trim()) throw new Error("Model returned an empty response");
    await recordEvidence(episode, "completion", "verified", {
      requestOutput: final.contentText,
      stopReason: final.stopReason,
      stats: final.stats,
      offline,
    });
    console.log("PASS: received a non-empty local completion.");
  }
} catch (error) {
  await recordEvidence(episode, "run-failed", "verified", { error: errorMessage(error), offline });
  throw error;
} finally {
  await shutdownModel(modelId);
}
