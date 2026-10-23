// The offline proof. Run it inside a process that has no network:
//   macOS: npm run qvac:offline -- <narration.wav>       (sandbox-exec)
//   Linux: npm run qvac:offline:linux -- <narration.wav> (unshare -rn, a fresh network namespace)
// It refuses to run unless the network is really denied and every pinned model is cached.
import { createHash } from "node:crypto";
import { readdir, stat } from "node:fs/promises";
import net from "node:net";
import path from "node:path";
import { fileURLToPath } from "node:url";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const narrationPath = process.argv[2] ? path.resolve(process.argv[2]) : null;
const screenshotPath = path.join(appDirectory, "public/test-files/replay/harbor-export.png");

const { assertWarmedCache, classifyProbe } = await import("./offline-proof.ts");
const models = await import("./qvac-models.ts");
const { toNarration } = await import("../src/features/replay/narration.ts");
const { parseScreenNote, SCREEN_NOTE_PROMPT } = await import("../src/features/replay/screen-notes.ts");
const { buildStepsHistory, parseStepProposals, STEPS_JSON_SCHEMA } = await import("../src/features/replay/proposals.ts");
const { buildConditionsHistory, CONDITIONS_JSON_SCHEMA, parseConditions } = await import("../src/features/replay/conditions.ts");
const { rankTapes } = await import("../src/features/replay/search.ts");
const { SAMPLE_LIBRARY } = await import("../src/features/replay/sample-library.ts");
const { tapeText } = await import("../src/features/replay/tape.ts");
const { tapeToSkill } = await import("../src/features/replay/skill-export.ts");

function probe() {
  return new Promise((resolve) => {
    const socket = net.connect({ host: "1.1.1.1", port: 443, timeout: 5000 });
    socket.on("connect", () => {
      socket.destroy();
      resolve({ ok: true });
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve({ ok: false, code: "ETIMEDOUT" });
    });
    socket.on("error", (error) => resolve({ ok: false, code: error.code }));
  });
}

const open = [];
try {
  if (!narrationPath) throw new Error("Pass your narration recording: npm run qvac:offline -- <narration.wav>");
  const { cacheDirectory } = models.prepareQvacConfig(appDirectory);
  const names = await readdir(cacheDirectory, { recursive: true });
  const files = await Promise.all(
    names.map(async (name) => ({ name, bytes: (await stat(path.join(cacheDirectory, name))).size })),
  );
  assertWarmedCache(files);

  const network = classifyProbe(await probe());
  if (network !== "network-denied") throw new Error(`Expected this process to be denied network access, got ${network}`);

  const started = Date.now();
  const transcriber = models.createQvacTranscriber();
  const viewer = models.createQvacViewer();
  const drafter = models.createQvacDrafter();
  const embedder = models.createQvacEmbedder();
  open.push(transcriber, viewer, drafter, embedder);

  const narration = toNarration(await transcriber.transcribe(narrationPath));
  const note = parseScreenNote(await viewer.describe(screenshotPath, SCREEN_NOTE_PROMPT));
  const steps = parseStepProposals(
    await drafter.complete(buildStepsHistory({ transcript: narration.transcript, screenNotes: [note.text] }), {
      name: "steps",
      schema: STEPS_JSON_SCHEMA,
    }),
    narration.transcript,
  );
  const conditions = parseConditions(
    await drafter.complete(buildConditionsHistory(narration.transcript), { name: "conditions", schema: CONDITIONS_JSON_SCHEMA }),
    narration.transcript,
  );
  const [query, ...vectors] = await embedder.embed([narration.transcript, ...SAMPLE_LIBRARY.map(tapeText)]);
  const matches = rankTapes(SAMPLE_LIBRARY.map((t, i) => ({ tapeId: t.id, vector: vectors[i] })), query);
  const skill = tapeToSkill(SAMPLE_LIBRARY[0]);

  process.stdout.write(
    `${JSON.stringify(
      {
        network,
        transcriptWords: narration.transcript.split(/\s+/).length,
        screenNote: note.text,
        proposedSteps: steps.proposals.length,
        heldBackSteps: steps.rejected.length,
        proposedParameters: conditions.parameters.map((p) => p.name),
        proposedStopConditions: conditions.stopConditions.length,
        closestTape: matches[0] ?? null,
        skillSha256: createHash("sha256").update(skill.content).digest("hex"),
        elapsedMs: Date.now() - started,
      },
      null,
      2,
    )}\n`,
  );
} catch (error) {
  process.stderr.write(`Offline proof failed: ${error instanceof Error ? error.message : String(error)}\n`);
  process.exitCode = 1;
} finally {
  for (const model of open) await model.close();
  await models.closeSdk();
}
