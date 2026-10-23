export type EntryKind = "interaction" | "memory";

export type TimelineEntry = {
  id: string;
  kind: EntryKind;
  date: string; // YYYY-MM-DD
  text: string;
};

export type Reminder = {
  id: string;
  personId: string;
  due: string; // YYYY-MM-DD
  text: string;
  done: boolean;
};

export type Person = {
  id: string;
  name: string;
  note: string;
  circles: string[];
  timeline: TimelineEntry[];
};

export type CircleState = {
  version: 1;
  people: Person[];
  reminders: Reminder[];
  circles: string[];
};
