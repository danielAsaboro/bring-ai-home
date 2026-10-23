import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

export const SERVICE_PORT = 4319;
const MAX_BODY_BYTES = 32_768;
const MAX_EXAMPLES = 12;

export type ExamplePair = { before: string; after: string };
export type Proposer = (examples: ExamplePair[]) => Promise<{ raw: string; model: string }>;

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and local scripts send no Origin
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && (url.hostname === "localhost" || url.hostname === "127.0.0.1");
  } catch {
    return false;
  }
}

export function parseExamples(value: unknown): ExamplePair[] {
  const examples = (value as { examples?: unknown } | null)?.examples;
  if (
    !Array.isArray(examples) ||
    examples.length === 0 ||
    examples.length > MAX_EXAMPLES ||
    !examples.every((e) => typeof e?.before === "string" && typeof e?.after === "string")
  ) {
    throw new Error(`Request must contain 1 to ${MAX_EXAMPLES} examples with before and after text`);
  }
  return examples.map((e: ExamplePair) => ({ before: e.before, after: e.after }));
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
    if (size > MAX_BODY_BYTES) throw new Error("Request is too large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

// The service proposes. It never stores patterns. The browser decides.
export function createPatternServer(options: { proposer: Proposer | null }) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) return send(res, 403, { error: "Origin not allowed" });
    if (req.method === "OPTIONS") return send(res, 204, null, origin);
    if (req.method === "GET" && req.url === "/health") {
      return send(res, 200, { ok: true, proposing: options.proposer !== null }, origin);
    }
    if (req.method !== "POST" || req.url !== "/propose") return send(res, 404, { error: "Not found" }, origin);
    let examples: ExamplePair[];
    try {
      examples = parseExamples(await readJson(req));
    } catch (error) {
      return send(res, 400, { error: (error as Error).message }, origin);
    }
    if (!options.proposer) return send(res, 503, { error: "Rule proposals are not available" }, origin);
    try {
      return send(res, 200, await options.proposer(examples), origin);
    } catch (error) {
      return send(res, 502, { error: (error as Error).message }, origin);
    }
  });
}
