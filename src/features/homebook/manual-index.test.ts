import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { fixtureEmbedder, fixtureVector } from "./fixture-embedder";
import { buildManualIndex, chunkManual, searchManuals } from "./manual-index";

const manualText = readFileSync(path.join(process.cwd(), "public/test-files/homebook/aquaterra-at50g-manual.txt"), "utf8");
const doc = { id: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt" };

describe("manual ingestion", () => {
  it("splits a manual by printed page and skips the preamble", () => {
    const chunks = chunkManual(doc, manualText);
    expect(chunks.map((c) => c.page)).toEqual([1, 4, 7, 9, 12]);
    expect(chunks.find((c) => c.page === 4)?.text).toMatch(/^Lighting the pilot\./);
    expect(chunks.some((c) => c.text.includes("FICTIONAL SAMPLE"))).toBe(false);
  });

  it("indexes chunks and finds the page about flushing (fixture embedder, not a model)", async () => {
    const index = await buildManualIndex(chunkManual(doc, manualText), "fixture-bow", fixtureEmbedder);
    const hits = searchManuals(index, fixtureVector("attach a hose to the drain valve and flush"), { minScore: 0.1 });
    expect(hits[0]).toMatchObject({ docId: "doc-wh-manual", page: 7 });
  });

  it("refuses a vector count that does not match the chunks", async () => {
    await expect(buildManualIndex(chunkManual(doc, manualText), "m", async () => [[1]])).rejects.toThrow("wrong number");
  });
});
