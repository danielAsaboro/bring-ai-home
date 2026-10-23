import { replayGate, type Pattern } from "../src/features/pattern/patterns.ts";
import { buildProposalHistory, type ChatMessage } from "./proposal.ts";

export type TrainingRecord = { messages: ChatMessage[] };

// Only weaves a person kept, and that replay every saved case, become training data.
export function buildTrainingRecords(patterns: readonly Pattern[]): TrainingRecord[] {
  return patterns
    .filter((p) => p.rules.length > 0 && p.examples.length > 0 && replayGate(p.rules, p).ok)
    .map((p) => ({
      messages: [...buildProposalHistory(p.examples), { role: "assistant", content: JSON.stringify(p.rules) }],
    }));
}

export function toJsonl(records: readonly TrainingRecord[]): string {
  return records.map((r) => JSON.stringify(r)).join("\n") + "\n";
}

// Hold the last record out for validation so the run reports an honest eval loss.
export function splitTrainEval(records: readonly TrainingRecord[]) {
  if (records.length < 2) throw new Error("Fine-tuning needs at least two approved patterns");
  return { train: records.slice(0, -1), eval: records.slice(-1) };
}
