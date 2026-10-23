import { createDemoState } from "./fixtures";
import type { CircleState } from "./types";

// The only place Circle touches persistence. Swap this adapter, not the UI.
export type CircleStore = {
  load(): CircleState;
  save(state: CircleState): void;
  reset(): CircleState;
};

export const STORAGE_KEY = "circle:v1";

type KeyValue = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isCircleState(value: unknown): value is CircleState {
  const v = value as CircleState | null;
  return (
    !!v &&
    v.version === 1 &&
    Array.isArray(v.people) &&
    Array.isArray(v.reminders) &&
    Array.isArray(v.circles)
  );
}

export function createLocalStore(storage: KeyValue | undefined): CircleStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isCircleState(parsed)) return parsed;
        }
      } catch {
        // Unreadable storage falls back to the demo book.
      }
      return createDemoState();
    },
    save(state) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(state));
      } catch {
        // Private windows can refuse writes; the page keeps working in memory.
      }
    },
    reset() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // Nothing to clear.
      }
      return createDemoState();
    },
  };
}

export function browserStore(): CircleStore {
  return createLocalStore(
    typeof window === "undefined" ? undefined : window.localStorage,
  );
}
