import { describe, expect, it } from "vitest";

import { samplePatterns } from "../src/features/pattern/patterns";
import { buildTrainingRecords, splitTrainEval, toJsonl } from "./finetune-data";
import { approvedFixturePatterns } from "./test-data/finetune-patterns";

describe("LoRA training data (FIXTURE patterns)", () => {
  it("keeps only weaves that replay every example and counterexample", () => {
    const records = buildTrainingRecords([...samplePatterns, ...approvedFixturePatterns]);
    // Contacts passes; Invoice codes (incomplete) and Vendor names (no rules) are left out.
    expect(records).toHaveLength(1 + approvedFixturePatterns.length);
    expect(records[0].messages.map((m) => m.role)).toEqual(["system", "user", "assistant"]);
    expect(JSON.parse(records[0].messages[2].content)[0]).toEqual({ kind: "trim", collapse: true });
  });

  it("writes JSONL and holds out an eval record", () => {
    const records = buildTrainingRecords(approvedFixturePatterns);
    const { train, eval: held } = splitTrainEval(records);
    expect(train).toHaveLength(3);
    expect(held).toHaveLength(1);
    expect(toJsonl(train).trim().split("\n")).toHaveLength(3);
    expect(() => splitTrainEval(records.slice(0, 1))).toThrow();
  });
});
