import { readdirSync, readFileSync, statSync } from "node:fs";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { DEFAULT_SERVICE_URL } from "../src/features/circle/service-client";
import { isLoopback, summarizeProof } from "./offline";

function files(dir: string): string[] {
  return readdirSync(dir).flatMap((name) => {
    const full = path.join(dir, name);
    return statSync(full).isDirectory() ? files(full) : [full];
  });
}

describe("offline proof", () => {
  it("points the browser at loopback only", () => {
    expect(isLoopback(DEFAULT_SERVICE_URL)).toBe(true);
    expect(isLoopback("https://api.example.com")).toBe(false);
  });

  it("ships no remote URLs in app or service code", () => {
    const roots = [path.resolve(__dirname, "../src"), __dirname];
    const remote = roots
      .flatMap(files)
      .filter((f) => /\.(ts|tsx|mjs)$/.test(f) && !f.endsWith(".test.ts"))
      .flatMap((f) =>
        (readFileSync(f, "utf8").match(/https?:\/\/[^\s"'`)]+/g) ?? [])
          .filter((u) => !u.includes("${") && !isLoopback(u))
          .map((u) => `${path.basename(f)}: ${u}`),
      );
    expect(remote).toEqual([]);
  });

  it("refuses to call a run offline while the network is up", () => {
    const steps = [{ route: "/health", status: 200, ms: 3 }];
    expect(summarizeProof(true, steps).verdict).toMatch(/^not-proven/);
    expect(summarizeProof(false, steps).verdict).toMatch(/^offline/);
    expect(summarizeProof(false, [{ route: "/recap/extract", status: 502, ms: 9 }]).verdict).toBe(
      "failed: /recap/extract 502",
    );
  });
});
