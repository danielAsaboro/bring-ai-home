import { describe, expect, it } from "vitest";

import { sampleArchive } from "./archive";
import { buildMemoryIndex, memoryText } from "./memory-index";

// Fixture embedder: three-number vectors made by hand. Not model output.
const fixtureEmbedMany = async (texts: string[]) =>
  texts.map((_, index) => [index + 1, 0.5, -0.25]);

describe("memory index", () => {
  it("embeds the human-written fields of a memory", () => {
    const text = memoryText(sampleArchive[0]);
    expect(text).toContain("Picnic at Gull Point");
    expect(text).toContain("People: Ada Lind, Tomas Lind");
  });

  it("indexes every memory with a vector of one fixed size", async () => {
    const index = await buildMemoryIndex(sampleArchive, "fixture", fixtureEmbedMany);
    expect(index.entries).toHaveLength(6);
    expect(index.dimensions).toBe(3);
    expect(index.entries[2].memoryId).toBe(sampleArchive[2].id);
  });

  it("rejects a response with the wrong number of vectors", async () => {
    await expect(
      buildMemoryIndex(sampleArchive, "fixture", async () => [[1, 2, 3]]),
    ).rejects.toThrow("Expected 6 embeddings but received 1");
  });

  it("rejects vectors of mixed sizes", async () => {
    await expect(
      buildMemoryIndex(sampleArchive, "fixture", async (texts) =>
        texts.map((_, i) => (i === 3 ? [1, 2] : [1, 2, 3])),
      ),
    ).rejects.toThrow("Embedding 3 has an unexpected size");
  });
});
