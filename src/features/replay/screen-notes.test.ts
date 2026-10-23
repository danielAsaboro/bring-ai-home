import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

import { imageExtension, MAX_NOTE_CHARS, parseScreenNote } from "./screen-notes";

describe("screen notes (fixture strings, not live output)", () => {
  it("cleans a role prefix and whitespace", () => {
    expect(parseScreenNote("Assistant:  The Harbor dashboard\n is open.")).toEqual({
      text: "The Harbor dashboard is open.",
      truncated: false,
    });
  });

  it("refuses empty output and bounds long output on a word", () => {
    expect(() => parseScreenNote("  \n ")).toThrow("empty description");
    const long = parseScreenNote("export ".repeat(200));
    expect(long.truncated).toBe(true);
    expect(long.text.length).toBeLessThanOrEqual(MAX_NOTE_CHARS + 1);
  });

  it("accepts only png and jpeg screenshots", () => {
    expect(imageExtension("Shot.PNG")).toBe("png");
    expect(imageExtension("notes.pdf")).toBeNull();
  });

  it("pins the fictional sample screenshot", () => {
    const bytes = readFileSync(path.join(process.cwd(), "public/test-files/replay/harbor-export.png"));
    expect(createHash("sha256").update(bytes).digest("hex")).toBe(
      "757aaee0bca77672f70bb53aab359f3cfc349d71edb7c2c4c51ff089aa34ea7e",
    );
  });
});
