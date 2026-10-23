import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildDescriptionReceipt, resolveLocalQvacPaths } from "./local-config";

describe("local QVAC paths", () => {
  it("keeps the model cache inside the app's ignored .qvac folder", () => {
    const paths = resolveLocalQvacPaths("/work/chronicle");
    expect(paths.cacheDirectory).toBe(path.join("/work/chronicle", ".qvac", "models"));
    expect(paths.configPath).toBe(path.join("/work/chronicle", ".qvac", "config.json"));
  });
});

describe("description receipt", () => {
  // Fixture text written by hand for this test. It is not model output.
  const fixtureText = "  A red blanket on a sandy beach,\n near blue water.  ";

  it("labels the text as a proposal and normalises whitespace", () => {
    const receipt = buildDescriptionReceipt({
      sourceName: "beach-picnic.png",
      sourceDigest: "abc",
      model: "SMOLVLM2_500M_MULTIMODAL_Q8_0",
      rawText: fixtureText,
      stats: undefined,
    });
    expect(receipt.kind).toBe("proposed-description");
    expect(receipt.description).toBe("A red blanket on a sandy beach, near blue water.");
    expect(receipt.stats).toBeNull();
  });

  it("rejects an empty description instead of inventing one", () => {
    expect(() =>
      buildDescriptionReceipt({
        sourceName: "x.png",
        sourceDigest: "abc",
        model: "m",
        rawText: "   ",
        stats: undefined,
      }),
    ).toThrow("empty description");
  });
});
