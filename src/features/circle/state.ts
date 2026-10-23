import type { CircleState, EntryKind, Person, Reminder } from "./types";

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export function isIsoDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const date = new Date(`${value}T00:00:00Z`);
  return !Number.isNaN(date.getTime()) && date.toISOString().startsWith(value);
}

export function letterOf(name: string): string {
  const first = name.normalize("NFD").replace(/[̀-ͯ]/g, "").charAt(0);
  return /[A-Za-z]/.test(first) ? first.toUpperCase() : "#";
}

export function peopleByLetter(people: Person[], letter: string): Person[] {
  return people
    .filter((person) => letterOf(person.name) === letter)
    .sort((a, b) => a.name.localeCompare(b.name));
}

function updatePerson(
  state: CircleState,
  personId: string,
  update: (person: Person) => Person,
): CircleState {
  if (!state.people.some((p) => p.id === personId)) {
    throw new Error(`Unknown person: ${personId}`);
  }
  return {
    ...state,
    people: state.people.map((p) => (p.id === personId ? update(p) : p)),
  };
}

export function logEntry(
  state: CircleState,
  personId: string,
  entry: { kind: EntryKind; date: string; text: string },
): CircleState {
  const text = entry.text.trim();
  if (!text) throw new Error("Write something before saving");
  if (!isIsoDate(entry.date)) throw new Error("Use a real date");
  return updatePerson(state, personId, (person) => ({
    ...person,
    timeline: [
      { id: newId("t"), kind: entry.kind, date: entry.date, text },
      ...person.timeline,
    ].sort((a, b) => b.date.localeCompare(a.date)),
  }));
}

export function addReminder(
  state: CircleState,
  reminder: Omit<Reminder, "id" | "done">,
): CircleState {
  const text = reminder.text.trim();
  if (!text) throw new Error("Write the reminder first");
  if (!isIsoDate(reminder.due)) throw new Error("Use a real date");
  if (!state.people.some((p) => p.id === reminder.personId)) {
    throw new Error(`Unknown person: ${reminder.personId}`);
  }
  return {
    ...state,
    reminders: [
      ...state.reminders,
      { ...reminder, text, id: newId("r"), done: false },
    ].sort((a, b) => a.due.localeCompare(b.due)),
  };
}

export function completeReminder(state: CircleState, id: string): CircleState {
  return {
    ...state,
    reminders: state.reminders.map((r) => (r.id === id ? { ...r, done: true } : r)),
  };
}

export function toggleCircle(
  state: CircleState,
  personId: string,
  circle: string,
): CircleState {
  return updatePerson(state, personId, (person) => ({
    ...person,
    circles: person.circles.includes(circle)
      ? person.circles.filter((c) => c !== circle)
      : [...person.circles, circle],
  }));
}

export function openReminders(state: CircleState, personId?: string): Reminder[] {
  return state.reminders.filter(
    (r) => !r.done && (personId === undefined || r.personId === personId),
  );
}
