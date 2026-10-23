import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { sampleArchive } from "../src/features/chronicle/archive";
import { createCaptionServer, isAllowedOrigin } from "./server";

let close: (() => void) | undefined;
afterEach(() => close?.());

async function start(drafter: Parameters<typeof createCaptionServer>[0]["drafter"]) {
  const server = createCaptionServer({ drafter });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

describe("caption service", () => {
  it("only admits loopback browser origins", () => {
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
  });

  it("returns a draft from the injected drafter", async () => {
    // Fixture drafter. Not model output.
    const base = await start(async () => ({ draft: "Fixture draft.", model: "fixture" }));
    const res = await fetch(`${base}/caption`, {
      method: "POST",
      body: JSON.stringify(sampleArchive[0]),
    });
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({
      memoryId: "m-beach-1998",
      draft: "Fixture draft.",
      model: "fixture",
    });
  });

  it("rejects a malformed memory before calling the drafter", async () => {
    let called = false;
    const base = await start(async () => {
      called = true;
      return { draft: "x", model: "x" };
    });
    const res = await fetch(`${base}/caption`, { method: "POST", body: "{}" });
    expect(res.status).toBe(400);
    expect(called).toBe(false);
  });

  it("reports unavailable instead of inventing a caption", async () => {
    const base = await start(null);
    const res = await fetch(`${base}/caption`, {
      method: "POST",
      body: JSON.stringify(sampleArchive[0]),
    });
    expect(res.status).toBe(503);
  });
});
