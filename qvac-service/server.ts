import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import {
  parseClaimProposals,
  parseProposeRequest,
  type ProposeRequest,
} from "../src/features/deck/claim-proposals.ts";
import type { ScoredChunk } from "../src/features/deck/notes-index.ts";

export const SERVICE_PORT = 4321;
const MAX_BODY_BYTES = 256 * 1024;

export type NotesRetriever = (query: string) => Promise<{ passages: ScoredChunk[]; model: string }>;

// Retrieves sections, then asks the LLM. Returns raw model text for the app to validate.
export type ClaimProposer = (request: ProposeRequest) => Promise<{ text: string; passages: ScoredChunk[]; model: string }>;

export type Capabilities = {
  retrieve: NotesRetriever | null;
  propose: ClaimProposer | null;
};

export class Unavailable extends Error {}
export class BadRequest extends Error {}

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and other local tools send no Origin
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function parseQuery(value: unknown): string {
  const v = value as { query?: unknown } | null;
  if (!v || typeof v.query !== "string" || !v.query.trim() || v.query.length > 300) {
    throw new BadRequest("Request must contain a query of at most 300 characters");
  }
  return v.query.trim();
}

function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  res.writeHead(status, {
    "content-type": "application/json",
    ...(origin ? { "access-control-allow-origin": origin, vary: "Origin" } : {}),
    "access-control-allow-headers": "content-type",
    "access-control-allow-methods": "GET, POST, OPTIONS",
  });
  res.end(status === 204 ? undefined : JSON.stringify(body));
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new BadRequest("Request is too large");
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new BadRequest("Request body is not JSON");
  }
}

type Route = (body: unknown) => Promise<unknown>;

// The service proposes. It never writes to a deck. The browser decides.
export function createDeckServer(capabilities: Capabilities) {
  const routes: Record<string, Route> = {
    "/retrieve": async (body) => {
      const query = parseQuery(body);
      if (!capabilities.retrieve) throw new Unavailable("Note retrieval is not available");
      return { query, ...(await capabilities.retrieve(query)) };
    },
    "/propose": async (body) => {
      let request: ProposeRequest;
      try {
        request = parseProposeRequest(body);
      } catch (error) {
        throw new BadRequest((error as Error).message);
      }
      if (!capabilities.propose) throw new Unavailable("Card proposals are not available");
      const { text, passages, model } = await capabilities.propose(request);
      if (passages.length === 0) return { model, passages, proposals: [], dropped: [] };
      return { model, passages, ...parseClaimProposals(text, passages) };
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
    try {
      return send(res, 200, await route(await readJson(req)), origin);
    } catch (error) {
      if (error instanceof BadRequest) return send(res, 400, { error: error.message }, origin);
      if (error instanceof Unavailable) return send(res, 503, { error: error.message }, origin);
      return send(res, 502, { error: (error as Error).message }, origin);
    }
  });
}
