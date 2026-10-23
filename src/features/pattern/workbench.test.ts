import { describe, expect, it } from "vitest";

import { checkExamples, samplePatterns } from "./patterns";
import { createLocalStore, createMemoryStore } from "./store";
import { reduce } from "./workbench";

describe("pattern workbench state", () => {
  it("the sample contact weave matches every example", () => {
    const contacts = samplePatterns[0];
    expect(checkExamples(contacts.rules, contacts.examples).every((r) => r.passed)).toBe(true);
  });

  it("adding a replace rule completes the invoice weave, and a revision restores the old weave", () => {
    let patterns = structuredClone(samplePatterns);
    patterns = reduce(patterns, { type: "save-revision", patternId: "p-invoices", id: "r1", savedAt: "2026-01-01T00:00:00Z", note: "two rules" });
    patterns = reduce(patterns, { type: "add-rule", patternId: "p-invoices", rule: { kind: "replace", find: " ", with: "-" } });
    const invoices = patterns.find((p) => p.id === "p-invoices")!;
    expect(checkExamples(invoices.rules, invoices.examples).every((r) => r.passed)).toBe(true);

    patterns = reduce(patterns, { type: "restore-revision", patternId: "p-invoices", revisionId: "r1" });
    expect(patterns.find((p) => p.id === "p-invoices")!.rules).toHaveLength(2);
  });

  it("applies a confirmed proposal as a reversible revision pair", () => {
    let patterns = reduce(samplePatterns, {
      type: "apply-proposal",
      patternId: "p-vendors",
      rules: [{ kind: "trim", collapse: true }, { kind: "case", to: "title" }],
      model: "fixture",
      ids: ["r-a", "r-b"],
      savedAt: "2026-01-01T00:00:00Z",
    });
    const vendors = patterns.find((p) => p.id === "p-vendors")!;
    expect(vendors.rules).toHaveLength(2);
    expect(vendors.revisions.map((r) => r.note)).toEqual(["Before proposal", "Applied proposal from fixture"]);
    patterns = reduce(patterns, { type: "restore-revision", patternId: "p-vendors", revisionId: "r-a" });
    expect(patterns.find((p) => p.id === "p-vendors")!.rules).toEqual([]);
  });

  it("moves rules within bounds only", () => {
    const moved = reduce(samplePatterns, { type: "move-rule", patternId: "p-contacts", index: 0, by: 1 });
    expect(moved[0].rules[0].kind).toBe("split");
    expect(reduce(samplePatterns, { type: "move-rule", patternId: "p-contacts", index: 0, by: -1 })).toEqual(samplePatterns);
  });

  it("persists through the localStorage adapter and resets to samples", () => {
    const store = createLocalStore(window.localStorage);
    const changed = reduce(store.load(), { type: "remove-rule", patternId: "p-contacts", index: 2 });
    store.save(changed);
    expect(createLocalStore(window.localStorage).load()[0].rules).toHaveLength(2);
    expect(store.reset()[0].rules).toHaveLength(3);
    expect(createMemoryStore().load()).toEqual(samplePatterns);
  });
});
