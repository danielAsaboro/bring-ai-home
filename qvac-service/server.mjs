import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { createServer } from "node:http";
import { tmpdir } from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { rankContext } from "../src/features/circle/context.ts";
import {
  buildExtractionPrompt,
  parseExtraction,
  PROPOSAL_SCHEMA,
} from "../src/features/circle/extraction.ts";
import { buildRecapDraft } from "./recap.ts";
import { createService, MAX_BODY_BYTES, SERVICE_PORT } from "./service.ts";

const appDirectory = fileURLToPath(new URL("../", import.meta.url));
const qvacDirectory = path.join(appDirectory, ".qvac");
const cacheDirectory = path.join(qvacDirectory, "models");
const configPath = path.join(qvacDirectory, "config.json");
const HOST = "127.0.0.1";
const ALLOWED_ORIGINS = new Set(["http://localhost:3000", "http://127.0.0.1:3000"]);

await mkdir(cacheDirectory, { recursive: true });
await writeFile(configPath, `${JSON.stringify({ cacheDirectory }, null, 2)}\n`, "utf8");
process.env.QVAC_CONFIG_PATH = configPath;
const sdk = await import("@qvac/sdk");

// Models load on first use and stay loaded until the service stops.
const loaded = new Map();
function model(name, options) {
  if (!loaded.has(name)) {
    loaded.set(
      name,
      sdk.loadModel(options).catch((error) => {
        loaded.delete(name);
        throw error;
      }),
    );
  }
  return loaded.get(name);
}

const capabilities = {
  async transcribe(audio, fileName) {
    const modelId = await model("WHISPER_TINY", {
      modelSrc: sdk.WHISPER_TINY,
      modelConfig: { language: "en", translate: false, temperature: 0.0 },
    });
    const dir = await mkdtemp(path.join(tmpdir(), "circle-recap-"));
    const audioPath = path.join(dir, path.basename(fileName));
    try {
      await writeFile(audioPath, audio);
      const segments = await sdk.transcribe({ modelId, audioChunk: audioPath, metadata: true });
      return buildRecapDraft(segments, "WHISPER_TINY");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  },
};

capabilities.extract = async ({ transcript, people, today }) => {
  const modelId = await model("LLAMA_3_2_1B_INST_Q4_0", {
    modelSrc: sdk.LLAMA_3_2_1B_INST_Q4_0,
    modelConfig: { ctx_size: 4096 },
  });
  const run = sdk.completion({
    modelId,
    history: [{ role: "user", content: buildExtractionPrompt(transcript, people, today) }],
    stream: false,
    responseFormat: {
      type: "json_schema",
      json_schema: { name: "circle_proposals", schema: PROPOSAL_SCHEMA },
    },
  });
  const final = await run.final;
  return parseExtraction(final.contentText, {
    transcript,
    people,
    today,
    model: "LLAMA_3_2_1B_INST_Q4_0",
  });
};

capabilities.retrieve = async ({ query, passages }) => {
  const modelId = await model("GTE_LARGE_FP16", {
    modelSrc: sdk.GTE_LARGE_FP16,
    modelType: "embeddings",
  });
  const { embedding } = await sdk.embed({
    modelId,
    text: [query, ...passages.map((p) => p.text)],
  });
  const [queryVector, ...vectors] = embedding;
  return {
    model: "GTE_LARGE_FP16",
    matches: rankContext(queryVector, passages, vectors, { limit: 3, minScore: 0.3 }),
  };
};

const handle = createService(capabilities);

const server = createServer(async (req, res) => {
  const origin = req.headers.origin;
  if (origin && ALLOWED_ORIGINS.has(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
    res.setHeader("Access-Control-Allow-Headers", "content-type");
  }
  if (req.method === "OPTIONS") return res.writeHead(204).end();
  if (origin && !ALLOWED_ORIGINS.has(origin)) {
    return res.writeHead(403).end(JSON.stringify({ error: "origin-not-allowed" }));
  }
  let size = 0;
  const chunks = [];
  for await (const chunk of req) {
    size += chunk.length;
    if (size > MAX_BODY_BYTES) {
      return res.writeHead(413).end(JSON.stringify({ error: "too-large" }));
    }
    chunks.push(chunk);
  }
  let body;
  try {
    body = chunks.length ? JSON.parse(Buffer.concat(chunks).toString("utf8")) : undefined;
  } catch {
    return res.writeHead(400).end(JSON.stringify({ error: "invalid-json" }));
  }
  const url = new URL(req.url ?? "/", `http://${HOST}`);
  const result = await handle(req.method ?? "GET", url.pathname, body);
  res.writeHead(result.status, { "content-type": "application/json" });
  res.end(JSON.stringify(result.body));
});

server.listen(SERVICE_PORT, HOST, () => {
  process.stdout.write(`Circle QVAC service on http://${HOST}:${SERVICE_PORT}\n`);
});

async function shutdown() {
  server.close();
  for (const pending of loaded.values()) {
    const modelId = await pending.catch(() => undefined);
    if (modelId) await sdk.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
  }
  await sdk.close().catch(() => undefined);
  process.exit(0);
}
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);
