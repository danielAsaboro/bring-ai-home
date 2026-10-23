import { CATEGORIES, GARMENT_STATES, type Closet } from "./model";
import { sampleCloset } from "./sample-closet";

export const STORAGE_KEY = "closet:v1";

type KeyValue = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// The one place Closet touches browser storage. Swap the adapter, keep the app.
export function createClosetStore(storage: KeyValue | null) {
  return {
    load(): Closet {
      if (!storage) return sampleCloset();
      try {
        const raw = storage.getItem(STORAGE_KEY);
        if (!raw) return sampleCloset();
        const parsed = JSON.parse(raw) as unknown;
        return isCloset(parsed) ? parsed : sampleCloset();
      } catch {
        return sampleCloset();
      }
    },
    save(closet: Closet) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(closet));
      } catch {
        // Storage can be full or blocked; the closet stays usable in memory.
      }
    },
    reset(): Closet {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return sampleCloset();
    },
  };
}

function isCloset(value: unknown): value is Closet {
  const v = value as Closet | null;
  return (
    !!v &&
    Array.isArray(v.garments) &&
    v.garments.every(
      (g) =>
        typeof g.id === "string" &&
        typeof g.name === "string" &&
        (CATEGORIES as readonly string[]).includes(g.category) &&
        (GARMENT_STATES as readonly string[]).includes(g.state),
    ) &&
    Array.isArray(v.looks) &&
    !!v.trip &&
    Array.isArray(v.trip.garmentIds) &&
    typeof v.trip.limit === "number"
  );
}
