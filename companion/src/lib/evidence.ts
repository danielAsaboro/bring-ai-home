import { appendFile, mkdir } from "node:fs/promises";
import { dirname, resolve } from "node:path";

export type EvidenceLevel = "verified" | "expected" | "unverified";

export type EvidenceRecord = {
  episode: number;
  event: string;
  level: EvidenceLevel;
  at: string;
  data?: Record<string, unknown>;
};

export function evidencePath(episode: number): string {
  return resolve("evidence", `ep${String(episode).padStart(2, "0")}.jsonl`);
}

export async function recordEvidence(
  episode: number,
  event: string,
  level: EvidenceLevel,
  data?: Record<string, unknown>,
): Promise<void> {
  const path = evidencePath(episode);
  await mkdir(dirname(path), { recursive: true });
  const record: EvidenceRecord = {
    episode,
    event,
    level,
    at: new Date().toISOString(),
    ...(data ? { data } : {}),
  };
  await appendFile(path, `${JSON.stringify(record)}\n`, "utf8");
}

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
