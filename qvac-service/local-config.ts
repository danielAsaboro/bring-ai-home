import path from "node:path";

export function resolveLocalQvacPaths(appDirectory: string) {
  const qvacDirectory = path.join(appDirectory, ".qvac");
  return {
    qvacDirectory,
    cacheDirectory: path.join(qvacDirectory, "models"),
    configPath: path.join(qvacDirectory, "config.json"),
  };
}

export type DescriptionReceipt<TStats> = {
  kind: "proposed-description";
  sourceName: string;
  sourceDigest: string;
  model: string;
  description: string;
  stats: TStats | null;
};

// A model description is a proposal. It never replaces a human caption.
export function buildDescriptionReceipt<TStats>(input: {
  sourceName: string;
  sourceDigest: string;
  model: string;
  rawText: string;
  stats: TStats | undefined;
}): DescriptionReceipt<TStats> {
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
