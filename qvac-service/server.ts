import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import type { LabelFact, OcrBlock } from "../src/features/homebook/label-facts.ts";
import { proposeLabelFacts } from "../src/features/homebook/label-facts.ts";

export const SERVICE_PORT = 4319;
const MAX_BODY_BYTES = 6 * 1024 * 1024;
const IMAGE_TYPES = new Set(["image/png", "image/jpeg"]);

export type LabelReader = (image: Buffer) => Promise<{ blocks: OcrBlock[]; model: string }>;

export type Capabilities = {
  label: LabelReader | null;
};

export type ImageRequest = { fileName: string; mimeType: string; image: Buffer };

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and other local tools send no Origin
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function parseImageRequest(value: unknown): ImageRequest {
  const v = value as { fileName?: unknown; mimeType?: unknown; imageBase64?: unknown } | null;
  if (!v || typeof v.fileName !== "string" || typeof v.imageBase64 !== "string" || typeof v.mimeType !== "string") {
    throw new Error("Request must contain fileName, mimeType, and imageBase64");
  }
  if (!IMAGE_TYPES.has(v.mimeType)) throw new Error("Only PNG and JPEG images are accepted");
  const image = Buffer.from(v.imageBase64, "base64");
  if (image.length === 0) throw new Error("The image is empty");
  return { fileName: v.fileName, mimeType: v.mimeType, image };
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

type Route = (body: unknown) => Promise<unknown>;

export class Unavailable extends Error {}

// The service proposes. It never writes to the binder. The browser decides.
export function createHomebookServer(capabilities: Capabilities) {
  const routes: Record<string, Route> = {
    "/label": async (body) => {
      const request = parseImageRequest(body);
      if (!capabilities.label) throw new Unavailable("Label reading is not available");
      const { blocks, model } = await capabilities.label(request.image);
      const facts: LabelFact[] = proposeLabelFacts(blocks);
      return { kind: "proposed-label-facts", fileName: request.fileName, model, blocks, facts };
    },
  };

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) return send(res, 403, { error: "Origin not allowed" });
    if (req.method === "OPTIONS") return send(res, 204, null, origin);
    if (req.method === "GET" && req.url === "/health") {
      const available = Object.fromEntries(Object.entries(capabilities).map(([k, v]) => [k, v !== null]));
      return send(res, 200, { ok: true, capabilities: available }, origin);
    }
    const route = req.method === "POST" && req.url ? routes[req.url] : undefined;
    if (!route) return send(res, 404, { error: "Not found" }, origin);
    let body: unknown;
    try {
      body = await readJson(req);
    } catch (error) {
      return send(res, 400, { error: (error as Error).message }, origin);
    }
    try {
      return send(res, 200, await route(body), origin);
    } catch (error) {
      if (error instanceof Unavailable) return send(res, 503, { error: error.message }, origin);
      const message = (error as Error).message;
      const status = /^(Request|Only|The image)/.test(message) ? 400 : 502;
      return send(res, status, { error: message }, origin);
    }
  });
}
