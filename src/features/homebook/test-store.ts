import { cloneBinder, sampleBinder, type Binder } from "./binder";
import type { BinderStore } from "./storage";

// An in-memory adapter for component tests.
export function memoryStore(initial: Binder = sampleBinder): BinderStore & { saved: Binder[] } {
  const saved: Binder[] = [];
  return {
    saved,
    load: () => cloneBinder(initial),
    save: (b) => void saved.push(b),
    reset: () => cloneBinder(sampleBinder),
  };
}
