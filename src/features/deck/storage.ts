import type { Library } from "./deck";
import { sampleLibrary } from "./sample-library";

export type LibraryStore = {
  load(): Library;
  save(library: Library): void;
  reset(): Library;
};

const KEY = "deck.library.v1";

function clone(library: Library): Library {
  return JSON.parse(JSON.stringify(library)) as Library;
}

function isLibrary(value: unknown): value is Library {
  const v = value as Library | null;
  return Boolean(v && Array.isArray(v.decks) && v.decks.length > 0 && typeof v.activeDeckId === "string");
}

// The only code that touches localStorage. Blocked or corrupt storage falls
// back to the sample library so the app still opens.
export function createLocalStore(storage: Storage | undefined = globalThis.localStorage): LibraryStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(KEY);
        const parsed: unknown = raw ? JSON.parse(raw) : null;
        return isLibrary(parsed) ? parsed : clone(sampleLibrary);
      } catch {
        return clone(sampleLibrary);
      }
    },
    save(library) {
      try {
        storage?.setItem(KEY, JSON.stringify(library));
      } catch {
        // Storage is full or blocked. The session keeps working in memory.
      }
    },
    reset() {
      try {
        storage?.removeItem(KEY);
      } catch {
        // ignore
      }
      return clone(sampleLibrary);
    },
  };
}

export function createMemoryStore(initial: Library = sampleLibrary): LibraryStore {
  let current = clone(initial);
  return {
    load: () => clone(current),
    save: (library) => {
      current = clone(library);
    },
    reset: () => {
      current = clone(sampleLibrary);
      return clone(current);
    },
  };
}
