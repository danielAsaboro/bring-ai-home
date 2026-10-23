// The HTTP contract between the Lookout UI and the local QVAC service.
// JSON from another process can be anything, so both sides validate by hand.
import type { Verdict } from "./verdict";

export const SERVICE_URL = "http://127.0.0.1:4319";
export const MAX_PNG_BASE64_LENGTH = 2_000_000;

export type CheckFrameRequest = { frameId: string; condition: string; pngBase64: string };

export type CheckFrameResponse = {
  frameId: string;
  frameDigest: string;
  model: string;
  raw: string;
  verdict: Verdict;
  ms: number;
};

export type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function isRecord(v: unknown): v is Record<string, unknown> {
  return typeof v === "object" && v !== null && !Array.isArray(v);
}

function isText(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

export function parseCheckFrameRequest(value: unknown): Result<CheckFrameRequest> {
  if (!isRecord(value)) return { ok: false, message: "Request body must be a JSON object" };
  const { frameId, condition, pngBase64 } = value;
  if (!isText(frameId)) return { ok: false, message: "frameId is required" };
  if (!isText(condition)) return { ok: false, message: "condition is required" };
  if (!isText(pngBase64)) return { ok: false, message: "pngBase64 is required" };
  if (pngBase64.length > MAX_PNG_BASE64_LENGTH) return { ok: false, message: "Frame is too large" };
  return { ok: true, value: { frameId, condition, pngBase64 } };
}

export function parseCheckFrameResponse(value: unknown): Result<CheckFrameResponse> {
  if (!isRecord(value)) return { ok: false, message: "Response must be a JSON object" };
  const { frameId, frameDigest, model, raw, verdict, ms } = value;
  if (!isText(frameId) || !isText(frameDigest) || !isText(model) || typeof raw !== "string") {
    return { ok: false, message: "Response is missing frame, digest, model, or raw text" };
  }
  if (typeof ms !== "number" || !isRecord(verdict)) return { ok: false, message: "Response is missing verdict" };
  const { answer, reason } = verdict;
  if ((answer !== "yes" && answer !== "no" && answer !== "unclear") || typeof reason !== "string") {
    return { ok: false, message: "Verdict must be yes, no, or unclear" };
  }
  return { ok: true, value: { frameId, frameDigest, model, raw, verdict: { answer, reason }, ms } };
}
