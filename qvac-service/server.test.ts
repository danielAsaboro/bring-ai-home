import type { AddressInfo } from "node:net";
import { afterEach, describe, expect, it } from "vitest";

import { createClosetServer, isAllowedOrigin, parseGarmentImage, type ClosetEngine } from "./server";

// A 1x1 PNG header is enough for the type check. Fixture bytes, not a photo.
const PNG = Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]).toString("base64");
const pngRequest = { name: "raincoat.png", dataUrl: `data:image/png;base64,${PNG}` };

let close: (() => void) | undefined;
afterEach(() => close?.());

async function start(engine: ClosetEngine) {
  const server = createClosetServer(engine);
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  close = () => server.close();
  return `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
}

const post = (url: string, body: unknown, headers: Record<string, string> = {}) =>
  fetch(url, { method: "POST", headers: { "content-type": "application/json", ...headers }, body: JSON.stringify(body) });

describe("Closet local service", () => {
  it("only accepts loopback browser origins", () => {
    expect(isAllowedOrigin(undefined)).toBe(true);
    expect(isAllowedOrigin("http://localhost:3000")).toBe(true);
    expect(isAllowedOrigin("https://example.com")).toBe(false);
  });

  it("checks that image bytes match the declared type", () => {
    expect(parseGarmentImage(pngRequest).mime).toBe("image/png");
    expect(() => parseGarmentImage({ name: "x", dataUrl: `data:image/jpeg;base64,${PNG}` })).toThrow("do not match");
    expect(() => parseGarmentImage({ name: "x", dataUrl: "data:text/plain;base64,aGk=" })).toThrow("PNG or JPEG");
  });

  it("reports which capabilities are loaded", async () => {
    const base = await start({ describe: async () => ({ description: "", model: "m" }) });
    expect(await (await fetch(`${base}/health`)).json()).toEqual({ ok: true, capabilities: ["describe"] });
  });

  it("answers 503 when the model is not loaded, so the app falls back", async () => {
    const base = await start({});
    expect((await post(`${base}/describe`, pngRequest)).status).toBe(503);
  });

  it("separates a bad request (400) from an inference failure (502)", async () => {
    const base = await start({
      describe: async () => {
        throw new Error("native runtime failed");
      },
    });
    expect((await post(`${base}/describe`, { name: "x" })).status).toBe(400);
    const failed = await post(`${base}/describe`, pngRequest);
    expect(failed.status).toBe(502);
    expect(await failed.json()).toEqual({ error: "native runtime failed" });
  });

  it("returns the proposal from the engine", async () => {
    // Fixture engine: returns hand-written text, never presented as model output.
    const base = await start({ describe: async () => ({ description: "fixture text", model: "fixture" }) });
    const res = await post(`${base}/describe`, pngRequest, { origin: "http://localhost:3000" });
    expect(res.headers.get("access-control-allow-origin")).toBe("http://localhost:3000");
    expect(await res.json()).toEqual({ description: "fixture text", model: "fixture" });
  });

  it("passes the model's raw details through for the browser to judge", async () => {
    // Fixture engine output, hand-written.
    const base = await start({ details: async () => ({ raw: '{"category":"jacket"}', model: "fixture" }) });
    expect((await post(`${base}/details`, {})).status).toBe(400);
    expect(await (await post(`${base}/details`, { description: "a coat" })).json()).toEqual({
      raw: '{"category":"jacket"}',
      model: "fixture",
    });
  });

  it("returns every classifier label without judging it", async () => {
    // Fixture labels, hand-written.
    const base = await start({ classify: async () => ({ results: [{ label: "other", confidence: 0.9 }], model: "fixture" }) });
    expect(await (await post(`${base}/classify`, pngRequest)).json()).toEqual({
      results: [{ label: "other", confidence: 0.9 }],
      model: "fixture",
    });
  });

  it("bounds embedding requests", async () => {
    // Fixture vectors, hand-written.
    const base = await start({ embed: async (texts) => ({ embeddings: texts.map(() => [1, 0]), model: "fixture" }) });
    expect((await post(`${base}/embed`, { texts: [] })).status).toBe(400);
    expect((await post(`${base}/embed`, { texts: ["a", 3] })).status).toBe(400);
    expect(await (await post(`${base}/embed`, { texts: ["a", "b"] })).json()).toEqual({
      embeddings: [
        [1, 0],
        [1, 0],
      ],
      model: "fixture",
    });
  });

  it("refuses foreign origins", async () => {
    const base = await start({});
    expect((await post(`${base}/describe`, pngRequest, { origin: "https://example.com" })).status).toBe(403);
  });
});
