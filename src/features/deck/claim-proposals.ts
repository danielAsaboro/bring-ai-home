import type { ScoredChunk } from "./notes-index";

// QVAC may propose claim cards from retrieved note sections. A proposal enters
// the deck only when it cites a retrieved section and a person accepts it.

export type ClaimProposal = {
  id: string;
  title: string;
  body: string;
  citations: { id: string; noteTitle: string; section: string; text: string }[];
};

export type ProposalResult = { proposals: ClaimProposal[]; dropped: { title: string; reason: string }[] };

export type ProposeRequest = { topic: string; audience: string };

export const PROPOSAL_JSON_SCHEMA = {
  type: "object",
  properties: {
    cards: {
      type: "array",
      maxItems: 4,
      items: {
        type: "object",
        properties: {
          title: { type: "string" },
          body: { type: "string" },
          citations: { type: "array", items: { type: "string" } },
        },
        required: ["title", "body", "citations"],
      },
    },
  },
  required: ["cards"],
} as const;

export function parseProposeRequest(value: unknown): ProposeRequest {
  const v = value as { topic?: unknown; audience?: unknown } | null;
  if (!v || typeof v.topic !== "string" || !v.topic.trim() || v.topic.length > 300) {
    throw new Error("Request must contain a topic of at most 300 characters");
  }
  return { topic: v.topic.trim(), audience: typeof v.audience === "string" ? v.audience.slice(0, 200) : "" };
}

export function buildProposalHistory(request: ProposeRequest, passages: ScoredChunk[]) {
  const sources = passages.map((p) => `[${p.id}] ${p.noteTitle} — ${p.section}: ${p.text}`).join("\n");
  return [
    {
      role: "system",
      content:
        "You propose presentation claim cards. Use only the sources. Each card has a short title, one sentence body, and citations listing the bracketed source ids it relies on. Do not invent numbers.",
    },
    {
      role: "user",
      content: `Audience: ${request.audience || "general"}\nTopic: ${request.topic}\n\nSources:\n${sources}\n\nReturn JSON with up to 3 cards.`,
    },
  ];
}

const GENERIC = /^(introduction|conclusion|overview|summary|thank you|questions)$/i;

// The app decides: shape, length, citations, and genericness are checked here.
export function parseClaimProposals(text: string, passages: ScoredChunk[]): ProposalResult {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    throw new Error("The model did not return JSON");
  }
  const cards = (data as { cards?: unknown })?.cards;
  if (!Array.isArray(cards)) throw new Error("The model response has no cards array");
  const byId = new Map(passages.map((p) => [p.id, p]));
  const result: ProposalResult = { proposals: [], dropped: [] };
  const seen = new Set<string>();
  cards.forEach((raw, i) => {
    const c = raw as { title?: unknown; body?: unknown; citations?: unknown };
    const title = typeof c.title === "string" ? c.title.trim() : "";
    const body = typeof c.body === "string" ? c.body.trim() : "";
    if (!title || !body) return result.dropped.push({ title: title || `card ${i + 1}`, reason: "missing title or body" });
    if (title.length > 80 || body.length > 240) return result.dropped.push({ title, reason: "too long for one card" });
    if (GENERIC.test(title)) return result.dropped.push({ title, reason: "generic title" });
    if (seen.has(title.toLowerCase())) return result.dropped.push({ title, reason: "duplicate title" });
    const ids = Array.isArray(c.citations) ? c.citations.filter((x): x is string => typeof x === "string") : [];
    const cited = [...new Set(ids)].map((id) => byId.get(id.replace(/^\[|\]$/g, ""))).filter((p) => p !== undefined);
    if (cited.length === 0) return result.dropped.push({ title, reason: "cites no retrieved note section" });
    seen.add(title.toLowerCase());
    result.proposals.push({
      id: `proposal-${i}-${cited.map((p) => p.id).join("+")}`,
      title,
      body,
      citations: cited.map(({ id, noteTitle, section, text }) => ({ id, noteTitle, section, text })),
    });
  });
  return result;
}

export function sourceLabel(proposal: ClaimProposal): string {
  return proposal.citations.map((c) => `${c.noteTitle} · ${c.section}`).join("; ");
}
