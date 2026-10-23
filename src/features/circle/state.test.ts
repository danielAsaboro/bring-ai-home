import { describe, expect, it } from "vitest";

import { createDemoState } from "./fixtures";
import { addReminder, letterOf, logEntry, openReminders, peopleByLetter, toggleCircle } from "./state";
import { createLocalStore, STORAGE_KEY } from "./storage";

describe("Circle state", () => {
  it("files accented names under their plain letter", () => {
    expect(letterOf("Inès Moreau")).toBe("I");
    expect(peopleByLetter(createDemoState().people, "I").map((p) => p.name)).toEqual(["Inès Moreau"]);
  });

  it("refuses empty entries and impossible dates", () => {
    const state = createDemoState();
    expect(() => logEntry(state, "dev-raman", { kind: "memory", date: "2026-10-20", text: "  " })).toThrow("Write something");
    expect(() => addReminder(state, { personId: "dev-raman", due: "2026-02-30", text: "x" })).toThrow("real date");
  });

  it("toggles circles and lists open reminders per person", () => {
    const state = toggleCircle(createDemoState(), "dev-raman", "Old friends");
    expect(state.people.find((p) => p.id === "dev-raman")?.circles).toContain("Old friends");
    expect(openReminders(state, "dev-raman")).toHaveLength(1);
  });

  it("round-trips through the storage adapter and resets", () => {
    const memory = new Map<string, string>();
    const store = createLocalStore({
      getItem: (k) => memory.get(k) ?? null,
      setItem: (k, v) => void memory.set(k, v),
      removeItem: (k) => void memory.delete(k),
    });
    const next = logEntry(store.load(), "amara-okafor", { kind: "memory", date: "2026-10-01", text: "Kiln day" });
    store.save(next);
    expect(store.load().people[0].timeline[0].text).toBe("Kiln day");
    store.reset();
    expect(memory.has(STORAGE_KEY)).toBe(false);
  });
});
