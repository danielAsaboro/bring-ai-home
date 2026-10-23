import {
  parseFindTapeResponse,
  parseProposeConditionsResponse,
  parseProposeStepsResponse,
  parseReadScreenshotResponse,
  parseServiceError,
  parseTranscribeResponse,
  SERVICE_URL,
  type FindTapeRequest,
  type FindTapeResponse,
  type Parsed,
  type ProposeConditionsResponse,
  type ProposeStepsRequest,
  type ProposeStepsResponse,
  type ReadScreenshotResponse,
  type TranscribeResponse,
} from "./service-contract.ts";

export type ClientResult<T> = { ok: true; value: T } | { ok: false; code: string; message: string };

// Every call can fail in three different ways, and the UI says which one happened.
export async function postJson<T>(
  path: string,
  body: unknown,
  parse: (json: unknown) => Parsed<T>,
  fetchImpl: typeof fetch = fetch,
): Promise<ClientResult<T>> {
  let response: Response;
  try {
    response = await fetchImpl(`${SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    return {
      ok: false,
      code: "service_unreachable",
      message: "The local QVAC service is not running. Start it with npm run qvac:service. Manual editing still works.",
    };
  }
  let json: unknown;
  try {
    json = await response.json();
  } catch {
    return { ok: false, code: "invalid_response", message: "The service answered with something that is not JSON" };
  }
  if (!response.ok) {
    const error = parseServiceError(json);
    return { ok: false, code: error?.code ?? "service_error", message: error?.message ?? `HTTP ${response.status}` };
  }
  const parsed = parse(json);
  return parsed.ok ? parsed : { ok: false, code: "invalid_response", message: parsed.message };
}

export async function fileToBase64(file: Blob) {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  }
  return btoa(binary);
}

export async function transcribeRecording(
  file: File,
  fetchImpl?: typeof fetch,
): Promise<ClientResult<TranscribeResponse>> {
  const audioBase64 = await fileToBase64(file);
  return postJson("/v1/transcribe", { fileName: file.name, audioBase64 }, parseTranscribeResponse, fetchImpl);
}

export async function readScreenshot(
  file: File,
  fetchImpl?: typeof fetch,
): Promise<ClientResult<ReadScreenshotResponse>> {
  const imageBase64 = await fileToBase64(file);
  return postJson("/v1/read-screenshot", { fileName: file.name, imageBase64 }, parseReadScreenshotResponse, fetchImpl);
}

export function proposeSteps(body: ProposeStepsRequest, fetchImpl?: typeof fetch): Promise<ClientResult<ProposeStepsResponse>> {
  return postJson("/v1/propose-steps", body, parseProposeStepsResponse, fetchImpl);
}

export function proposeConditions(transcript: string, fetchImpl?: typeof fetch): Promise<ClientResult<ProposeConditionsResponse>> {
  return postJson("/v1/propose-conditions", { transcript }, parseProposeConditionsResponse, fetchImpl);
}

export function findTape(body: FindTapeRequest, fetchImpl?: typeof fetch): Promise<ClientResult<FindTapeResponse>> {
  return postJson("/v1/find-tape", body, parseFindTapeResponse, fetchImpl);
}
