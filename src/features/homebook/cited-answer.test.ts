import { describe, expect, it, vi } from "vitest";

import { answerFromManuals, buildAnswerHistory, parseCitedAnswer } from "./cited-answer";
import type { ManualHit } from "./manual-index";

const hits: ManualHit[] = [
  { id: "a", docId: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", page: 4, text: "Lighting the pilot. Turn the gas control knob to OFF and wait five minutes.", score: 0.8 },
  { id: "b", docId: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", page: 12, text: "Warranty. The tank is covered for six years.", score: 0.5 },
];

// Every model reply below is a hand-written fixture, not model output.
describe("cited answers", () => {
  it("numbers each excerpt with its page in the prompt", () => {
    const [, user] = buildAnswerHistory("How do I relight the pilot?", hits);
    expect(user.content).toContain("[1] Aquaterra AT-50G owner's manual, page 4:");
    expect(user.content).toContain("[2] Aquaterra AT-50G owner's manual, page 12:");
  });

  it("keeps only citations that point at retrieved pages", () => {
    const result = parseCitedAnswer("Turn the knob to OFF and wait five minutes [1] [7].", hits);
    expect(result).toEqual({
      status: "answered",
      answer: "Turn the knob to OFF and wait five minutes [1].",
      citations: [{ n: 1, docId: "doc-wh-manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", page: 4 }],
    });
  });

  it("refuses to present an uncited draft as an answer", () => {
    expect(parseCitedAnswer("Just call someone.", hits).status).toBe("unsupported");
    expect(parseCitedAnswer("NOT IN MANUALS", hits).status).toBe("not-in-manuals");
  });

  it("does not call the model when retrieval finds nothing", async () => {
    const complete = vi.fn();
    const result = await answerFromManuals("What colour is the roof?", { embedQuery: async () => [1], search: () => [], complete });
    expect(result.status).toBe("not-in-manuals");
    expect(complete).not.toHaveBeenCalled();
  });
});
