import type { Memory } from "./archive";
import type { CaptionProposal } from "./caption-review";

export type PublishedIssue = {
  title: string;
  publishedAt: string;
  spreads: { memoryId: string; title: string; caption: string }[];
};

export function publishIssue(input: {
  title: string;
  memories: Memory[];
  selectedIds: string[];
  proposals: CaptionProposal[];
  at: string;
}): PublishedIssue {
  if (input.title.trim().length === 0) throw new Error("Give the issue a title");
  if (input.selectedIds.length === 0) throw new Error("Choose at least one memory");
  const unresolved = input.proposals.filter(
    (p) => p.status === "proposed" && input.selectedIds.includes(p.memoryId),
  );
  if (unresolved.length > 0) {
    throw new Error("Accept or reject every caption draft before publishing");
  }
  return {
    title: input.title.trim(),
    publishedAt: input.at,
    spreads: input.memories
      .filter((m) => input.selectedIds.includes(m.id))
      .map((m) => ({ memoryId: m.id, title: m.title, caption: m.caption })),
  };
}
