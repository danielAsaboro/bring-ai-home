import type { AssetIdentity } from "./asset-identity";
import type { CitedAnswer } from "./cited-answer";
import type { LabelFact } from "./label-facts";

export const SERVICE_URL = "http://127.0.0.1:4319";

export type AssistErrorKind = "service-offline" | "model-unavailable" | "rejected" | "failed";
export class AssistError extends Error {
  constructor(public kind: AssistErrorKind, message: string) {
    super(message);
  }
}

export async function postJson<T>(path: string, body: unknown, fetcher: typeof fetch = fetch): Promise<T> {
  let res: Response;
  try {
    res = await fetcher(`${SERVICE_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(body),
    });
  } catch {
    throw new AssistError("service-offline", "The local QVAC service is not running. Start it with npm run qvac:service.");
  }
  const payload = (await res.json().catch(() => ({}))) as { error?: string } & T;
  if (res.ok) return payload;
  const message = payload.error ?? `Service answered ${res.status}`;
  if (res.status === 503) throw new AssistError("model-unavailable", message);
  if (res.status === 400) throw new AssistError("rejected", message);
  throw new AssistError("failed", message);
}

async function toBase64(file: Blob): Promise<string> {
  const bytes = new Uint8Array(await file.arrayBuffer());
  let binary = "";
  for (let i = 0; i < bytes.length; i += 0x8000) binary += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return btoa(binary);
}

export async function imageBody(file: File) {
  return { fileName: file.name, mimeType: file.type, imageBase64: await toBase64(file) };
}

export type AssistClient = {
  readLabel(file: File): Promise<{ facts: LabelFact[]; model: string }>;
  identify(file: File): Promise<{ identity: AssetIdentity; model: string }>;
  ask(question: string, docIds: string[]): Promise<CitedAnswer & { model: string }>;
};

export const serviceClient: AssistClient = {
  async readLabel(file) {
    return postJson("/label", await imageBody(file));
  },
  async identify(file) {
    return postJson("/identify", await imageBody(file));
  },
  async ask(question, docIds) {
    return postJson("/ask", { question, docIds });
  },
};
