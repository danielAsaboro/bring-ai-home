import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import type { Memory } from "../src/features/chronicle/archive";

export const SERVICE_PORT = 4318;
const MAX_BODY_BYTES = 16_384;

export type CaptionDrafter = (memory: Memory) => Promise<{ draft: string; model: string }>;

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and other local tools send no Origin
  try {
    const url = new URL(origin);
    return (
      url.protocol === "http:" &&
      (url.hostname === "localhost" || url.hostname === "127.0.0.1")
    );
  } catch {
    return false;
  }
}

export function parseMemory(value: unknown): Memory {
  const v = value as Partial<Memory> | null;
  if (
    !v ||
    typeof v.id !== "string" ||
    typeof v.title !== "string" ||
    typeof v.date !== "string" ||
    typeof v.caption !== "string" ||
    !Array.isArray(v.people) ||
    !v.people.every((p) => typeof p === "string")
  ) {
    throw new Error("Request must contain one memory");
  }
  return {
    id: v.id,
    title: v.title,
    date: v.date,
    people: v.people,
    caption: v.caption,
    photo: typeof v.photo === "string" ? v.photo : null,
  };
}

function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  res.writeHead(status, {
    "content-type": "application/json",
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("Request is too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// The service drafts. It never saves anything. The browser decides.
export function createCaptionServer(options: { drafter: CaptionDrafter | null }) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) return send(res, 403, { error: "Origin not allowed" });
    if (req.method === "OPTIONS") return send(res, 204, null, origin);
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, drafting: options.drafter !== null }, origin);
    }
    if (req.method !== "POST" || req.url !== "/caption") {
      return send(res, 404, { error: "Not found" }, origin);
    }
    let memory: Memory;
    try {
      memory = parseMemory(await readJson(req));
    } catch (error) {
      return send(res, 400, { error: (error as Error).message }, origin);
    }
    if (!options.drafter) {
      return send(res, 503, { error: "Caption drafting is not available" }, origin);
    }
    try {
      const result = await options.drafter(memory);
      return send(res, 200, { memoryId: memory.id, ...result }, origin);
    } catch (error) {
      return send(res, 502, { error: (error as Error).message }, origin);
    }
  });
}
