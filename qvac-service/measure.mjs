// Run the vision check on every sample frame for one condition and score it
// against the hand labels. Writes a receipt you can compare between tunings.
// Usage: npm run qvac:measure -- [maxMotion]
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");

const { allFrames, sampleSources } = await import("../src/features/lookout/sources.ts");
const { PARCEL_CONDITION, parcelLabels, scoreWatcher } = await import("../src/features/lookout/measure.ts");
const { buildConditionPrompt, parseVerdict } = await import("../src/features/lookout/verdict.ts");
const { createQvacChecker } = await import("./qvac-checker.ts");

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;

const maxMotion = process.argv[2] === undefined ? 1 : Number(process.argv[2]);
const watcher = { id: "measure", sourceId: "front-gate", condition: PARCEL_CONDITION, fromHour: 0, toHour: 0, minMotion: 0, maxMotion };
const checker = createQvacChecker(appDirectory);
try {
  const frames = allFrames(sampleSources);
  const verdicts = {};
  const raw = {};
  for (const frame of frames) {
    const png = await readFile(path.join(appDirectory, "public", frame.image));
    raw[frame.id] = await checker.check(png, buildConditionPrompt(PARCEL_CONDITION));
    verdicts[frame.id] = parseVerdict(raw[frame.id]);
    process.stderr.write(`${frame.id}: ${verdicts[frame.id].answer}\n`);
  }
  const receipt = {
    kind: "measured-run",
    model: checker.model,
    condition: PARCEL_CONDITION,
    maxMotion,
    score: scoreWatcher(watcher, frames, verdicts, parcelLabels),
    verdicts,
    raw,
    at: new Date().toISOString(),
  };
  const out = path.join(qvacDirectory, `measure-${Date.now()}.json`);
  await writeFile(out, `${JSON.stringify(receipt, null, 2)}\n`);
  process.stdout.write(`${JSON.stringify(receipt.score, null, 2)}\nReceipt: ${out}\n`);
} catch (error) {
  process.stderr.write(`Measurement failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await checker.close();
}
