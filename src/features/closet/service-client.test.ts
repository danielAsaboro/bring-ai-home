import { describe, expect, it } from "vitest";

import { checkHealth, describeGarment } from "./service-client";

const image = { name: "x.png", dataUrl: "data:image/png;base64,AAAA" };
const reply = (status: number, body: unknown) => async () =>
  new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } });

describe("service client", () => {
  it("classifies a refused connection as an unreachable service", async () => {
    const result = await checkHealth(async () => {
      throw new TypeError("fetch failed");
    });
    expect(result).toMatchObject({ ok: false, failure: "service-unreachable" });
  });

  it("keeps 503, 400, and 502 apart", async () => {
    expect(await describeGarment(image, reply(503, { error: "x" }))).toMatchObject({ failure: "model-unavailable" });
    expect(await describeGarment(image, reply(400, { error: "x" }))).toMatchObject({ failure: "rejected-request" });
    expect(await describeGarment(image, reply(502, { error: "x" }))).toMatchObject({ failure: "inference-failed" });
  });

  it("rejects a response with the wrong shape", async () => {
    expect(await describeGarment(image, reply(200, { text: "hi" }))).toMatchObject({ failure: "bad-response" });
  });

  it("returns a well-formed proposal", async () => {
    // Fixture reply written by hand. It is not model output.
    const result = await describeGarment(image, reply(200, { description: "fixture", model: "fixture" }));
    expect(result).toEqual({ ok: true, value: { description: "fixture", model: "fixture" } });
  });
});
