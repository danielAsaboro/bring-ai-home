import { ASSET_CATEGORIES, type AssetCategory } from "./binder.ts";

export const IDENTIFY_PROMPT =
  "This photo shows one household appliance or fixture. " +
  `Reply on one line exactly as: category: <one of ${ASSET_CATEGORIES.join(", ")}>; name: <two to four words>. ` +
  "If you are not sure, use category: other.";

export type AssetIdentity = {
  kind: "proposed-identity";
  category: AssetCategory;
  name: string;
  // True when the model named a category outside Homebook's list.
  categoryUnrecognised: boolean;
  rawText: string;
};

function isCategory(value: string): value is AssetCategory {
  return (ASSET_CATEGORIES as readonly string[]).includes(value);
}

// The model proposes a category in free text. Homebook only accepts its own list.
export function parseAssetIdentity(rawText: string): AssetIdentity {
  const text = rawText.replace(/\s+/g, " ").trim();
  if (!text) throw new Error("The model returned an empty identification");
  const categoryMatch = text.match(/category\s*:\s*([a-z -]+?)\s*(?:[;,.]|name\s*:|$)/i);
  const nameMatch = text.match(/name\s*:\s*([^;.\n]+)/i);
  const spoken = (categoryMatch?.[1] ?? "").toLowerCase().trim().replace(/\s+/g, "-");
  const category: AssetCategory = isCategory(spoken) ? spoken : "other";
  const name = (nameMatch?.[1] ?? "").trim().split(" ").slice(0, 4).join(" ");
  return {
    kind: "proposed-identity",
    category,
    name: name ? name.charAt(0).toUpperCase() + name.slice(1) : "",
    categoryUnrecognised: !isCategory(spoken),
    rawText: text,
  };
}
