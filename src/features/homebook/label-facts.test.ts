import { describe, expect, it } from "vitest";

import { proposeLabelFacts, readingOrder, type OcrBlock } from "./label-facts";

// Fixture blocks written by hand to match water-heater-label.png.
// They are not OCR output. Boxes are [x1, y1, x2, y2] in pixels.
const fixtureBlocks: OcrBlock[] = [
  { text: "SERIAL NO.", bbox: [50, 226, 240, 254], confidence: 0.97 },
  { text: "AQUATERRA", bbox: [50, 50, 400, 95], confidence: 0.99 },
  { text: "AT50-2291-0457", bbox: [330, 225, 578, 255], confidence: 0.88 },
  { text: "MODEL NO.", bbox: [50, 166, 240, 194], confidence: 0.98 },
  { text: "AT-50G", bbox: [330, 167, 436, 193], confidence: 0.93 },
  { text: "FICTIONAL SAMPLE LABEL", bbox: [50, 110, 336, 130], confidence: 0.95 },
  { text: "MFG DATE", bbox: [50, 405, 222, 433], confidence: 0.96 },
  { text: "2021-02", bbox: [330, 405, 455, 433], confidence: 0.9 },
];

describe("label facts", () => {
  it("rebuilds rows in reading order", () => {
    expect(readingOrder(fixtureBlocks).slice(0, 4)).toEqual([
      "AQUATERRA",
      "FICTIONAL SAMPLE LABEL",
      "MODEL NO. AT-50G",
      "SERIAL NO. AT50-2291-0457",
    ]);
  });

  it("proposes brand, model, serial, and a starting install date with their source text", () => {
    const facts = proposeLabelFacts(fixtureBlocks);
    expect(facts.map((f) => [f.field, f.value])).toEqual([
      ["brand", "Aquaterra"],
      ["model", "AT-50G"],
      ["serial", "AT50-2291-0457"],
      ["installedOn", "2021-02-01"],
    ]);
    expect(facts.find((f) => f.field === "serial")).toMatchObject({
      sourceText: "SERIAL NO. AT50-2291-0457",
      confidence: 0.88,
    });
  });

  it("proposes nothing when the plate has no recognisable fields", () => {
    expect(proposeLabelFacts([{ text: "keep clear", bbox: [0, 0, 10, 10] }])).toEqual([]);
  });
});
