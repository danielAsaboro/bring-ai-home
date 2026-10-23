import type { ClaimProposal } from "./claim-proposals";
import type { ScoredChunk } from "./notes-index";

export const SERVICE_URL = "http://127.0.0.1:4321";

export type AssistErrorKind = "service-stopped" | "unavailable" | "rejected" | "failed";

export class AssistError extends Error {
  constructor(
    readonly kind: AssistErrorKind,
    message: string,
  ) {
    super(message);
  }
}

export type RetrieveResult = { query: string; model: string; passages: ScoredChunk[] };

export type ProposeResult = {
  model: string;
  passages: ScoredChunk[];
  proposals: ClaimProposal[];
  dropped: { title: string; reason: string }[];
};

export type AssistClient = {
  retrieve(query: string): Promise<RetrieveResult>;
  propose(topic: string, audience: string): Promise<ProposeResult>;
};

// Every failure becomes one of four kinds, so the UI can say what went wrong
// and the deck stays exactly as it was.
export function createAssistClient(baseUrl = SERVICE_URL, fetchImpl: typeof fetch = (...a) => fetch(...a)): AssistClient {
  async function post<T>(path: string, body: unknown): Promise<T> {
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}${path}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(body),
      });
    } catch {
      throw new AssistError("service-stopped", "The local QVAC service is not running");
    }
    const payload = (await res.json().catch(() => ({}))) as { error?: string };
    if (res.status === 503) throw new AssistError("unavailable", payload.error ?? "The model is not loaded yet");
    if (res.status === 400) throw new AssistError("rejected", payload.error ?? "The request was rejected");
    if (!res.ok) throw new AssistError("failed", payload.error ?? `The service answered ${res.status}`);
    return payload as T;
  }

  return {
    retrieve: (query) => post<RetrieveResult>("/retrieve", { query }),
    propose: (topic, audience) => post<ProposeResult>("/propose", { topic, audience }),
  };
}
