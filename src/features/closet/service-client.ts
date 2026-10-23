// The browser's only door to local AI. Every failure is classified so the UI
// can say what went wrong and keep the manual path open.

export const SERVICE_URL = "http://127.0.0.1:4320";

export type ServiceFailure =
  | "service-unreachable" // nothing listening: run `npm run qvac:service`
  | "model-unavailable" // 503: the service is up, this model is not loaded
  | "rejected-request" // 400: the app sent something the service refused
  | "inference-failed" // 502: the model ran and failed
  | "bad-response"; // the service answered with something we cannot read

export type ServiceResult<T> = { ok: true; value: T } | { ok: false; failure: ServiceFailure; message: string };

type Fetch = typeof fetch;

export async function callService<T>(
  path: string,
  body: unknown,
  read: (json: unknown) => T,
  fetchFn: Fetch = fetch,
): Promise<ServiceResult<T>> {
  let res: Response;
  try {
    res = await fetchFn(`${SERVICE_URL}${path}`, {
      method: body === undefined ? "GET" : "POST",
      headers: { "content-type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
    });
  } catch {
    return { ok: false, failure: "service-unreachable", message: "The local Closet service is not running." };
  }
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    return { ok: false, failure: "bad-response", message: "The local service answered with unreadable data." };
  }
  if (!res.ok) {
    const message = (json as { error?: string } | null)?.error ?? `HTTP ${res.status}`;
    const failure: ServiceFailure =
      res.status === 503 ? "model-unavailable" : res.status === 400 ? "rejected-request" : "inference-failed";
    return { ok: false, failure, message };
  }
  try {
    return { ok: true, value: read(json) };
  } catch (error) {
    return { ok: false, failure: "bad-response", message: (error as Error).message };
  }
}

export function checkHealth(fetchFn?: Fetch) {
  return callService(
    "/health",
    undefined,
    (json) => {
      const caps = (json as { capabilities?: unknown }).capabilities;
      if (!Array.isArray(caps) || !caps.every((c) => typeof c === "string")) throw new Error("Malformed health");
      return caps as string[];
    },
    fetchFn,
  );
}

export function describeGarment(image: { name: string; dataUrl: string }, fetchFn?: Fetch) {
  return callService(
    "/describe",
    image,
    (json) => {
      const v = json as { description?: unknown; model?: unknown };
      if (typeof v.description !== "string" || typeof v.model !== "string") throw new Error("Malformed description");
      return { description: v.description, model: v.model };
    },
    fetchFn,
  );
}

export function proposeDetails(description: string, fetchFn?: Fetch) {
  return callService(
    "/details",
    { description },
    (json) => {
      const v = json as { raw?: unknown; model?: unknown };
      if (typeof v.raw !== "string" || typeof v.model !== "string") throw new Error("Malformed details");
      return { raw: v.raw, model: v.model };
    },
    fetchFn,
  );
}

export function classifyGarment(image: { name: string; dataUrl: string }, fetchFn?: Fetch) {
  return callService(
    "/classify",
    image,
    (json) => {
      const v = json as { results?: unknown; model?: unknown };
      if (!Array.isArray(v.results) || typeof v.model !== "string") throw new Error("Malformed classification");
      const results = v.results.filter(
        (r): r is { label: string; confidence: number } =>
          typeof r?.label === "string" && typeof r?.confidence === "number",
      );
      return { results, model: v.model };
    },
    fetchFn,
  );
}

export function embedTexts(texts: string[], fetchFn?: Fetch) {
  return callService(
    "/embed",
    { texts },
    (json) => {
      const v = json as { embeddings?: unknown; model?: unknown };
      const vectors = v.embeddings;
      if (
        typeof v.model !== "string" ||
        !Array.isArray(vectors) ||
        vectors.length !== texts.length ||
        !vectors.every((e) => Array.isArray(e) && e.length > 0 && e.length === vectors[0].length && e.every(Number.isFinite))
      ) {
        throw new Error("Expected one finite vector of equal length per text");
      }
      return { embeddings: vectors as number[][], model: v.model };
    },
    fetchFn,
  );
}
