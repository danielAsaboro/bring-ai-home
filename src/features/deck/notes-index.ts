// Private notes become small cited chunks. Each chunk keeps the note and the
// section it came from, so every later proposal can point back to it.

export type Note = { id: string; title: string; file: string };

export type NoteChunk = {
  id: string; // `${noteId}#${sectionSlug}`
  noteId: string;
  noteTitle: string;
  section: string;
  text: string;
};

export type NotesIndex = {
  model: string;
  dimensions: number;
  entries: (NoteChunk & { vector: number[] })[];
};

export type ScoredChunk = NoteChunk & { score: number };

export const SAMPLE_NOTES: Note[] = [
  { id: "lumen-strategy-memo", title: "Lumen Kettle strategy memo", file: "lumen-strategy-memo.md" },
  { id: "diary-study-notes", title: "Kitchen diary study notes", file: "diary-study-notes.md" },
  { id: "prototype-trial-log", title: "Prototype trial log", file: "prototype-trial-log.md" },
];

function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
}

// One chunk per `## ` section. Text before the first section is ignored.
export function chunkNote(note: Note, markdown: string): NoteChunk[] {
  const chunks: NoteChunk[] = [];
  let section: string | null = null;
  let lines: string[] = [];
  const flush = () => {
    const text = lines.join(" ").replace(/\s+/g, " ").trim();
    if (section && text) {
      chunks.push({ id: `${note.id}#${slug(section)}`, noteId: note.id, noteTitle: note.title, section, text });
    }
    lines = [];
  };
  for (const line of markdown.split(/\r?\n/)) {
    const heading = /^##\s+(.+)$/.exec(line);
    if (heading) {
      flush();
      section = heading[1].trim();
    } else if (section) {
      lines.push(line);
    }
  }
  flush();
  return chunks;
}

export function cosine(a: readonly number[], b: readonly number[]): number {
  if (a.length !== b.length || a.length === 0) throw new Error(`Vector size mismatch: ${a.length} vs ${b.length}`);
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i++) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

// Embedding text includes the note and section, so a chunk keeps its context.
export function embeddingText(chunk: NoteChunk): string {
  return `${chunk.noteTitle} — ${chunk.section}: ${chunk.text}`;
}

export async function buildNotesIndex(
  chunks: NoteChunk[],
  model: string,
  embedBatch: (texts: string[]) => Promise<number[][]>,
): Promise<NotesIndex> {
  if (chunks.length === 0) throw new Error("No note sections to index");
  const vectors = await embedBatch(chunks.map(embeddingText));
  if (vectors.length !== chunks.length) {
    throw new Error(`Expected ${chunks.length} vectors, received ${vectors.length}`);
  }
  const dimensions = vectors[0].length;
  if (!vectors.every((v) => v.length === dimensions && v.every(Number.isFinite))) {
    throw new Error("Embedding vectors are inconsistent");
  }
  return { model, dimensions, entries: chunks.map((chunk, i) => ({ ...chunk, vector: vectors[i] })) };
}

export function searchNotes(
  index: NotesIndex,
  query: readonly number[],
  { limit = 3, minScore = 0.3 }: { limit?: number; minScore?: number } = {},
): ScoredChunk[] {
  if (query.length !== index.dimensions) {
    throw new Error(`Query has ${query.length} dimensions; the index has ${index.dimensions}`);
  }
  return index.entries
    .map(({ vector, ...chunk }) => ({ ...chunk, score: cosine(query, vector) }))
    .filter((c) => c.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
