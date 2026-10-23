import type { ContextMatch, Passage } from "./context";
import type { ExtractionResult, KnownPerson } from "./extraction";

// The browser never imports @qvac/sdk. It talks to the loopback service.
export const DEFAULT_SERVICE_URL = "http://127.0.0.1:4327";

export type ServiceHealth = {
  ok: boolean;
  capabilities: Record<string, boolean>;
};

export type ProposedRecap = {
  status: "proposed";
  model: string;
  transcript: string;
  durationMs: number;
};

export class ServiceError extends Error {
  constructor(
    message: string,
    readonly code: string,
  ) {
    super(message);
  }
}

type FetchLike = (input: string, init?: RequestInit) => Promise<Response>;

export function createServiceClient(
  baseUrl: string = DEFAULT_SERVICE_URL,
  fetchImpl: FetchLike = (input, init) => fetch(input, init),
) {
  async function call(path: string, init?: RequestInit): Promise<unknown> {
    let res: Response;
    try {
      res = await fetchImpl(`${baseUrl}${path}`, init);
    } catch {
      throw new ServiceError("The local AI service is not running", "unreachable");
    }
    const body = (await res.json().catch(() => ({}))) as Record<string, unknown>;
    if (!res.ok) {
      const code = typeof body.error === "string" ? body.error : `http-${res.status}`;
      const message = typeof body.message === "string" ? body.message : code;
      throw new ServiceError(message, code);
    }
    return body;
  }

  function post(path: string, payload: unknown) {
    return call(path, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(payload),
    });
  }

  return {
    async health(): Promise<ServiceHealth> {
      const body = (await call("/health")) as ServiceHealth;
      return { ok: body.ok === true, capabilities: body.capabilities ?? {} };
    },
    async transcribe(audioBase64: string, fileName: string): Promise<ProposedRecap> {
      const body = (await post("/recap/transcribe", { audioBase64, fileName })) as ProposedRecap;
      if (body.status !== "proposed" || typeof body.transcript !== "string") {
        throw new ServiceError("Unexpected transcription response", "bad-response");
      }
      return body;
    },
    async extract(
      transcript: string,
      people: KnownPerson[],
      today: string,
    ): Promise<ExtractionResult> {
      const body = (await post("/recap/extract", { transcript, people, today })) as ExtractionResult;
      if (body.status !== "proposed" || !Array.isArray(body.proposals)) {
        throw new ServiceError("Unexpected extraction response", "bad-response");
      }
      return body;
    },
    async retrieve(
      query: string,
      passages: Passage[],
    ): Promise<{ model: string; matches: ContextMatch[] }> {
      const body = (await post("/context/retrieve", { query, passages })) as {
        model: string;
        matches: ContextMatch[];
      };
      if (!Array.isArray(body.matches)) {
        throw new ServiceError("Unexpected retrieval response", "bad-response");
      }
      return body;
    },
    post,
  };
}

export type ServiceClient = ReturnType<typeof createServiceClient>;
