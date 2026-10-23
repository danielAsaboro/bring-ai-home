import { createHash } from "node:crypto";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";

import { toNarration, type NarrationSegment } from "../src/features/replay/narration.ts";
import { parseTranscribeRequest, type ModelState } from "../src/features/replay/service-contract.ts";

// Each model sits behind its own small door. Tests inject fakes; main.ts injects QVAC.
export type Transcriber = {
  modelState(): ModelState;
  transcribe(wavPath: string): Promise<NarrationSegment[]>;
};

export type ServiceModels = { transcriber?: Transcriber };

const LOOPBACK_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

// Plain fields, not parameter properties: Node's type stripping cannot run those.
export class RequestError extends Error {
  status: number;
  code: string;
  constructor(status: number, code: string, message: string) {
    super(message);
    this.status = status;
    this.code = code;
  }
}

function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

async function readJson(req: IncomingMessage, limit: number): Promise<unknown> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new RequestError(413, "too_large", "Request body is too large");
    chunks.push(chunk as Buffer);
  }
  try {
    return JSON.parse(Buffer.concat(chunks).toString("utf8"));
  } catch {
    throw new RequestError(400, "invalid_json", "Body must be JSON");
  }
}

type Route = (req: IncomingMessage) => Promise<unknown>;

export function createReplayServer(models: ServiceModels) {
  const routes = new Map<string, Route>();

  if (models.transcriber) {
    const transcriber = models.transcriber;
    routes.set("/v1/transcribe", async (req) => {
      const parsed = parseTranscribeRequest(await readJson(req, 50_000_000));
      if (!parsed.ok) throw new RequestError(400, "invalid_request", parsed.message);
      const audio = Buffer.from(parsed.value.audioBase64, "base64");
      const sourceDigest = createHash("sha256").update(audio).digest("hex");
      // The recording lives on disk only for the length of this request.
      const directory = await mkdtemp(path.join(tmpdir(), "replay-"));
      try {
        const wavPath = path.join(directory, "narration.wav");
        await writeFile(wavPath, audio);
        const started = Date.now();
        const segments = await transcriber.transcribe(wavPath);
        let narration;
        try {
          narration = toNarration(segments);
        } catch (cause) {
          throw new RequestError(422, "no_speech", (cause as Error).message);
        }
        return { sourceDigest, model: transcriber.modelState().id, transcribeMs: Date.now() - started, narration };
      } finally {
        await rm(directory, { recursive: true, force: true });
      }
    });
  }

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin !== undefined && !LOOPBACK_ORIGIN.test(origin)) {
      send(res, 403, { error: { code: "origin_rejected", message: "Only loopback origins may call this service" } });
      return;
    }
    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": origin ?? "",
        "access-control-allow-methods": "GET, POST",
        "access-control-allow-headers": "content-type",
      });
      res.end();
      return;
    }
    if (req.method === "GET" && req.url === "/health") {
      const states = Object.values(models).map((m) => m.modelState());
      send(res, 200, { service: "ready", models: states }, origin);
      return;
    }
    const route = req.method === "POST" && req.url ? routes.get(req.url) : undefined;
    if (!route) {
      send(res, 404, { error: { code: "not_found", message: "Unknown route" } }, origin);
      return;
    }
    try {
      send(res, 200, await route(req), origin);
    } catch (cause) {
      if (cause instanceof RequestError) {
        send(res, cause.status, { error: { code: cause.code, message: cause.message } }, origin);
        return;
      }
      const message = cause instanceof Error ? cause.message : String(cause);
      send(res, 500, { error: { code: "model_failed", message } }, origin);
    }
  });
}
