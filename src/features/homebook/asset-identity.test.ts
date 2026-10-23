import { describe, expect, it } from "vitest";

import { parseAssetIdentity } from "./asset-identity";

// Hand-written fixture replies. None of these strings is model output.
describe("asset identity", () => {
  it("accepts a category from Homebook's list", () => {
    expect(parseAssetIdentity("category: water heater; name: gas water heater.")).toMatchObject({
      category: "water-heater",
      name: "Gas water heater",
      categoryUnrecognised: false,
    });
  });

  it("falls back to other and flags an invented category", () => {
    const identity = parseAssetIdentity("category: boiler tank; name: tall white boiler");
    expect(identity.category).toBe("other");
    expect(identity.categoryUnrecognised).toBe(true);
  });

  it("rejects an empty reply instead of inventing one", () => {
    expect(() => parseAssetIdentity("  ")).toThrow("empty identification");
  });
});
