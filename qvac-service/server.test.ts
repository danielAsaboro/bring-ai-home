import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { createPatternServer, isAllowedOrigin, parseExamples, type Proposer } from "./server";

const servers: ReturnType<typeof createPatternServer>[] = [];

async function start(proposer: Proposer | null) {
  const server = createPatternServer({ proposer });
  servers.push(server);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

afterEach(() => {
  for (const s of servers.splice(0)) s.close();
});

const examples = [{ before: "hollis, maren", after: "Maren Hollis" }];

describe("pattern service boundary", () => {
  it("accepts only loopback browser origins", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
    expect(isAllowedOrigin(undefined)).toBe(true);
  });

  it("validates the request before it reaches the model", () => {
    expect(() => parseExamples({ examples: [] })).toThrow();
    expect(() => parseExamples({ examples: [{ before: 1, after: "x" }] })).toThrow();
    expect(parseExamples({ examples: [{ before: "a", after: "b", secret: "dropped" }] })).toEqual([{ before: "a", after: "b" }]);
  });

  it("returns the proposer's raw reply (FIXTURE proposer, not live output)", async () => {
    const base = await start(async () => ({ raw: '[{"kind":"trim","collapse":true}]', model: "fixture" }));
    const res = await fetch(`${base}/propose`, { method: "POST", body: JSON.stringify({ examples }) });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ raw: '[{"kind":"trim","collapse":true}]', model: "fixture" });
  });

  it("answers 503 without a model and 403 for a foreign origin", async () => {
    const base = await start(null);
    expect((await fetch(`${base}/health`)).status).toBe(200);
    expect((await fetch(`${base}/propose`, { method: "POST", body: JSON.stringify({ examples }) })).status).toBe(503);
    const foreign = await fetch(`${base}/health`, { headers: { origin: "https://example.com" } });
    expect(foreign.status).toBe(403);
  });
});
