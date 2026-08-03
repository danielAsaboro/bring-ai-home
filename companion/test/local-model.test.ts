import assert from "node:assert/strict";
import test from "node:test";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { verifyCourseModelFile } from "../src/lib/local-model.js";

test("offline verification rejects registry and HTTP inputs before QVAC starts", async () => {
  await assert.rejects(() => verifyCourseModelFile("registry://example/model.gguf"), /local filesystem path/);
  await assert.rejects(() => verifyCourseModelFile("https://example.com/model.gguf"), /local filesystem path/);
});

test("offline verification rejects an incomplete local file", async () => {
  const directory = await mkdtemp(join(tmpdir(), "bring-ai-home-model-"));
  const path = join(directory, "model.gguf");
  try {
    await writeFile(path, "incomplete");
    await assert.rejects(() => verifyCourseModelFile(path), /size mismatch/);
  } finally {
    await rm(directory, { recursive: true, force: true });
  }
});
