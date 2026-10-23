import { describe, expect, it } from "vitest";

import { samplePatterns } from "./patterns";
import { requestProposal } from "./proposal-client";

const json = (status: number, body: unknown) =>
  (async () => new Response(JSON.stringify(body), { status })) as unknown as typeof fetch;

describe("proposal client", () => {
  const examples = samplePatterns[0].examples;

  it("sends before/after pairs only and returns the raw proposal (FIXTURE response)", async () => {
    let sent = "";
    const fetchImpl = (async (_url: string, init: RequestInit) => {
      sent = String(init.body);
      return new Response(
        JSON.stringify({ raw: "[]", model: "fixture", check: { ok: true, rules: [{ kind: "case", to: "upper" }] } }),
        { status: 200 },
      );
    }) as unknown as typeof fetch;
    expect(await requestProposal(examples, fetchImpl)).toEqual({
      status: "ok",
      raw: "[]",
      model: "fixture",
      check: { ok: true, rules: [{ kind: "case", to: "upper" }] },
    });
    expect(sent).not.toContain("e-c1");
  });

  it("re-checks rules the service claims are valid (FIXTURE response)", async () => {
    const lying = json(200, { raw: "", model: "fixture", check: { ok: true, rules: [{ kind: "eval", code: "x" }] } });
    const result = await requestProposal(examples, lying);
    expect(result.status === "ok" && result.check.ok).toBe(false);
  });

  it("separates a stopped service from a failed request", async () => {
    const refused = (async () => {
      throw new TypeError("fetch failed");
    }) as unknown as typeof fetch;
    expect((await requestProposal(examples, refused)).status).toBe("unavailable");
    expect((await requestProposal(examples, json(503, { error: "no model" }))).status).toBe("unavailable");
    expect((await requestProposal(examples, json(502, { error: "boom" }))).status).toBe("error");
  });
});
