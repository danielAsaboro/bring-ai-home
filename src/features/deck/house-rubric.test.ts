import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { buildCritiqueHistory, parseCritique, RUBRIC_SYSTEM_PROMPT } from "./house-rubric";
import { sampleLibrary } from "./sample-library";

const kettle = sampleLibrary.decks[0];

function readDataset(name: string) {
  const file = path.join(process.cwd(), "qvac-service/rubric", name);
  return readFileSync(file, "utf8").trim().split("\n").map((line) => JSON.parse(line) as { messages: { role: string; content: string }[] });
}

describe("house rubric", () => {
  it("keeps findings with known rubric ids and real cards (fixture text, not model output)", () => {
    const text = JSON.stringify({
      findings: [
        { rubricId: "specific-ask", cardId: "c-8", note: "Name the week and the store count." },
        { rubricId: "be-more-exciting", cardId: "c-1", note: "Add energy." },
        { rubricId: "one-beat", cardId: "c-99", note: "No such card." },
        { rubricId: "audience-first", cardId: null, note: "Open with the buyer's shelf problem." },
      ],
    });
    const { findings, dropped } = parseCritique(text, kettle);
    expect(findings.map((f) => f.rubricId)).toEqual(["specific-ask", "audience-first"]);
    expect(dropped).toBe(2);
    expect(() => parseCritique("Looks great!", kettle)).toThrow("did not return JSON");
  });

  it("uses the same system prompt and outline format as the training data", () => {
    const history = buildCritiqueHistory(kettle);
    expect(history[0].content).toBe(RUBRIC_SYSTEM_PROMPT);
    expect(history[1].content).toContain("- [c-1] claim: Mornings are rushed");
  });

  it("trains only on well-formed examples that pass the app's own validator", () => {
    const train = readDataset("train.jsonl");
    const evalSet = readDataset("eval.jsonl");
    expect([train.length, evalSet.length]).toEqual([6, 2]);
    for (const { messages } of [...train, ...evalSet]) {
      expect(messages.map((m) => m.role)).toEqual(["system", "user", "assistant"]);
      expect(messages[0].content).toBe(RUBRIC_SYSTEM_PROMPT);
      const ids = [...messages[1].content.matchAll(/\[([a-z0-9-]+)\]/g)].map((m) => ({ id: m[1] }));
      const parsed = parseCritique(messages[2].content, { cards: ids as never });
      expect(parsed.dropped).toBe(0);
    }
  });
});
