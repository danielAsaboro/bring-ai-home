// The HTTP contract between the Ledger UI and the local QVAC service.
// TypeScript types disappear at runtime, so both sides validate JSON by hand.

export type OcrBlock = {
  text: string;
  bbox: [number, number, number, number] | null;
  confidence: number | null;
};

export type ModelState = {
  kind: "ocr" | "llm" | "embeddings";
  id: string;
  state: "not_loaded" | "loading" | "ready" | "error";
};

export type HealthResponse = {
  service: "ready";
  models: ModelState[];
};

export type ReadReceiptRequest = {
  receiptId: string;
  fileName: string;
  pngBase64: string;
};

export type ReadReceiptResponse = {
  receiptId: string;
  sourceDigest: string;
  ocrModel: string;
  ocrMs: number | null;
  blocks: OcrBlock[];
};

export type ServiceError = { error: { code: string; message: string } };

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function isNonEmptyString(value: unknown): value is string {
  return typeof value === "string" && value.length > 0;
}

export const MAX_PNG_BASE64_LENGTH = 8_000_000;

export function parseReadReceiptRequest(value: unknown): Result<ReadReceiptRequest> {
  if (!isRecord(value)) return { ok: false, message: "Request body must be a JSON object" };
  const { receiptId, fileName, pngBase64 } = value;
  if (!isNonEmptyString(receiptId)) return { ok: false, message: "receiptId is required" };
  if (!isNonEmptyString(fileName)) return { ok: false, message: "fileName is required" };
  if (!isNonEmptyString(pngBase64)) return { ok: false, message: "pngBase64 is required" };
  if (pngBase64.length > MAX_PNG_BASE64_LENGTH) {
    return { ok: false, message: "Receipt image is too large" };
  }
  return { ok: true, value: { receiptId, fileName, pngBase64 } };
}

function parseBlock(value: unknown): OcrBlock | null {
  if (!isRecord(value) || typeof value.text !== "string") return null;
  const bbox = value.bbox;
  const validBbox =
    Array.isArray(bbox) &&
    bbox.length === 4 &&
    bbox.every((n) => typeof n === "number" && Number.isFinite(n));
  if (bbox !== null && bbox !== undefined && !validBbox) return null;
  const confidence = value.confidence;
  if (
    confidence !== null &&
    confidence !== undefined &&
    (typeof confidence !== "number" || confidence < 0 || confidence > 1)
  ) {
    return null;
  }
  return {
    text: value.text,
    bbox: validBbox ? (bbox as [number, number, number, number]) : null,
    confidence: typeof confidence === "number" ? confidence : null,
  };
}

export function parseReadReceiptResponse(value: unknown): Result<ReadReceiptResponse> {
  if (!isRecord(value)) return { ok: false, message: "Response must be a JSON object" };
  const { receiptId, sourceDigest, ocrModel, ocrMs, blocks } = value;
  if (!isNonEmptyString(receiptId) || !isNonEmptyString(sourceDigest) || !isNonEmptyString(ocrModel)) {
    return { ok: false, message: "Response is missing receipt identity" };
  }
  if (ocrMs !== null && (typeof ocrMs !== "number" || ocrMs < 0)) {
    return { ok: false, message: "ocrMs must be a non-negative number or null" };
  }
  if (!Array.isArray(blocks)) return { ok: false, message: "blocks must be an array" };
  const parsed: OcrBlock[] = [];
  for (const block of blocks) {
    const item = parseBlock(block);
    if (!item) return { ok: false, message: "A block has an invalid shape" };
    parsed.push(item);
  }
  return {
    ok: true,
    value: { receiptId, sourceDigest, ocrModel, ocrMs: ocrMs as number | null, blocks: parsed },
  };
}

export function parseHealthResponse(value: unknown): Result<HealthResponse> {
  if (!isRecord(value) || value.service !== "ready" || !Array.isArray(value.models)) {
    return { ok: false, message: "Invalid health response" };
  }
  return { ok: true, value: value as HealthResponse };
}

export function parseServiceError(value: unknown): ServiceError | null {
  if (!isRecord(value) || !isRecord(value.error)) return null;
  const { code, message } = value.error;
  if (!isNonEmptyString(code) || !isNonEmptyString(message)) return null;
  return { error: { code, message } };
}

export type ProposeResponse = {
  model: string;
  raw: string;
  result: { ok: true; proposal: { merchant: string; category: string } } | { ok: false; reason: string };
};

export function parseProposeRequest(
  value: unknown,
): Result<{ merchantText: string; lineDescriptions: string[] }> {
  if (!isRecord(value)) return { ok: false, message: "Request body must be a JSON object" };
  const { merchantText, lineDescriptions } = value;
  if (typeof merchantText !== "string" || merchantText.length > 200) {
    return { ok: false, message: "merchantText must be a string under 200 characters" };
  }
  if (
    !Array.isArray(lineDescriptions) ||
    lineDescriptions.length > 50 ||
    !lineDescriptions.every((d) => typeof d === "string" && d.length <= 200)
  ) {
    return { ok: false, message: "lineDescriptions must be up to 50 short strings" };
  }
  return { ok: true, value: { merchantText, lineDescriptions: lineDescriptions as string[] } };
}

export function parseProposeResponse(value: unknown): Result<ProposeResponse> {
  if (!isRecord(value) || !isNonEmptyString(value.model) || typeof value.raw !== "string") {
    return { ok: false, message: "Invalid proposal response" };
  }
  const result = value.result;
  if (!isRecord(result) || typeof result.ok !== "boolean") {
    return { ok: false, message: "Invalid proposal result" };
  }
  return { ok: true, value: value as ProposeResponse };
}

export type SimilarResponse = { model: string; matches: { entryId: string; score: number }[] };

export function parseSimilarRequest(value: unknown): Result<{ text: string }> {
  if (!isRecord(value) || !isNonEmptyString(value.text) || value.text.length > 500) {
    return { ok: false, message: "text must be a non-empty string under 500 characters" };
  }
  return { ok: true, value: { text: value.text } };
}

export function parseSimilarResponse(value: unknown): Result<SimilarResponse> {
  if (!isRecord(value) || !isNonEmptyString(value.model) || !Array.isArray(value.matches)) {
    return { ok: false, message: "Invalid similarity response" };
  }
  const ok = value.matches.every(
    (m) => isRecord(m) && isNonEmptyString(m.entryId) && typeof m.score === "number",
  );
  return ok ? { ok: true, value: value as SimilarResponse } : { ok: false, message: "Invalid match" };
}
