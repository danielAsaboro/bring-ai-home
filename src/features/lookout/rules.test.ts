import { describe, expect, it } from "vitest";

import { acknowledge, mergeTape, replayFrames } from "./events";
import { evaluateRules, inWindow, type Rule } from "./rules";
import { sampleSources } from "./sources";
import { createStore, defaultState } from "./store";

const gate = sampleSources[0];

describe("ordinary rules", () => {
  it("wraps time windows across midnight", () => {
    expect(inWindow("2026-03-14T23:40", 22, 6)).toBe(true);
    expect(inWindow("2026-03-14T10:00", 22, 6)).toBe(false);
  });

  it("needs a motion or change trigger; time only narrows", () => {
    const night: Rule = { id: "t", sourceId: "any", kind: "time", fromHour: 22, toHour: 6 };
    expect(evaluateRules([night], gate.frames[3])).toBeNull();
    const motion: Rule = { id: "m", sourceId: "any", kind: "motion", minMotion: 0.3 };
    expect(evaluateRules([night, motion], gate.frames[3])).toEqual(["between 22:00 and 06:00", "motion ≥ 30%"]);
    expect(evaluateRules([night, motion], gate.frames[1])).toBeNull();
  });
});

describe("event tape", () => {
  it("skips disarmed sources and keeps acknowledgements across replays", () => {
    const { rules } = defaultState();
    const none = replayFrames(sampleSources, {}, rules);
    expect(none).toEqual([]);
    const tape = replayFrames(sampleSources, { "front-gate": true }, rules);
    expect(tape.map((e) => e.frameId)).toEqual(["front-gate-4", "front-gate-3", "front-gate-2"]);
    const acked = acknowledge(tape, "evt-front-gate-2");
    const again = mergeTape(acked, replayFrames(sampleSources, { "front-gate": true }, rules));
    expect(again.find((e) => e.id === "evt-front-gate-2")?.acknowledged).toBe(true);
  });
});

describe("storage adapter", () => {
  it("falls back to defaults on corrupt or missing storage", () => {
    const broken = { getItem: () => "{nope", setItem: () => undefined, removeItem: () => undefined };
    expect(createStore(broken).load()).toEqual(defaultState());
    expect(createStore(undefined).load()).toEqual(defaultState());
  });
});
