import { describe, expect, it } from "vitest";

import { buildExtractionPrompt, parseExtraction } from "./extraction";

const people = [
  { id: "dev-raman", name: "Dev Raman" },
  { id: "amara-okafor", name: "Amara Okafor" },
];
const transcript =
  "Coffee with Dev today. He's nervous about the meetup on the twenty eighth. I said I'd send him my slide template by Friday the 24th. Oh and his sister Priya is getting married in June.";
const context = { transcript, people, today: "2026-10-23", model: "FIXTURE" };

// FIXTURE: a hand-written model reply, including mistakes a small model makes.
// It is not live model output.
const fixtureReply = JSON.stringify({
  items: [
    { type: "promise", person: "Dev", text: "Send Dev my slide template", evidence: "I'd send him my slide template", date: "2026-10-24" },
    { type: "memory", person: "Dev Raman", text: "Nervous about the meetup talk", evidence: "nervous about the meetup" },
    { type: "memory", person: "Dev Raman", text: "Loves jazz", evidence: "he loves jazz" },
    { type: "date", person: "Dev Raman", text: "Priya's wedding", evidence: "getting married in June", date: "2026-06-31" },
    { type: "promise", person: "Carlos", text: "Call Carlos", evidence: "Coffee with Dev" },
  ],
});

describe("parseExtraction", () => {
  it("keeps only items the recap supports", () => {
    const result = parseExtraction(fixtureReply, context);
    expect(result.status).toBe("proposed");
    expect(result.proposals.map((p) => [p.type, p.personId, p.date])).toEqual([
      ["promise", "dev-raman", "2026-10-24"],
      ["memory", "dev-raman", undefined],
    ]);
    expect(result.rejected.map((r) => r.reason)).toEqual([
      "evidence is not in the recap",
      "not a real date",
      "unknown person",
    ]);
  });

  it("fails loudly on prose instead of JSON", () => {
    expect(() => parseExtraction("Sure! Here are the items:", context)).toThrow("did not return JSON");
  });

  it("names the known people and today's date in the prompt", () => {
    const prompt = buildExtractionPrompt(transcript, people, "2026-10-23");
    expect(prompt).toContain("Today is 2026-10-23");
    expect(prompt).toContain("Dev Raman, Amara Okafor");
  });
});
