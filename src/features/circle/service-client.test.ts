import { describe, expect, it } from "vitest";

import { createServiceClient, ServiceError } from "./service-client";

function reply(status: number, body: unknown) {
  return async () => new Response(JSON.stringify(body), { status });
}

describe("service client", () => {
  it("reports an unreachable service plainly", async () => {
    const client = createServiceClient("http://127.0.0.1:1", async () => {
      throw new TypeError("fetch failed");
    });
    await expect(client.health()).rejects.toMatchObject({ code: "unreachable" });
  });

  it("surfaces not-configured as an error, never as a transcript", async () => {
    const client = createServiceClient(undefined, reply(503, { error: "not-configured" }));
    await expect(client.transcribe("AA==", "a.wav")).rejects.toBeInstanceOf(ServiceError);
  });

  it("rejects responses that are not proposals", async () => {
    const client = createServiceClient(undefined, reply(200, { transcript: "saved!" }));
    await expect(client.transcribe("AA==", "a.wav")).rejects.toMatchObject({ code: "bad-response" });
  });
});
