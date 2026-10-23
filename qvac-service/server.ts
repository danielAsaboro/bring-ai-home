import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export const SERVICE_PORT = 4320;
const MAX_BODY_BYTES = 4 * 1024 * 1024;

export type GarmentImage = { name: string; bytes: Uint8Array; mime: "image/png" | "image/jpeg" };

// Everything the local models can do for Closet. Each capability is optional:
// a missing one answers 503 and the app keeps its manual path.
export type ClosetEngine = {
  describe?: (image: GarmentImage) => Promise<{ description: string; model: string }>;
  // Returns the model's raw JSON text. The browser validates it.
  details?: (description: string) => Promise<{ raw: string; model: string }>;
  // Returns every label and confidence. The browser decides whether one is usable.
  embed?: (texts: string[]) => Promise<{ embeddings: number[][]; model: string }>;
  classify?: (image: GarmentImage) => Promise<{ results: { label: string; confidence: number }[]; model: string }>;
};

function requireText(body: unknown, key: string, max = 2000): string {
  const value = (body as Record<string, unknown> | null)?.[key];
  if (typeof value !== "string" || !value.trim()) throw new Error(`Request must contain ${key}`);
  if (value.length > max) throw new Error(`${key} is too long`);
  return value;
}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and other local tools send no Origin
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function parseGarmentImage(value: unknown): GarmentImage {
  const v = value as { name?: unknown; dataUrl?: unknown } | null;
  if (!v || typeof v.name !== "string" || typeof v.dataUrl !== "string") {
    throw new Error("Request must contain name and dataUrl");
  }
  const match = /^data:(image\/png|image\/jpeg);base64,([A-Za-z0-9+/=]+)$/.exec(v.dataUrl);
  if (!match) throw new Error("Only PNG or JPEG data URLs are accepted");
  const bytes = new Uint8Array(Buffer.from(match[2], "base64"));
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const isJpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  const mime = match[1] as GarmentImage["mime"];
  if ((mime === "image/png" && !isPng) || (mime === "image/jpeg" && !isJpeg)) {
    throw new Error("Image bytes do not match the declared type");
  }
  return { name: v.name.slice(0, 120), bytes, mime };
}

export function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  res.writeHead(status, {
    "content-type": "application/json",
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

export async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request is too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

type Route = (body: unknown, engine: ClosetEngine) => Promise<unknown> | null;

// Each route returns null when its capability is not loaded.
const ROUTES: Record<string, Route> = {
  "/describe": (body, engine) => {
    if (!engine.describe) return null;
    const image = parseGarmentImage(body);
    return engine.describe(image);
  },
  "/details": (body, engine) => {
    if (!engine.details) return null;
    return engine.details(requireText(body, "description"));
  },
  "/embed": (body, engine) => {
    if (!engine.embed) return null;
    const texts = (body as { texts?: unknown } | null)?.texts;
    if (!Array.isArray(texts) || texts.length === 0 || texts.length > 64) {
      throw new Error("Request must contain 1 to 64 texts");
    }
    if (!texts.every((t) => typeof t === "string" && t.trim() && t.length <= 1000)) {
      throw new Error("Each text must be a non-empty string under 1000 characters");
    }
    return engine.embed(texts as string[]);
  },
  "/classify": (body, engine) => {
    if (!engine.classify) return null;
    return engine.classify(parseGarmentImage(body));
  },
};

export function capabilities(engine: ClosetEngine) {
  return Object.keys(ROUTES)
    .map((route) => route.slice(1))
    .filter((name) => typeof (engine as Record<string, unknown>)[name] === "function");
}

// The service proposes. It never saves anything. The browser decides.
export function createClosetServer(engine: ClosetEngine) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) return send(res, 403, { error: "Origin not allowed" });
    if (req.method === "OPTIONS") return send(res, 204, null, origin);
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, capabilities: capabilities(engine) }, origin);
    }
    const route = req.method === "POST" && req.url ? ROUTES[req.url] : undefined;
    if (!route) return send(res, 404, { error: "Not found" }, origin);

    let body: unknown;
    try {
      body = await readJson(req);
    } catch (error) {
      return send(res, 400, { error: (error as Error).message }, origin);
    }
    let pending: Promise<unknown> | null;
    try {
      pending = route(body, engine);
    } catch (error) {
      return send(res, 400, { error: (error as Error).message }, origin);
    }
    if (!pending) return send(res, 503, { error: "This local model is not available" }, origin);
    try {
      return send(res, 200, await pending, origin);
    } catch (error) {
      return send(res, 502, { error: (error as Error).message }, origin);
    }
  });
}
