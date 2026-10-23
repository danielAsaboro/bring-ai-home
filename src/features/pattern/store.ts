import { samplePatterns, type Pattern } from "./patterns";

// One adapter owns persistence. Nothing else touches localStorage.
export type PatternStore = {
  load(): Pattern[];
  save(patterns: Pattern[]): void;
  reset(): Pattern[];
};

const KEY = "pattern.v1.patterns";

const fresh = (): Pattern[] => structuredClone(samplePatterns);

export function createMemoryStore(initial: Pattern[] = fresh()): PatternStore {
  let patterns = structuredClone(initial);
  return {
    load: () => structuredClone(patterns),
    save: (next) => {
      patterns = structuredClone(next);
    },
    reset: () => {
      patterns = fresh();
      return structuredClone(patterns);
    },
  };
}

export function createLocalStore(storage: Storage): PatternStore {
  return {
    load() {
      try {
        const raw = storage.getItem(KEY);
        if (!raw) return fresh();
        const parsed = JSON.parse(raw) as unknown;
        return Array.isArray(parsed) ? (parsed as Pattern[]) : fresh();
      } catch {
        return fresh();
      }
    },
    save(patterns) {
      try {
        storage.setItem(KEY, JSON.stringify(patterns));
      } catch {
        // Storage can be full or blocked; the session keeps working in memory.
      }
    },
    reset() {
      try {
        storage.removeItem(KEY);
      } catch {
        // ignore
      }
      return fresh();
    },
  };
}
