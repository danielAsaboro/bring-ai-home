import { readFileSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { assertWarmedCache, classifyProbe } from "./offline-proof";

describe("offline proof", () => {
  it("classifies probes so DNS failure is not mistaken for denial", () => {
    expect(classifyProbe({ ok: true })).toBe("network-allowed");
    expect(classifyProbe({ ok: false, code: "ENOTFOUND" })).toBe("dns-failed");
    expect(classifyProbe({ ok: false, code: "ENETUNREACH" })).toBe("network-denied");
    expect(classifyProbe({ ok: false, code: "EPERM" })).toBe("network-denied");
  });

  it("refuses an empty or partial cache (fixture file listings)", () => {
    expect(() => assertWarmedCache([])).toThrow("embeddings, text model");
    expect(() => assertWarmedCache([{ name: "gte-large_fp16.gguf", bytes: 0 }, { name: "Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 9 }])).toThrow("(embeddings)");
    expect(() => assertWarmedCache([{ name: "gte-large_fp16.gguf", bytes: 9 }, { name: "Llama-3.2-1B-Instruct-Q4_0.gguf", bytes: 9 }])).not.toThrow();
  });

  it("denies outbound network except loopback in the macOS profile", () => {
    const profile = readFileSync(path.join(process.cwd(), "qvac-service/offline.sb"), "utf8");
    expect(profile).toContain("(deny network-outbound)");
    expect(profile).toContain('(allow network-outbound (remote ip "localhost:*"))');
  });
});
