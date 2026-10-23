import { lookup } from "node:dns/promises";

import { SERVICE_PORT } from "./service.ts";
import { summarizeProof } from "./offline.ts";

// Run with Wi-Fi off and `npm run qvac:service` already running.
const base = process.env.CIRCLE_SERVICE_URL ?? `http://127.0.0.1:${SERVICE_PORT}`;
const today = new Date().toISOString().slice(0, 10);
const recap =
  "Coffee with Dev today. He is nervous about the meetup. I said I would send him my slide template by Friday.";

let networkReachable = true;
try {
  await lookup("registry.npmjs.org");
} catch {
  networkReachable = false;
}

// A cold model load can take a while; a step that never answers is reported, not hidden.
const timeoutMs = Number(process.env.CIRCLE_PROOF_TIMEOUT_MS ?? 180000);

async function step(route, payload) {
  const startedAt = Date.now();
  try {
    const res = await fetch(`${base}${route}`, {
      signal: AbortSignal.timeout(timeoutMs),
      ...(payload
        ? { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(payload) }
        : {}),
    });
    const body = await res.json().catch(() => ({}));
    return { route, status: res.status, ms: Date.now() - startedAt, model: body.model, body };
  } catch (error) {
    const reason = error instanceof Error ? error.name : String(error);
    return { route, status: 0, ms: Date.now() - startedAt, body: { error: reason } };
  }
}

const people = [{ id: "dev-raman", name: "Dev Raman" }];
const notes = [{ id: "t5", text: "2026-10-10 interaction: Practised the first five minutes of his talk." }];
const steps = [
  await step("/health"),
  await step("/recap/extract", { transcript: recap, people, today }),
  await step("/context/retrieve", { query: "his talk", passages: notes }),
  await step("/followup/draft", { personName: "Dev Raman", intent: "good luck", context: notes }),
];
if (process.argv[2]) {
  const { readFile } = await import("node:fs/promises");
  const audio = await readFile(process.argv[2]);
  steps.push(
    await step("/recap/transcribe", { audioBase64: audio.toString("base64"), fileName: "recap.wav" }),
  );
}
const receipt = summarizeProof(networkReachable, steps);
process.stdout.write(`${JSON.stringify(receipt, null, 2)}\n`);
if (!receipt.verdict.startsWith("offline")) process.exitCode = 1;
