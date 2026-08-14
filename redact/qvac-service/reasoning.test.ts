// @vitest-environment node

import { describe, expect, it, vi } from "vitest";

import { createDecisionReasoner, decisionQuestions, type DecisionRuntime } from "./reasoning";

const bbox = [0, 0, 10, 10] as [number, number, number, number];
const blocks = [
  { text: "Maya Chen", bbox, confidence: 0.93 },
  { text: "phone is +1 415 555 0184.", bbox, confidence: 0.68 },
  { text: "Got it.", bbox, confidence: 0.98 },
  { text: "and reference APOLLO-4471", bbox, confidence: 0.69 },
];

function runtimeFor(answers: Array<Record<string, number>>): DecisionRuntime {
  return {
    loadModel: vi.fn(async () => "decision-model-1"),
    decide: vi.fn(async () =>
      answers.map((byQuestion) => ({
        answers: Object.fromEntries(Object.entries(byQuestion).map(([id, noul]) => [id, { noul }])),
      })),
    ),
    unloadModel: vi.fn(async () => undefined),
  };
}

describe("local decision reasoning", () => {
  it("asks one yes/no question per field and adds the user's direction", () => {
    expect(Object.keys(decisionQuestions("private", ""))).toEqual([
      "name", "email", "phone", "address", "account", "identity",
    ]);
    const confidential = decisionQuestions("confidential", " Hide Apollo references ");
    expect(Object.keys(confidential)).toContain("reference");
    expect(confidential.direction).toEqual({
      type: "noul",
      instructions: "This text is something the user asked to hide: Hide Apollo references",
    });
  });

  it("keeps the most likely field above the threshold and grounds its label", async () => {
    const runtime = runtimeFor([
      { name: 0.85, phone: 0.01 },
      { name: 0.14, phone: 1, account: 0.73 },
      { name: 0.05, phone: 0.09 },
      { name: 0.09, account: 0.82, direction: 0.9 },
    ]);
    const reasoner = createDecisionReasoner({
      runtime,
      modelSource: {},
      now: vi.fn().mockReturnValueOnce(1000).mockReturnValueOnce(1700),
    });

    const result = await reasoner.classify({
      documentId: "document-1",
      level: "private",
      direction: "reference codes",
      blocks,
    });

    expect(result.reasoningMs).toBe(700);
    expect(result.candidates).toEqual([
      expect.objectContaining({ blockIndex: 0, label: "name", confidence: 0.85 }),
      expect.objectContaining({ blockIndex: 1, label: "phone", confidence: 1 }),
      expect.objectContaining({ blockIndex: 3, label: "reference", confidence: 0.9 }),
    ]);
    expect(vi.mocked(runtime.decide).mock.calls[0][0]).toMatchObject({
      modelId: "decision-model-1",
      states: blocks.map((block) => block.text),
    });
    expect(reasoner.getState()).toEqual({ id: "laya-421m-q8", state: "ready" });
  });

  it("rejects a result count that doesn't match the blocks", async () => {
    const reasoner = createDecisionReasoner({ runtime: runtimeFor([{ name: 0.9 }]), modelSource: {} });
    await expect(
      reasoner.classify({ documentId: "d", level: "private", direction: "", blocks }),
    ).rejects.toThrow("did not match");
  });
});
