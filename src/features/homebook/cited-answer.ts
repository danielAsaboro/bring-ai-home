import type { ManualHit } from "./manual-index.ts";

export type ChatMessage = { role: "system" | "user"; content: string };

export type Citation = { n: number; docId: string; title: string; file: string; page: number };

export type CitedAnswer =
  | { status: "answered"; answer: string; citations: Citation[] }
  | { status: "not-in-manuals"; message: string }
  | { status: "unsupported"; message: string; rawText: string };

export function buildAnswerHistory(question: string, hits: ManualHit[]): ChatMessage[] {
  const sources = hits.map((h, i) => `[${i + 1}] ${h.title}, page ${h.page}: ${h.text}`).join("\n");
  return [
    {
      role: "system",
      content:
        "You answer questions about home appliances using only the numbered manual excerpts. " +
        "Cite every claim with its number in square brackets, like [1]. " +
        "If the excerpts do not contain the answer, reply exactly: NOT IN MANUALS.",
    },
    { role: "user", content: `Manual excerpts:\n${sources}\n\nQuestion: ${question}` },
  ];
}

// The model drafts prose. Homebook decides which citations are real.
export function parseCitedAnswer(rawText: string, hits: ManualHit[]): CitedAnswer {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text || /NOT IN MANUALS/i.test(text)) {
    return { status: "not-in-manuals", message: "Your filed manuals do not answer this. Check the original document or ask a professional." };
  }
  const cited = new Set<number>();
  for (const match of text.matchAll(/\[(\d+)\]/g)) cited.add(Number(match[1]));
  const citations = [...cited]
    .filter((n) => n >= 1 && n <= hits.length)
    .sort((a, b) => a - b)
    .map((n) => ({ n, docId: hits[n - 1].docId, title: hits[n - 1].title, file: hits[n - 1].file, page: hits[n - 1].page }));
  if (citations.length === 0) {
    return { status: "unsupported", message: "The draft answer did not cite a manual page, so Homebook will not show it as an answer.", rawText: text };
  }
  // Remove citation numbers that point at nothing the model was given.
  const answer = text.replace(/\[(\d+)\]/g, (m, n) => (citations.some((c) => c.n === Number(n)) ? m : "")).replace(/\s+([.,])/g, "$1");
  return { status: "answered", answer, citations };
}

export type AskDeps = {
  embedQuery: (text: string) => Promise<number[]>;
  search: (vector: number[], docIds?: string[]) => ManualHit[];
  complete: (history: ChatMessage[]) => Promise<string>;
};

export async function answerFromManuals(question: string, deps: AskDeps, docIds?: string[]): Promise<CitedAnswer> {
  const trimmed = question.trim();
  if (!trimmed) throw new Error("Request must contain a question");
  const hits = deps.search(await deps.embedQuery(trimmed), docIds);
  // No retrieved page means no model call: nothing to ground an answer in.
  if (hits.length === 0) return parseCitedAnswer("NOT IN MANUALS", hits);
  return parseCitedAnswer(await deps.complete(buildAnswerHistory(trimmed, hits)), hits);
}
