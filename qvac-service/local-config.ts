import path from "node:path";

export function resolveLocalQvacPaths(appDirectory: string) {
  const qvacDirectory = path.join(appDirectory, ".qvac");
  return {
    qvacDirectory,
    cacheDirectory: path.join(qvacDirectory, "models"),
    configPath: path.join(qvacDirectory, "config.json"),
  };
}

export const VISION_MODEL = "SMOLVLM2_500M_MULTIMODAL_Q8_0";

export const DESCRIBE_GARMENT_PROMPT =
  "Describe this garment in one plain sentence: what kind of clothing it is, its main colour, and any visible pattern. Mention only what is visible.";

export type GarmentDescription<TStats> = {
  kind: "proposed-description";
  sourceName: string;
  sourceDigest: string;
  model: string;
  description: string;
  stats: TStats | null;
};

// A model description is a proposal. It never edits a garment by itself.
export function buildGarmentDescription<TStats>(input: {
  sourceName: string;
  sourceDigest: string;
  model: string;
  rawText: string;
  stats: TStats | undefined;
}): GarmentDescription<TStats> {
  const description = input.rawText.replace(/\s+/g, " ").trim();
  if (description.length === 0) {
    throw new Error("The model returned an empty description");
  }
  return {
    kind: "proposed-description",
    sourceName: input.sourceName,
    sourceDigest: input.sourceDigest,
    model: input.model,
    description,
    stats: input.stats ?? null,
  };
}
