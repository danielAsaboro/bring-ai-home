import { describe, expect, it } from "vitest";

import { buildProposalHistory, parseClaimProposals, parseProposeRequest, sourceLabel } from "./claim-proposals";
import type { ScoredChunk } from "./notes-index";

const passages: ScoredChunk[] = [
  { id: "diary-study-notes#unattended-boiling", noteId: "diary-study-notes", noteTitle: "Kitchen diary study notes", section: "Unattended boiling", text: "In 9 of 12 homes the kettle boiled while nobody was in the kitchen.", score: 0.8 },
  { id: "prototype-trial-log#first-try-temperature", noteId: "prototype-trial-log", noteTitle: "Prototype trial log", section: "First-try temperature", text: "8 of 10 attempts on the first try.", score: 0.7 },
];

// FIXTURE model text, hand-written to exercise the validator. Not live output.
const fixtureResponse = JSON.stringify({
  cards: [
    { title: "Kettles boil alone", body: "In 9 of 12 homes nobody watched the kettle.", citations: ["diary-study-notes#unattended-boiling"] },
    { title: "Customers love it", body: "Everyone will buy one.", citations: [] },
    { title: "Right first time", body: "Testers hit temperature first try 8 of 10 times.", citations: ["[prototype-trial-log#first-try-temperature]", "made-up#id"] },
    { title: "Conclusion", body: "Thanks.", citations: ["diary-study-notes#unattended-boiling"] },
  ],
});

describe("claim proposals", () => {
  it("keeps only cards that cite retrieved sections", () => {
    const { proposals, dropped } = parseClaimProposals(fixtureResponse, passages);
    expect(proposals.map((p) => p.title)).toEqual(["Kettles boil alone", "Right first time"]);
    expect(proposals[1].citations.map((c) => c.id)).toEqual(["prototype-trial-log#first-try-temperature"]);
    expect(dropped).toEqual([
      { title: "Customers love it", reason: "cites no retrieved note section" },
      { title: "Conclusion", reason: "generic title" },
    ]);
    expect(sourceLabel(proposals[0])).toBe("Kitchen diary study notes · Unattended boiling");
  });

  it("rejects non-JSON and shapeless answers", () => {
    expect(() => parseClaimProposals("Sure! Here are cards", passages)).toThrow("did not return JSON");
    expect(() => parseClaimProposals("{}", passages)).toThrow("no cards array");
  });

  it("puts source ids in the prompt and validates the request", () => {
    const history = buildProposalHistory({ topic: "why now", audience: "buyers" }, passages);
    expect(history[1].content).toContain("[diary-study-notes#unattended-boiling]");
    expect(() => parseProposeRequest({ topic: " " })).toThrow("topic");
  });
});
