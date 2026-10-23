import type { LookoutEvent } from "./events";
import type { Rule } from "./rules";
import { sampleSources } from "./sources";
import type { Watcher } from "./watcher";

export type LookoutState = {
  version: 1;
  armed: Record<string, boolean>;
  rules: Rule[];
  tape: LookoutEvent[];
  watchers: Watcher[];
};

export const STORAGE_KEY = "lookout:v1";

export function defaultState(): LookoutState {
  return {
    version: 1,
    armed: Object.fromEntries(sampleSources.map((s) => [s.id, false])),
    rules: [
      { id: "rule-motion", sourceId: "any", kind: "motion", minMotion: 0.3 },
      { id: "rule-change", sourceId: "front-gate", kind: "change", minChange: 0.15 },
    ],
    tape: [],
    watchers: [],
  };
}

type KeyValue = Pick<Storage, "getItem" | "setItem" | "removeItem">;

// The only place Lookout touches browser storage.
export function createStore(storage: KeyValue | undefined) {
  return {
    load(): LookoutState {
      try {
        const raw = storage?.getItem(STORAGE_KEY);
        if (!raw) return defaultState();
        const parsed = JSON.parse(raw) as Partial<LookoutState>;
        if (parsed.version !== 1 || !parsed.armed || !Array.isArray(parsed.rules) || !Array.isArray(parsed.tape)) {
          return defaultState();
        }
        return { ...defaultState(), ...parsed } as LookoutState;
      } catch {
        return defaultState();
      }
    },
    save(state: LookoutState) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Storage can be full or blocked. The app keeps working in memory.
      }
    },
    reset(): LookoutState {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return defaultState();
    },
  };
}
