import { describe, expect, it } from "vitest";

import { parseWatcherJson } from "./watcher";

const ids = ["front-gate", "back-garden", "studio-door"];

// Hand-written replies (fixtures), not live model output.
describe("watcher proposals", () => {
  it("accepts a proposal that fits the fixed lists", () => {
    const raw = '{"sourceId":"front-gate","condition":" a parcel  left by the gate","fromHour":0,"toHour":0,"minMotion":0}';
    expect(parseWatcherJson(raw, ids)).toEqual({
      ok: true,
      value: { sourceId: "front-gate", condition: "a parcel left by the gate", fromHour: 0, toHour: 0, minMotion: 0 },
    });
  });

  it("rejects invented sources, bad hours, and broken JSON", () => {
    expect(parseWatcherJson('{"sourceId":"driveway","condition":"car","fromHour":0,"toHour":0,"minMotion":0}', ids)).toMatchObject({ ok: false, message: 'Unknown source "driveway"' });
    expect(parseWatcherJson('{"sourceId":"front-gate","condition":"x","fromHour":25,"toHour":0,"minMotion":0}', ids).ok).toBe(false);
    expect(parseWatcherJson('{"sourceId":"front-gate","condition":"x","fromHour":1,"toHour":0,"minMotion":2}', ids).ok).toBe(false);
    expect(parseWatcherJson("Sure! Here is", ids)).toMatchObject({ ok: false, message: "Model reply was not JSON" });
  });
});
