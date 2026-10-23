import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { parseCheckFrameRequest } from "../src/features/lookout/check-contract.ts";
import { buildConditionPrompt, parseVerdict } from "../src/features/lookout/verdict.ts";

export const SERVICE_PORT = 4319;
const MAX_BODY_BYTES = 2_100_000;

// The only thing the server knows about inference. QVAC lives behind it.
export type FrameChecker = {
  model: string;
  check(png: Buffer, prompt: string): Promise<string>;
};

export function isAllowedOrigin(origin: string | undefined): boolean {
  if (!origin) return true; // curl and local scripts send no Origin
  try {
    const url = new URL(origin);
    return url.protocol === "http:" && ["localhost", "127.0.0.1", "[::1]"].includes(url.hostname);
  } catch {
    return false;
  }
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

function fail(res: ServerResponse, status: number, code: string, message: string, origin?: string) {
  send(res, status, { error: { code, message } }, origin);
}

async function readJson(req: IncomingMessage): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > MAX_BODY_BYTES) throw new Error("too_large");
    chunks.push(chunk as Buffer);
  }
  return JSON.parse(Buffer.concat(chunks).toString("utf8"));
}

export function createLookoutServer({ checker }: { checker: FrameChecker | null }) {
  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (!isAllowedOrigin(origin)) return fail(res, 403, "origin_denied", "Only local pages may call Lookout's service");
    if (req.method === "OPTIONS") return send(res, 204, null, origin);

    if (req.method === "GET" && req.url === "/health") {
      return send(
        res,
        200,
        { service: "ready", vision: checker ? { model: checker.model, state: "configured" } : { state: "not_configured" } },
        origin,
      );
    }

    if (req.method === "POST" && req.url === "/v1/check-frame") {
      let body: unknown;
      try {
        body = await readJson(req);
      } catch (error) {
        const tooLarge = error instanceof Error && error.message === "too_large";
        return fail(res, tooLarge ? 413 : 400, tooLarge ? "too_large" : "bad_json", tooLarge ? "Frame is too large" : "Body must be JSON", origin);
      }
      const parsed = parseCheckFrameRequest(body);
      if (!parsed.ok) return fail(res, 400, "bad_request", parsed.message, origin);
      let prompt: string;
      try {
        prompt = buildConditionPrompt(parsed.value.condition);
      } catch (error) {
        return fail(res, 400, "bad_condition", (error as Error).message, origin);
      }
      if (!checker) return fail(res, 503, "vision_unavailable", "The local vision model is not configured", origin);

      const png = Buffer.from(parsed.value.pngBase64, "base64");
      const frameDigest = createHash("sha256").update(png).digest("hex");
      const startedAt = Date.now();
      try {
        const raw = await checker.check(png, prompt);
        return send(
          res,
          200,
          { frameId: parsed.value.frameId, frameDigest, model: checker.model, raw, verdict: parseVerdict(raw), ms: Date.now() - startedAt },
          origin,
        );
      } catch (error) {
        return fail(res, 503, "vision_failed", error instanceof Error ? error.message : "Vision check failed", origin);
      }
    }

    return fail(res, 404, "not_found", "Unknown route", origin);
  });
}
