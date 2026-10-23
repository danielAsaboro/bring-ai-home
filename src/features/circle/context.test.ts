import { describe, expect, it } from "vitest";

import { cosine, passagesFor, rankContext } from "./context";
import { createDemoState } from "./fixtures";

describe("meeting context", () => {
  it("builds passages from the timeline and open reminders only", () => {
    const state = createDemoState();
    const dev = state.people.find((p) => p.id === "dev-raman")!;
    expect(passagesFor(dev, state.reminders).map((p) => p.id)).toEqual(["t5", "r1"]);
  });

  it("ranks by cosine and drops weak matches", () => {
    // FIXTURE vectors: tiny hand-made 3-d vectors, not GTE embeddings.
    const passages = [
      { id: "a", text: "talk practice" },
      { id: "b", text: "seed swap" },
      { id: "c", text: "meetup reminder" },
    ];
    const vectors = [
      [1, 0, 0],
      [0, 1, 0],
      [0.8, 0, 0.6],
    ];
    const matches = rankContext([1, 0, 0], passages, vectors, { limit: 2, minScore: 0.3 });
    expect(matches.map((m) => [m.id, m.score])).toEqual([
      ["a", 1],
      ["c", 0.8],
    ]);
  });

  it("refuses mismatched vectors", () => {
    expect(() => cosine([1], [1, 2])).toThrow("same length");
  });
});
