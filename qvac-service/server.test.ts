import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { createLookoutServer, isAllowedOrigin, type FrameChecker } from "./server";

// A fixture checker with a fixed reply. It is not a model.
const fixtureChecker: FrameChecker = { model: "fixture-checker", check: async () => "YES. A box by the gate." };

let close: (() => void) | undefined;
afterEach(() => close?.());

async function start(checker: FrameChecker | null) {
  const server = createLookoutServer({ checker });
  await new Promise<void>((r) => server.listen(0, "127.0.0.1", r));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const body = JSON.stringify({ frameId: "front-gate-3", condition: "a parcel by the gate", pngBase64: "aGk=" });

describe("Lookout service boundary", () => {
  it("reports health without claiming a loaded model", async () => {
    const url = await start(null);
    expect(await (await fetch(`${url}/health`)).json()).toEqual({ service: "ready", vision: { state: "not_configured" } });
  });

  it("answers 503 when vision is not configured instead of inventing a verdict", async () => {
    const url = await start(null);
    const res = await fetch(`${url}/v1/check-frame`, { method: "POST", body });
    expect(res.status).toBe(503);
    expect((await res.json()).error.code).toBe("vision_unavailable");
  });

  it("rejects bad requests and foreign origins", async () => {
    const url = await start(fixtureChecker);
    expect((await fetch(`${url}/v1/check-frame`, { method: "POST", body: "{}" })).status).toBe(400);
    expect(isAllowedOrigin("https://evil.example")).toBe(false);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
  });

  it("returns the digest of the bytes it received and a parsed verdict", async () => {
    const url = await start(fixtureChecker);
    const json = await (await fetch(`${url}/v1/check-frame`, { method: "POST", body })).json();
    expect(json.frameDigest).toBe("8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4");
    expect(json.verdict).toEqual({ answer: "yes", reason: "A box by the gate." });
    expect(json.model).toBe("fixture-checker");
  });
});
