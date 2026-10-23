import { describe, expect, it } from "vitest";

import { checkProposal } from "./rule-schema";

// FIXTURES: hand-written candidates, including hostile ones. Not live model output.
describe("readable, reversible rule gate", () => {
  it("accepts a proposal inside the closed vocabulary", () => {
    const result = checkProposal([
      { kind: "trim", collapse: true },
      { kind: "split", separator: ",", order: [1, 0], join: " " },
      { kind: "case", to: "title" },
    ]);
    expect(result).toEqual({ ok: true, rules: expect.any(Array) });
  });

  it("rejects code, regex fields, unknown kinds, and oversized proposals with readable reasons", () => {
    expect(checkProposal([{ kind: "script", code: "value.trim()" }])).toEqual({
      ok: false,
      reasons: ['Rule 1 has unknown kind "script"'],
    });
    expect(checkProposal([{ kind: "replace", find: "\\s+", with: "-", regex: true }])).toEqual({
      ok: false,
      reasons: ["Rule 1 has unexpected fields regex"],
    });
    expect(checkProposal([{ kind: "format", template: "INV-" }]).ok).toBe(false);
    expect(checkProposal([{ kind: "case", to: "sentence" }]).ok).toBe(false);
    expect(checkProposal(Array.from({ length: 7 }, () => ({ kind: "trim", collapse: true }))).ok).toBe(false);
    expect(checkProposal("trim it").ok).toBe(false);
  });
});
