// Shapes that cross the loopback boundary between the browser and the QVAC service.
// JSON from another process can be anything, so both sides validate at runtime.
import type { ConditionsResult } from "./conditions.ts";
import type { Narration } from "./narration.ts";
import type { ProposalResult } from "./proposals.ts";
import { imageExtension, type ScreenNote } from "./screen-notes.ts";

export const SERVICE_PORT = 4319;
export const SERVICE_URL = `http://127.0.0.1:${SERVICE_PORT}`;

export type Parsed<T> = { ok: true; value: T } | { ok: false; message: string };

export type ModelState = { kind: string; id: string; state: "not_loaded" | "loading" | "ready" | "error" };

export type ServiceError = { error: { code: string; message: string } };

export type TranscribeRequest = { fileName: string; audioBase64: string };
export type TranscribeResponse = {
  sourceDigest: string;
  model: string;
  transcribeMs: number;
  narration: Narration;
};

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function nonEmptyString(value: unknown, max: number): value is string {
  return typeof value === "string" && value.trim().length > 0 && value.length <= max;
}

export function parseTranscribeRequest(json: unknown): Parsed<TranscribeRequest> {
  if (!isRecord(json)) return { ok: false, message: "Body must be an object" };
  if (!nonEmptyString(json.fileName, 200)) return { ok: false, message: "fileName is required" };
  if (!/\.wav$/i.test(json.fileName)) return { ok: false, message: "Only .wav recordings are supported" };
  if (!nonEmptyString(json.audioBase64, 40_000_000)) return { ok: false, message: "audioBase64 is required" };
  return { ok: true, value: { fileName: json.fileName, audioBase64: json.audioBase64 } };
}

export function parseTranscribeResponse(json: unknown): Parsed<TranscribeResponse> {
  if (!isRecord(json) || !isRecord(json.narration)) return { ok: false, message: "Missing narration" };
  const n = json.narration;
  if (typeof n.transcript !== "string" || !Array.isArray(n.segments)) {
    return { ok: false, message: "Narration is malformed" };
  }
  const segmentsOk = n.segments.every(
    (s) => isRecord(s) && typeof s.text === "string" && typeof s.startMs === "number" && typeof s.endMs === "number",
  );
  if (!segmentsOk || typeof json.model !== "string" || typeof json.sourceDigest !== "string") {
    return { ok: false, message: "Narration is malformed" };
  }
  return { ok: true, value: json as TranscribeResponse };
}

export function parseServiceError(json: unknown): ServiceError["error"] | null {
  if (isRecord(json) && isRecord(json.error) && typeof json.error.code === "string" && typeof json.error.message === "string") {
    return { code: json.error.code, message: json.error.message };
  }
  return null;
}

export type ReadScreenshotRequest = { fileName: string; imageBase64: string };
export type ReadScreenshotResponse = { sourceDigest: string; model: string; note: ScreenNote };

export function parseReadScreenshotRequest(json: unknown): Parsed<ReadScreenshotRequest> {
  if (!isRecord(json)) return { ok: false, message: "Body must be an object" };
  if (!nonEmptyString(json.fileName, 200)) return { ok: false, message: "fileName is required" };
  if (!imageExtension(json.fileName)) return { ok: false, message: "Only .png and .jpg screenshots are supported" };
  if (!nonEmptyString(json.imageBase64, 20_000_000)) return { ok: false, message: "imageBase64 is required" };
  return { ok: true, value: { fileName: json.fileName, imageBase64: json.imageBase64 } };
}

export function parseReadScreenshotResponse(json: unknown): Parsed<ReadScreenshotResponse> {
  if (!isRecord(json) || !isRecord(json.note) || typeof json.note.text !== "string" || typeof json.model !== "string") {
    return { ok: false, message: "Screen note is malformed" };
  }
  return { ok: true, value: json as ReadScreenshotResponse };
}

export type ProposeStepsRequest = { transcript: string; screenNotes: string[] };
export type ProposeStepsResponse = { model: string; raw: string; result: ProposalResult };

export function parseProposeStepsRequest(json: unknown): Parsed<ProposeStepsRequest> {
  if (!isRecord(json)) return { ok: false, message: "Body must be an object" };
  if (!nonEmptyString(json.transcript, 20_000)) return { ok: false, message: "transcript is required" };
  const notes = json.screenNotes ?? [];
  if (!Array.isArray(notes) || notes.length > 20 || !notes.every((n) => nonEmptyString(n, 1000))) {
    return { ok: false, message: "screenNotes must be up to 20 strings" };
  }
  return { ok: true, value: { transcript: json.transcript, screenNotes: notes as string[] } };
}

export function parseProposeStepsResponse(json: unknown): Parsed<ProposeStepsResponse> {
  if (!isRecord(json) || !isRecord(json.result) || !Array.isArray(json.result.proposals) || !Array.isArray(json.result.rejected)) {
    return { ok: false, message: "Proposal response is malformed" };
  }
  return { ok: true, value: json as ProposeStepsResponse };
}

export type ProposeConditionsResponse = { model: string; raw: string; result: ConditionsResult };

export function parseProposeConditionsRequest(json: unknown): Parsed<{ transcript: string }> {
  if (!isRecord(json) || !nonEmptyString(json.transcript, 20_000)) return { ok: false, message: "transcript is required" };
  return { ok: true, value: { transcript: json.transcript } };
}

export function parseProposeConditionsResponse(json: unknown): Parsed<ProposeConditionsResponse> {
  const r = isRecord(json) ? json.result : null;
  if (!isRecord(r) || !Array.isArray(r.parameters) || !Array.isArray(r.preconditions) || !Array.isArray(r.stopConditions)) {
    return { ok: false, message: "Conditions response is malformed" };
  }
  return { ok: true, value: json as ProposeConditionsResponse };
}
