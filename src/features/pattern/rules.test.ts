import { describe, expect, it } from "vitest";

import { applyRule, describeRule, runWeave, type Rule } from "./rules";

describe("rules", () => {
  it("applies each rule kind deterministically", () => {
    expect(applyRule({ kind: "trim", collapse: true }, "  a   b ")).toBe("a b");
    expect(applyRule({ kind: "trim", collapse: false }, "  a   b ")).toBe("a   b");
    expect(applyRule({ kind: "split", separator: ",", order: [1, 0], join: " " }, "hollis, maren")).toBe("maren hollis");
    expect(applyRule({ kind: "case", to: "title" }, "lise VAN der-berg")).toBe("Lise Van Der-Berg");
    expect(applyRule({ kind: "replace", find: " ", with: "-" }, "INV 0042")).toBe("INV-0042");
    expect(applyRule({ kind: "format", template: "#{value}#" }, "x")).toBe("#x#");
  });

  it("keeps every intermediate step and never mutates the input", () => {
    const rules: Rule[] = [
      { kind: "trim", collapse: true },
      { kind: "case", to: "upper" },
    ];
    const input = " inv 0042 ";
    const { output, steps } = runWeave(rules, input);
    expect(output).toBe("INV 0042");
    expect(steps.map((s) => s.after)).toEqual(["inv 0042", "INV 0042"]);
    expect(input).toBe(" inv 0042 ");
  });

  it("describes rules in plain language", () => {
    expect(describeRule({ kind: "split", separator: ",", order: [1, 0], join: " " })).toBe(
      'Split on ",", keep parts 2, 1, join with " "',
    );
  });
});
