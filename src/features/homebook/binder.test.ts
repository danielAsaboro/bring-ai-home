import { describe, expect, it } from "vitest";

import { addMonths, cloneBinder, completeTask, dueState, registerAsset, sampleBinder } from "./binder";
import { createLocalStore, STORAGE_KEY } from "./storage";

describe("binder", () => {
  it("adds months without overflowing short months", () => {
    expect(addMonths("2026-01-31", 1)).toBe("2026-02-28");
    expect(addMonths("2026-03-14", 12)).toBe("2027-03-14");
  });

  it("classifies due dates", () => {
    const task = sampleBinder.tasks[0];
    expect(dueState({ ...task, nextDue: "2026-01-01" }, "2026-10-23")).toBe("overdue");
    expect(dueState({ ...task, nextDue: "2026-11-10" }, "2026-10-23")).toBe("due-soon");
    expect(dueState({ ...task, nextDue: "2027-06-01" }, "2026-10-23")).toBe("scheduled");
  });

  it("stamps history and moves the schedule when a task is completed", () => {
    const next = completeTask(cloneBinder(sampleBinder), "task-wh-flush", "2026-10-23", "");
    expect(next.tasks.find((t) => t.id === "task-wh-flush")?.nextDue).toBe("2027-10-23");
    expect(next.history.at(-1)).toMatchObject({ assetId: "water-heater", date: "2026-10-23" });
  });

  it("refuses an asset without a name or a known room", () => {
    const base = { roomId: "kitchen", category: "other" as const, brand: "", model: "", serial: "", installedOn: "", notes: "" };
    expect(() => registerAsset(sampleBinder, { ...base, name: " " })).toThrow("needs a name");
    expect(() => registerAsset(sampleBinder, { ...base, name: "Fan", roomId: "attic" })).toThrow("Choose a room");
  });
});

describe("local store adapter", () => {
  function memory() {
    const map = new Map<string, string>();
    return {
      getItem: (k: string) => map.get(k) ?? null,
      setItem: (k: string, v: string) => void map.set(k, v),
      removeItem: (k: string) => void map.delete(k),
      map,
    };
  }

  it("round-trips a saved binder and resets to the sample", () => {
    const storage = memory();
    const store = createLocalStore(storage);
    const changed = { ...store.load(), home: "Changed" };
    store.save(changed);
    expect(store.load().home).toBe("Changed");
    expect(store.reset().home).toBe(sampleBinder.home);
    expect(storage.map.has(STORAGE_KEY)).toBe(false);
  });

  it("falls back to the sample when storage holds something else", () => {
    const storage = memory();
    storage.setItem(STORAGE_KEY, "{not json");
    expect(createLocalStore(storage).load().assets).toHaveLength(sampleBinder.assets.length);
  });
});
