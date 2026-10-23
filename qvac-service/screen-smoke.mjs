// Standalone smoke test: one screenshot in, one proposed screen note out.
import { createHash } from "node:crypto";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const sourcePath = path.resolve(
  process.argv[2] ?? path.join(appDirectory, "public/test-files/replay/harbor-export.png"),
);
const { prepareQvacConfig, createQvacViewer, closeSdk } = await import("./qvac-models.ts");
const { parseScreenNote, SCREEN_NOTE_PROMPT } = await import("../src/features/replay/screen-notes.ts");

prepareQvacConfig(appDirectory);
const viewer = createQvacViewer();
try {
  const sourceDigest = createHash("sha256").update(await readFile(sourcePath)).digest("hex");
  const started = Date.now();
  const raw = await viewer.describe(sourcePath, SCREEN_NOTE_PROMPT);
  process.stdout.write(
    `${JSON.stringify(
      { kind: "proposed-screen-note", sourceName: path.basename(sourcePath), sourceDigest, model: viewer.modelState().id, elapsedMs: Date.now() - started, raw, note: parseScreenNote(raw) },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`QVAC screen smoke failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  await viewer.close();
  await closeSdk();
}
