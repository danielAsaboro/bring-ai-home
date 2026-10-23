import { describe, expect, it } from "vitest";

import { checkFrame } from "./check-client";
import { sampleSources } from "./sources";

const frame = sampleSources[0].frames[2];

function fakeFetch(reply: () => Response): typeof fetch {
  return (async (input: RequestInfo | URL) =>
    String(input).endsWith(".png") ? new Response(new Uint8Array([104, 105])) : reply()) as typeof fetch;
}

describe("checkFrame client", () => {
  it("reports an unreachable service as unavailable", async () => {
    const failing = (async (input: RequestInfo | URL) => {
      if (String(input).endsWith(".png")) return new Response(new Uint8Array([1]));
      throw new TypeError("fetch failed");
    }) as typeof fetch;
    expect(await checkFrame(frame, "a parcel", failing)).toMatchObject({ ok: false, kind: "unavailable" });
  });

  it("rejects a malformed verdict instead of trusting it", async () => {
    const bad = fakeFetch(() => Response.json({ frameId: "x", frameDigest: "d", model: "m", raw: "", ms: 1, verdict: { answer: "maybe", reason: "" } }));
    expect(await checkFrame(frame, "a parcel", bad)).toMatchObject({ ok: false, kind: "invalid" });
  });

  it("passes through a valid fixture response", async () => {
    const good = fakeFetch(() => Response.json({ frameId: frame.id, frameDigest: "d", model: "fixture", raw: "NO", ms: 3, verdict: { answer: "no", reason: "" } }));
    expect(await checkFrame(frame, "a parcel", good)).toMatchObject({ ok: true, value: { verdict: { answer: "no" } } });
  });
});
