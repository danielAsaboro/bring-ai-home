import { describe, expect, it } from "vitest";

import { createLocalStore } from "./library-store";

function memoryStorage(): Storage {
  const map = new Map<string, string>();
  return {
    get length() {
      return map.size;
    },
    clear: () => map.clear(),
    getItem: (k) => map.get(k) ?? null,
    key: (i) => [...map.keys()][i] ?? null,
    removeItem: (k) => void map.delete(k),
    setItem: (k, v) => void map.set(k, v),
  };
}

describe("library store", () => {
  it("starts from the sample library and round-trips saved state", () => {
    const storage = memoryStorage();
    const store = createLocalStore(storage);
    const first = store.load();
    expect(first.tapes.map((t) => t.title)).toContain("Publish the weekly report");
    store.save({ tapes: first.tapes.slice(0, 1), runs: [] });
    expect(createLocalStore(storage).load().tapes).toHaveLength(1);
  });

  it("recovers from corrupt storage and resets to samples", () => {
    const storage = memoryStorage();
    storage.setItem("replay.library.v1", "{not json");
    const store = createLocalStore(storage);
    expect(store.load().tapes).toHaveLength(3);
    expect(store.reset().runs).toEqual([]);
  });
});
