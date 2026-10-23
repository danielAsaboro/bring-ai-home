import { describe, expect, it } from "vitest";

import { assertNoDelegate, assertWarmedCache, classifyProbe } from "./offline-proof";

// Hand-written file listings and probe results (fixtures), not a sandbox run.
describe("offline proof checks", () => {
  it("requires both the vision model and its projection model in the cache", () => {
    expect(() => assertWarmedCache([{ name: "SmolVLM2-500M-Q8_0.gguf", bytes: 10 }])).toThrow("projection");
    expect(() =>
      assertWarmedCache([
        { name: "SmolVLM2-500M-Q8_0.gguf", bytes: 10 },
        { name: "mmproj-SmolVLM2-500M-Q8_0.gguf", bytes: 0 },
      ]),
    ).toThrow("projection");
    expect(() =>
      assertWarmedCache([
        { name: "SmolVLM2-500M-Q8_0.gguf", bytes: 10 },
        { name: "mmproj-SmolVLM2-500M-Q8_0.gguf", bytes: 10 },
      ]),
    ).not.toThrow();
  });

  it("counts only a refused connection as network denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });

  it("refuses to run the proof with a delegate configured", () => {
    expect(() => assertNoDelegate("192.168.1.20:50052")).toThrow("Unset LOOKOUT_DELEGATE");
    expect(() => assertNoDelegate(undefined)).not.toThrow();
  });
});
