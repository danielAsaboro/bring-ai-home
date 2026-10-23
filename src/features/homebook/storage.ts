import { cloneBinder, sampleBinder, type Binder } from "./binder";

// The one place Homebook touches persistence. Swap this adapter, keep the app.
export type BinderStore = {
  load(): Binder;
  save(binder: Binder): void;
  reset(): Binder;
};

export const STORAGE_KEY = "homebook.binder.v1";

type KeyValue = Pick<Storage, "getItem" | "setItem" | "removeItem">;

function isBinder(value: unknown): value is Binder {
  const v = value as Partial<Binder> | null;
  return (
    !!v &&
    v.version === 1 &&
    Array.isArray(v.rooms) &&
    Array.isArray(v.assets) &&
    Array.isArray(v.documents) &&
    Array.isArray(v.tasks) &&
    Array.isArray(v.history) &&
    Array.isArray(v.projects)
  );
}

export function createLocalStore(storage: KeyValue | null): BinderStore {
  return {
    load() {
      try {
        const raw = storage?.getItem(STORAGE_KEY);
        if (raw) {
          const parsed: unknown = JSON.parse(raw);
          if (isBinder(parsed)) return parsed;
        }
      } catch {
        // Corrupt or blocked storage falls back to the sample binder.
      }
      return cloneBinder(sampleBinder);
    },
    save(binder) {
      try {
        storage?.setItem(STORAGE_KEY, JSON.stringify(binder));
      } catch {
        // Storage can be full or blocked; the binder stays usable in memory.
      }
    },
    reset() {
      try {
        storage?.removeItem(STORAGE_KEY);
      } catch {
        // ignore
      }
      return cloneBinder(sampleBinder);
    },
  };
}

export function browserStore(): BinderStore {
  let storage: KeyValue | null = null;
  try {
    storage = typeof window === "undefined" ? null : window.localStorage;
  } catch {
    storage = null;
  }
  return createLocalStore(storage);
}
