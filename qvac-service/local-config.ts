import path from "node:path";

export function resolveLocalQvacPaths(appDirectory: string) {
  const qvacDirectory = path.join(appDirectory, ".qvac");
  return {
    qvacDirectory,
    cacheDirectory: path.join(qvacDirectory, "models"),
    configPath: path.join(qvacDirectory, "config.json"),
  };
}

export type OcrBlock = {
  text: string;
  bbox?: [number, number, number, number];
  confidence?: number;
};

export function buildOcrReceipt<TStats>(input: {
  sourceName: string;
  sourceDigest: string;
  cacheDirectory: string;
  blocks: OcrBlock[];
  stats: TStats;
}) {
  return {
    sourceName: input.sourceName,
    sourceDigest: input.sourceDigest,
    cacheDirectory: input.cacheDirectory,
    blockCount: input.blocks.length,
    blocks: input.blocks,
    stats: input.stats ?? null,
  };
}
