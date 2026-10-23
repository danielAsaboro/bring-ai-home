import { CATEGORIES, isCategory, type Category } from "./model.ts";

// The JSON shape the local model must fill. Shape only: the app still checks meaning.
export const GARMENT_PROPOSAL_SCHEMA = {
  type: "object",
  properties: {
    name: { type: "string" },
    category: { type: "string", enum: [...CATEGORIES] },
    colour: { type: "string" },
    material: { type: "string" },
  },
  required: ["name", "category", "colour", "material"],
  additionalProperties: false,
} as const;

export function buildDetailsHistory(description: string) {
  return [
    {
      role: "system" as const,
      content:
        "You turn a short garment description into catalogue fields. Use only facts stated in the description. " +
        `category must be one of: ${CATEGORIES.join(", ")}. Use "unknown" for colour or material that is not stated.`,
    },
    { role: "user" as const, content: `Description: ${description}` },
  ];
}

export type ProposedFields = Partial<{ name: string; category: Category; colour: string; material: string }>;
export type GarmentProposal = { fields: ProposedFields; issues: string[] };

const clean = (v: unknown) => (typeof v === "string" ? v.replace(/\s+/g, " ").trim().slice(0, 60) : "");

// The app decides which proposed fields are allowed into the review form.
export function parseGarmentProposal(raw: string, description: string): GarmentProposal {
  let data: Record<string, unknown>;
  try {
    data = JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return { fields: {}, issues: ["The model did not return JSON, so nothing was proposed."] };
  }
  if (!data || typeof data !== "object") return { fields: {}, issues: ["The model returned no fields."] };

  const fields: ProposedFields = {};
  const issues: string[] = [];
  const source = description.toLowerCase();

  const name = clean(data.name);
  if (name) fields.name = name;
  else issues.push("No name was proposed.");

  if (isCategory(data.category)) fields.category = data.category;
  else issues.push(`Category "${clean(data.category)}" is not one of Closet's categories.`);

  // Colour and material must be grounded in the description the person can read.
  for (const key of ["colour", "material"] as const) {
    const value = clean(data[key]);
    if (!value || value.toLowerCase() === "unknown") {
      issues.push(`No ${key} was stated.`);
    } else if (!value.toLowerCase().split(/[\s,/-]+/).some((word) => word.length > 2 && source.includes(word))) {
      issues.push(`${key[0].toUpperCase()}${key.slice(1)} "${value}" is not in the description, so it was left out.`);
    } else {
      fields[key] = value;
    }
  }
  return { fields, issues };
}
