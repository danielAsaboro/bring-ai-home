import { SAMPLE_LIBRARY } from "./sample-library.ts";
import type { Run, Tape } from "./tape.ts";

export type LibraryState = { tapes: Tape[]; runs: Run[] };

// The only place Replay touches browser storage.
export type LibraryStore = {
  load(): LibraryState;
  save(state: LibraryState): void;
  reset(): LibraryState;
};

const KEY = "replay.library.v1";

export function sampleState(): LibraryState {
  return { tapes: structuredClone(SAMPLE_LIBRARY), runs: [] };
}

function isState(value: unknown): value is LibraryState {
  if (typeof value !== "object" || value === null) return false;
  const v = value as Record<string, unknown>;
  return Array.isArray(v.tapes) && Array.isArray(v.runs);
}

export function createLocalStore(storage: Storage | undefined): LibraryStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isState(parsed)) return parsed;
        }
      } catch {
        // Corrupt or unavailable storage falls back to the sample library.
      }
      return sampleState();
    },
    save(state) {
      try {
        storage?.setItem(KEY, JSON.stringify(state));
      } catch {
        // Storage can be full or blocked; the session keeps working in memory.
      }
    },
    reset() {
      const state = sampleState();
      this.save(state);
      return state;
    },
  };
}
