import type { Closet } from "./model";

export type OutfitCandidate = { id: string; name: string; category: string; colour: string };
export type OutfitConstraints = { occasion: string; maxItems: number; candidates: OutfitCandidate[] };

// The app writes the constraints. Only clean, unpacked garments are offered,
// and the count is what is left of the packing limit.
export function buildOutfitConstraints(closet: Closet, occasion: string): OutfitConstraints {
  return {
    occasion: occasion.trim(),
    maxItems: Math.max(0, closet.trip.limit - closet.trip.garmentIds.length),
    candidates: closet.garments
      .filter((g) => g.state === "clean" && !closet.trip.garmentIds.includes(g.id))
      .map((g) => ({ id: g.id, name: g.name, category: g.category, colour: g.colour })),
  };
}

export function outfitSchema(constraints: OutfitConstraints) {
  return {
    type: "object",
    properties: {
      garmentIds: {
        type: "array",
        items: { type: "string", enum: constraints.candidates.map((c) => c.id) },
        maxItems: constraints.maxItems,
      },
      reason: { type: "string" },
    },
    required: ["garmentIds", "reason"],
    additionalProperties: false,
  };
}

export function buildOutfitHistory(constraints: OutfitConstraints) {
  const list = constraints.candidates.map((c) => `- ${c.id}: ${c.colour} ${c.name} (${c.category})`).join("\n");
  return [
    {
      role: "system" as const,
      content:
        `Choose garments for one occasion from the list only. Choose at most ${constraints.maxItems}. ` +
        "Prefer one top or dress, one bottom unless a dress is chosen, and one pair of shoes. Give a one-sentence reason.",
    },
    { role: "user" as const, content: `Occasion: ${constraints.occasion}\nGarments:\n${list}` },
  ];
}

export type OutfitProposal = {
  garmentIds: string[];
  reason: string;
  rejected: { id: string; why: string }[];
  issues: string[];
};

// The app decides: every id is re-checked against the constraints it wrote.
export function validateOutfitProposal(raw: string, constraints: OutfitConstraints): OutfitProposal {
  let data: { garmentIds?: unknown; reason?: unknown };
  try {
    data = JSON.parse(raw) as typeof data;
  } catch {
    return { garmentIds: [], reason: "", rejected: [], issues: ["The model did not return JSON."] };
  }
  const allowed = new Set(constraints.candidates.map((c) => c.id));
  const garmentIds: string[] = [];
  const rejected: OutfitProposal["rejected"] = [];
  const issues: string[] = [];
  const ids = Array.isArray(data?.garmentIds) ? data.garmentIds : [];
  if (!Array.isArray(data?.garmentIds)) issues.push("The model proposed no garment list.");
  for (const id of ids) {
    if (typeof id !== "string") continue;
    if (!allowed.has(id)) rejected.push({ id, why: "not a clean, unpacked garment you own" });
    else if (garmentIds.includes(id)) rejected.push({ id, why: "proposed twice" });
    else if (garmentIds.length >= constraints.maxItems) rejected.push({ id, why: "over the packing limit" });
    else garmentIds.push(id);
  }
  if (garmentIds.length === 0 && issues.length === 0) issues.push("Nothing usable was proposed.");
  const reason = typeof data?.reason === "string" ? data.reason.replace(/\s+/g, " ").trim().slice(0, 240) : "";
  return { garmentIds, reason, rejected, issues };
}
