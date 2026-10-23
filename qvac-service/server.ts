import { createHash } from "node:crypto";
import { createServer, type IncomingMessage, type ServerResponse } from "node:http";

import { buildProposalHistory, parseProposal } from "../src/features/ledger/categories.ts";
import { entryText, SAMPLE_BOOK } from "../src/features/ledger/sample-book.ts";
import { rankSimilar, type IndexedEntry } from "../src/features/ledger/similar.ts";
import {
  parseProposeRequest,
  parseReadReceiptRequest,
  parseSimilarRequest,
  type ModelState,
  type OcrBlock,
} from "../src/features/ledger/receipt-contract.ts";

export class ReaderUnavailableError extends Error {}

// The only door to QVAC. Lesson 03 injects a reader that always refuses.
export type ReceiptReader = {
  modelState(): ModelState;
  read(png: Buffer): Promise<{ blocks: OcrBlock[]; ocrMs: number | null }>;
};

// Text generation behind its own door. It returns raw text; the server validates it.
export type Proposer = {
  modelState(): ModelState;
  complete(history: { role: string; content: string }[]): Promise<string>;
};

// Embeddings behind their own door. Vectors only; ranking is plain code.
export type Embedder = {
  modelState(): ModelState;
  embed(texts: string[]): Promise<number[][]>;
};

export type ServiceModels = { proposer?: Proposer; embedder?: Embedder };

export const unavailableReader: ReceiptReader = {
  modelState: () => ({ kind: "ocr", id: "not-configured", state: "not_loaded" }),
  async read() {
    throw new ReaderUnavailableError("OCR is not connected yet");
  },
};

const LOOPBACK_ORIGIN = /^http:\/\/(localhost|127\.0\.0\.1|\[::1\])(:\d+)?$/;

function send(res: ServerResponse, status: number, body: unknown, origin?: string) {
  const headers: Record<string, string> = { "content-type": "application/json" };
  if (origin) {
    headers["access-control-allow-origin"] = origin;
    headers["vary"] = "Origin";
  }
  res.writeHead(status, headers);
  res.end(JSON.stringify(body));
}

function error(code: string, message: string) {
  return { error: { code, message } };
}

async function readBody(req: IncomingMessage, limit: number): Promise<string> {
  let size = 0;
  const chunks: Buffer[] = [];
  for await (const chunk of req) {
    size += (chunk as Buffer).length;
    if (size > limit) throw new Error("too_large");
    chunks.push(chunk as Buffer);
  }
  return Buffer.concat(chunks).toString("utf8");
}

export function createReceiptServer(reader: ReceiptReader, models: ServiceModels = {}) {
  let bookIndex: Promise<IndexedEntry[]> | undefined;
  function indexBook(embedder: Embedder) {
    bookIndex ??= embedder
      .embed(SAMPLE_BOOK.map(entryText))
      .then((vectors) => SAMPLE_BOOK.map((entry, i) => ({ entryId: entry.id, vector: vectors[i] })))
      .catch((cause: unknown) => {
        bookIndex = undefined;
        throw cause;
      });
    return bookIndex;
  }

  return createServer(async (req, res) => {
    const origin = req.headers.origin;
    if (origin !== undefined && !LOOPBACK_ORIGIN.test(origin)) {
      send(res, 403, error("origin_rejected", "Only loopback origins may call this service"));
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
      const states = [reader.modelState()];
      if (models.proposer) states.push(models.proposer.modelState());
      if (models.embedder) states.push(models.embedder.modelState());
      send(res, 200, { service: "ready", models: states }, origin);
      return;
    }
    if (req.method === "POST" && req.url === "/v1/read-receipt") {
      let json: unknown;
      try {
        json = JSON.parse(await readBody(req, 10_000_000));
      } catch {
        send(res, 400, error("invalid_json", "Body must be JSON under 10 MB"), origin);
        return;
      }
      const parsed = parseReadReceiptRequest(json);
      if (!parsed.ok) {
        send(res, 400, error("invalid_request", parsed.message), origin);
        return;
      }
      const png = Buffer.from(parsed.value.pngBase64, "base64");
      const sourceDigest = createHash("sha256").update(png).digest("hex");
      try {
        const { blocks, ocrMs } = await reader.read(png);
        send(
          res,
          200,
          {
            receiptId: parsed.value.receiptId,
            sourceDigest,
            ocrModel: reader.modelState().id,
            ocrMs,
            blocks,
          },
          origin,
        );
      } catch (cause) {
        if (cause instanceof ReaderUnavailableError) {
          send(res, 503, error("ocr_unavailable", cause.message), origin);
          return;
        }
        const message = cause instanceof Error ? cause.message : String(cause);
        send(res, 500, error("ocr_failed", message), origin);
      }
      return;
    }
    if (req.method === "POST" && req.url === "/v1/propose" && models.proposer) {
      let json: unknown;
      try {
        json = JSON.parse(await readBody(req, 100_000));
      } catch {
        send(res, 400, error("invalid_json", "Body must be JSON"), origin);
        return;
      }
      const parsed = parseProposeRequest(json);
      if (!parsed.ok) {
        send(res, 400, error("invalid_request", parsed.message), origin);
        return;
      }
      try {
        const raw = await models.proposer.complete(buildProposalHistory(parsed.value));
        send(
          res,
          200,
          { model: models.proposer.modelState().id, raw, result: parseProposal(raw) },
          origin,
        );
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        send(res, 500, error("llm_failed", message), origin);
      }
      return;
    }
    if (req.method === "POST" && req.url === "/v1/similar" && models.embedder) {
      let json: unknown;
      try {
        json = JSON.parse(await readBody(req, 10_000));
      } catch {
        send(res, 400, error("invalid_json", "Body must be JSON"), origin);
        return;
      }
      const parsed = parseSimilarRequest(json);
      if (!parsed.ok) {
        send(res, 400, error("invalid_request", parsed.message), origin);
        return;
      }
      try {
        const index = await indexBook(models.embedder);
        const [query] = await models.embedder.embed([parsed.value.text]);
        const matches = rankSimilar(index, query, { limit: 3, minScore: 0.5 });
        send(res, 200, { model: models.embedder.modelState().id, matches }, origin);
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : String(cause);
        send(res, 500, error("embeddings_failed", message), origin);
      }
      return;
    }
    send(res, 404, error("not_found", "Unknown route"), origin);
  });
}
