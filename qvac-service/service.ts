import type { ExtractionResult, KnownPerson } from "../src/features/circle/extraction";
import type { RecapDraft } from "./recap";

// Everything the native runtime can do for Circle. A missing entry means
// "not configured", never "pretend".
export type Capabilities = {
  transcribe?: (audio: Uint8Array, fileName: string) => Promise<RecapDraft>;
  extract?: (input: {
    transcript: string;
    people: KnownPerson[];
    today: string;
  }) => Promise<ExtractionResult>;
};

export type ServiceResponse = { status: number; body: unknown };

export const SERVICE_PORT = 4327;
export const MAX_BODY_BYTES = 12 * 1024 * 1024;

class BadRequest extends Error {}

function people(body: Record<string, unknown>): KnownPerson[] {
  const list = body.people;
  if (!Array.isArray(list) || list.length === 0 || list.length > 500) {
    throw new BadRequest("Missing people");
  }
  return list.map((p) => {
    const r = record(p);
    return { id: text(r, "id", 200), name: text(r, "name", 200) };
  });
}

function isoDay(body: Record<string, unknown>, key: string): string {
  const value = text(body, key, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) throw new BadRequest(`${key} must be YYYY-MM-DD`);
  return value;
}

function record(body: unknown): Record<string, unknown> {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new BadRequest("Expected a JSON object");
  }
  return body as Record<string, unknown>;
}

function text(body: Record<string, unknown>, key: string, max = 20_000): string {
  const value = body[key];
  if (typeof value !== "string" || !value.trim()) {
    throw new BadRequest(`Missing ${key}`);
  }
  if (value.length > max) throw new BadRequest(`${key} is too long`);
  return value;
}

type Route = {
  capability: keyof Capabilities;
  run: (caps: Required<Capabilities>, body: Record<string, unknown>) => Promise<unknown>;
};

const routes: Record<string, Route> = {
  "/recap/transcribe": {
    capability: "transcribe",
    run: (caps, body) => {
      const audio = Buffer.from(text(body, "audioBase64", MAX_BODY_BYTES), "base64");
      if (audio.length === 0) throw new BadRequest("Empty recording");
      return caps.transcribe(new Uint8Array(audio), text(body, "fileName", 200));
    },
  },
  "/recap/extract": {
    capability: "extract",
    run: (caps, body) =>
      caps.extract({
        transcript: text(body, "transcript"),
        people: people(body),
        today: isoDay(body, "today"),
      }),
  },
};

export function createService(capabilities: Capabilities) {
  return async function handle(
    method: string,
    path: string,
    body: unknown,
  ): Promise<ServiceResponse> {
    if (method === "GET" && path === "/health") {
      return {
        status: 200,
        body: {
          ok: true,
          service: "circle-qvac",
          capabilities: Object.fromEntries(
            Object.keys(routes).map((r) => [
              routes[r].capability,
              typeof capabilities[routes[r].capability] === "function",
            ]),
          ),
        },
      };
    }
    const route = routes[path];
    if (!route) return { status: 404, body: { error: "not-found" } };
    if (method !== "POST") return { status: 405, body: { error: "method-not-allowed" } };
    if (typeof capabilities[route.capability] !== "function") {
      return {
        status: 503,
        body: { error: "not-configured", capability: route.capability },
      };
    }
    try {
      const result = await route.run(capabilities as Required<Capabilities>, record(body));
      return { status: 200, body: result };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      if (error instanceof BadRequest) return { status: 400, body: { error: message } };
      return { status: 502, body: { error: "model-failed", message } };
    }
  };
}
