import type { Memory } from "./archive";

export type CaptionProposal = {
  memoryId: string;
  draft: string;
  status: "proposed" | "accepted" | "rejected";
};

export type CaptionRevision = {
  memoryId: string;
  previous: string;
  next: string;
  source: "edited-draft" | "manual";
  at: string;
};

export function proposeCaption(memoryId: string, draft: string): CaptionProposal {
  return { memoryId, draft, status: "proposed" };
}

// Only this function changes a caption, and only with the text a person approved.
export function acceptCaption(
  memory: Memory,
  proposal: CaptionProposal,
  approvedText: string,
  at: string,
): { memory: Memory; proposal: CaptionProposal; revision: CaptionRevision } {
  if (proposal.memoryId !== memory.id) {
    throw new Error("This draft belongs to a different memory");
  }
  if (proposal.status !== "proposed") {
    throw new Error("This draft has already been resolved");
  }
  const next = approvedText.trim();
  if (next.length === 0) throw new Error("A caption cannot be empty");
  return {
    memory: { ...memory, caption: next },
    proposal: { ...proposal, status: "accepted" },
    revision: {
      memoryId: memory.id,
      previous: memory.caption,
      next,
      source: "edited-draft",
      at,
    },
  };
}

export function rejectCaption(proposal: CaptionProposal): CaptionProposal {
  if (proposal.status !== "proposed") {
    throw new Error("This draft has already been resolved");
  }
  return { ...proposal, status: "rejected" };
}
