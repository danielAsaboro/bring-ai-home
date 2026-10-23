import { describe, expect, it } from "vitest";

import { memoriesByDate, sampleArchive } from "./archive";

describe("sample archive", () => {
  it("holds six memories with unique ids", () => {
    expect(new Set(sampleArchive.map((m) => m.id)).size).toBe(6);
  });

  it("orders memories from oldest to newest", () => {
    const dates = memoriesByDate(sampleArchive).map((m) => m.date);
    expect(dates[0]).toBe("1995-08-20");
    expect(dates.at(-1)).toBe("2013-05-17");
  });
});
