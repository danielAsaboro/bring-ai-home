import { describe, expect, it } from "vitest";

import { createClosetStore, STORAGE_KEY } from "./closet-store";
import { addGarment, createLook, packGarment, setGarmentState, setTripLimit } from "./model";
import { sampleCloset } from "./sample-closet";

function memoryStorage() {
  const data = new Map<string, string>();
  return {
    getItem: (k: string) => data.get(k) ?? null,
    setItem: (k: string, v: string) => void data.set(k, v),
    removeItem: (k: string) => void data.delete(k),
    data,
  };
}

describe("garment states", () => {
  it("follows clean → worn → washing → clean", () => {
    let c = sampleCloset();
    c = setGarmentState(c, "white-oxford", "worn");
    c = setGarmentState(c, "white-oxford", "washing");
    c = setGarmentState(c, "white-oxford", "clean");
    expect(c.garments.find((g) => g.id === "white-oxford")?.state).toBe("clean");
  });

  it("refuses a jump the wardrobe does not allow", () => {
    expect(() => setGarmentState(sampleCloset(), "white-oxford", "washing")).toThrow("cannot go");
  });

  it("drops a garment from the carousel when it stops being clean", () => {
    const c = setGarmentState(sampleCloset(), "white-oxford", "worn");
    expect(c.trip.garmentIds).not.toContain("white-oxford");
  });
});

describe("looks and packing", () => {
  it("posts a look only from garments you own", () => {
    const c = createLook(sampleCloset(), { title: "Dinner", occasion: "date", garmentIds: ["navy-blazer", "dark-jeans"] });
    expect(c.looks[0].title).toBe("Dinner");
    expect(() =>
      createLook(sampleCloset(), { title: "X", occasion: "", garmentIds: ["navy-blazer", "ghost"] }),
    ).toThrow("Unknown garments: ghost");
  });

  it("packs only clean garments and respects the limit", () => {
    let c = setTripLimit(sampleCloset(), 3);
    c = packGarment(c, "red-scarf");
    expect(() => packGarment(c, "brown-boots")).toThrow("full");
    expect(() => packGarment(setTripLimit(c, 9), "grey-tee")).toThrow("not clean");
  });

  it("gives new garments unique ids", () => {
    const draft = { name: "Navy blazer", category: "outerwear" as const, colour: "", material: "", notes: "", image: null };
    const c = addGarment(sampleCloset(), draft);
    expect(c.garments.at(-1)?.id).toBe("navy-blazer-2");
  });
});

describe("closet store adapter", () => {
  it("round-trips through storage and resets to the sample closet", () => {
    const storage = memoryStorage();
    const store = createClosetStore(storage);
    const changed = setGarmentState(store.load(), "red-scarf", "worn");
    store.save(changed);
    expect(store.load().garments.find((g) => g.id === "red-scarf")?.state).toBe("worn");
    expect(store.reset().garments.find((g) => g.id === "red-scarf")?.state).toBe("clean");
    expect(storage.data.has(STORAGE_KEY)).toBe(false);
  });

  it("ignores corrupt saved data instead of crashing", () => {
    const storage = memoryStorage();
    storage.setItem(STORAGE_KEY, "{not json");
    expect(createClosetStore(storage).load().garments).toHaveLength(12);
  });
});
