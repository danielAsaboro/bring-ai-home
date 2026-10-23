import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildGarmentDescription, resolveLocalQvacPaths } from "./local-config";

describe("local QVAC paths", () => {
  it("keeps the model cache inside the app's ignored .qvac folder", () => {
    const paths = resolveLocalQvacPaths("/work/closet");
    expect(paths.cacheDirectory).toBe(path.join("/work/closet", ".qvac", "models"));
    expect(paths.configPath).toBe(path.join("/work/closet", ".qvac", "config.json"));
  });
});

describe("garment description", () => {
  // Fixture text written by hand for this test. It is not model output.
  const fixtureText = "  A yellow raincoat\n with a front seam.  ";

  it("labels the text as a proposal and normalises whitespace", () => {
    const result = buildGarmentDescription({
      sourceName: "yellow-raincoat.png",
      sourceDigest: "abc",
      model: "SMOLVLM2_500M_MULTIMODAL_Q8_0",
      rawText: fixtureText,
      stats: undefined,
    });
    expect(result.kind).toBe("proposed-description");
    expect(result.description).toBe("A yellow raincoat with a front seam.");
    expect(result.stats).toBeNull();
  });

  it("rejects an empty description instead of inventing one", () => {
    expect(() =>
      buildGarmentDescription({ sourceName: "x.png", sourceDigest: "abc", model: "m", rawText: "  ", stats: undefined }),
    ).toThrow("empty description");
  });
});
