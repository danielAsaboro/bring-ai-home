import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const receiptPath = path.join(
  process.cwd(),
  "public/test-files/ledger/receipt-corner-cafe.png",
);

describe("course test files", () => {
  it("keeps the fictional receipt byte-for-byte stable", () => {
    const bytes = readFileSync(receiptPath);
    const digest = createHash("sha256").update(bytes).digest("hex");

    expect(digest).toBe(
      "8bc01b420180f7256015037199e78e0f4a6ffe158304caa169b76bae2b2f06cd",
    );
  });
});
