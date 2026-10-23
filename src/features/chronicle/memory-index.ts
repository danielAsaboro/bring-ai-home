import type { Memory } from "./archive";

export type IndexedMemory = {
  memoryId: string;
  text: string;
  vector: number[];
};

export type MemoryIndex = {
  model: string;
  dimensions: number;
  entries: IndexedMemory[];
};

export type EmbedMany = (texts: string[]) => Promise<number[][]>;

// The text we embed is built from fields a person wrote or confirmed.
export function memoryText(memory: Memory): string {
  return [
    memory.title,
    memory.caption,
    `People: ${memory.people.join(", ")}`,
    `Date: ${memory.date}`,
  ].join("\n");
}

export async function buildMemoryIndex(
  memories: Memory[],
  model: string,
  embedMany: EmbedMany,
): Promise<MemoryIndex> {
  if (memories.length === 0) throw new Error("There are no memories to index");
  const texts = memories.map(memoryText);
  const vectors = await embedMany(texts);
  if (vectors.length !== memories.length) {
    throw new Error(
      `Expected ${memories.length} embeddings but received ${vectors.length}`,
    );
  }
  const dimensions = vectors[0].length;
  vectors.forEach((vector, index) => {
    if (vector.length !== dimensions || dimensions === 0) {
      throw new Error(`Embedding ${index} has an unexpected size`);
    }
    if (!vector.every(Number.isFinite)) {
      throw new Error(`Embedding ${index} contains a non-numeric value`);
    }
  });
  return {
    model,
    dimensions,
    entries: memories.map((memory, index) => ({
      memoryId: memory.id,
      text: texts[index],
      vector: vectors[index],
    })),
  };
}
