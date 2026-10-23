// Manuals are split by printed page so every answer can cite a page number.

export type ManualChunk = {
  id: string;
  docId: string;
  title: string;
  file: string;
  page: number;
  text: string;
};

export type ManualIndex = {
  model: string;
  dimensions: number;
  entries: (ManualChunk & { vector: number[] })[];
};

export type Embedder = (texts: string[]) => Promise<number[][]>;

const PAGE_MARKER = /^=== page (\d+) ===$/;
const MAX_CHUNK_CHARS = 420;

export function chunkManual(doc: { id: string; title: string; file: string }, text: string): ManualChunk[] {
  const chunks: ManualChunk[] = [];
  let page: number | null = null;
  let lines: string[] = [];
  const flush = () => {
    if (page === null) return;
    const sentences = lines.join(" ").replace(/\s+/g, " ").trim().split(/(?<=[.!?])\s+/);
    let current = "";
    for (const sentence of sentences) {
      if (current && current.length + sentence.length + 1 > MAX_CHUNK_CHARS) {
        chunks.push({ id: `${doc.id}-p${page}-${chunks.length}`, docId: doc.id, title: doc.title, file: doc.file, page, text: current });
        current = "";
      }
      current = current ? `${current} ${sentence}` : sentence;
    }
    if (current) chunks.push({ id: `${doc.id}-p${page}-${chunks.length}`, docId: doc.id, title: doc.title, file: doc.file, page, text: current });
  };
  for (const line of text.split(/\r?\n/)) {
    const marker = line.trim().match(PAGE_MARKER);
    if (marker) {
      flush();
      page = Number(marker[1]);
      lines = [];
    } else if (page !== null && line.trim()) {
      lines.push(line.trim());
    }
  }
  flush();
  return chunks;
}

export async function buildManualIndex(chunks: ManualChunk[], model: string, embed: Embedder): Promise<ManualIndex> {
  if (chunks.length === 0) throw new Error("There are no manual pages to index");
  const vectors = await embed(chunks.map((c) => `${c.title}, page ${c.page}: ${c.text}`));
  if (vectors.length !== chunks.length) throw new Error("The embedder returned the wrong number of vectors");
  const dimensions = vectors[0].length;
  if (!vectors.every((v) => v.length === dimensions && dimensions > 0)) throw new Error("Vectors have inconsistent dimensions");
  return { model, dimensions, entries: chunks.map((c, i) => ({ ...c, vector: vectors[i] })) };
}

function cosine(a: number[], b: number[]): number {
  let dot = 0;
  let na = 0;
  let nb = 0;
  for (let i = 0; i < a.length; i += 1) {
    dot += a[i] * b[i];
    na += a[i] * a[i];
    nb += b[i] * b[i];
  }
  return na && nb ? dot / Math.sqrt(na * nb) : 0;
}

export type ManualHit = ManualChunk & { score: number };

export function searchManuals(
  index: ManualIndex,
  query: number[],
  options: { limit?: number; minScore?: number; docIds?: string[] } = {},
): ManualHit[] {
  if (query.length !== index.dimensions) throw new Error("Query vector does not match the index");
  const { limit = 3, minScore = 0.3, docIds } = options;
  return index.entries
    .filter((e) => !docIds || docIds.includes(e.docId))
    .map(({ vector, ...chunk }) => ({ ...chunk, score: cosine(vector, query) }))
    .filter((hit) => hit.score >= minScore)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}
