import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildNotesIndex, chunkNote, SAMPLE_NOTES, searchNotes } from "./notes-index";

const dir = path.join(process.cwd(), "public/test-files/deck");
const chunks = SAMPLE_NOTES.flatMap((note) => chunkNote(note, readFileSync(path.join(dir, note.file), "utf8")));

// FIXTURE vectors: hand-written, three dimensions, not model output.
// Dimension 0 = retail, 1 = diary study, 2 = prototype.
function fixtureEmbed(texts: string[]): Promise<number[][]> {
  return Promise.resolve(
    texts.map((t) => [t.includes("strategy memo") ? 1 : 0, t.includes("diary study") ? 1 : 0, t.includes("Prototype") ? 1 : 0]),
  );
}

describe("notes index", () => {
  it("chunks each sample note by section with stable ids", () => {
    expect(chunks).toHaveLength(9);
    expect(chunks[0]).toMatchObject({ id: "lumen-strategy-memo#retail-position", section: "Retail position" });
    expect(chunks.map((c) => c.id)).toContain("diary-study-notes#unattended-boiling");
  });

  it("returns only chunks above the score floor, best first", async () => {
    const index = await buildNotesIndex(chunks, "fixture", fixtureEmbed);
    const hits = searchNotes(index, [0, 1, 0.1], { limit: 3, minScore: 0.5 });
    expect(hits.map((h) => h.noteId)).toEqual(["diary-study-notes", "diary-study-notes", "diary-study-notes"]);
    expect(searchNotes(index, [0, 0, 0], { minScore: 0.1 })).toEqual([]);
  });

  it("rejects a mismatched query vector and a short embedding batch", async () => {
    const index = await buildNotesIndex(chunks, "fixture", fixtureEmbed);
    expect(() => searchNotes(index, [1, 0])).toThrow("dimensions");
    await expect(buildNotesIndex(chunks, "fixture", async () => [[1, 0, 0]])).rejects.toThrow("Expected 9 vectors");
  });
});
