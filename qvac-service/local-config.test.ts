import path from "node:path";
import { describe, expect, it } from "vitest";

import { buildOcrReceipt, resolveLocalQvacPaths } from "./local-config";

describe("local QVAC configuration", () => {
  it("keeps the model cache inside the app's ignored .qvac directory", () => {
    const paths = resolveLocalQvacPaths("/work/ledger");

    expect(paths.qvacDirectory).toBe(path.join("/work/ledger", ".qvac"));
    expect(paths.cacheDirectory).toBe(path.join("/work/ledger", ".qvac", "models"));
    expect(paths.configPath).toBe(path.join("/work/ledger", ".qvac", "config.json"));
  });

  it("binds a receipt to the source digest and counts blocks", () => {
    // Hand-written fixture blocks, not live model output.
    const receipt = buildOcrReceipt({
      sourceName: "receipt-corner-cafe.png",
      sourceDigest: "abc123",
      cacheDirectory: "/work/ledger/.qvac/models",
      blocks: [
        { text: "CORNER CAFE", bbox: [40, 36, 210, 66], confidence: 0.9 },
        { text: "TOTAL", bbox: [40, 388, 110, 414], confidence: 0.8 },
      ],
      stats: undefined,
    });

    expect(receipt.sourceDigest).toBe("abc123");
    expect(receipt.blockCount).toBe(2);
    expect(receipt.stats).toBeNull();
  });
});
