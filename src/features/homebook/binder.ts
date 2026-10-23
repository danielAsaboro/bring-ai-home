// Homebook's binder: rooms, an asset register, maintenance, filed documents,
// and before-and-after projects. Every record below is fictional.

export type Room = { id: string; name: string; floor: string };

export type Asset = {
  id: string;
  roomId: string;
  name: string;
  category: AssetCategory;
  brand: string;
  model: string;
  serial: string;
  installedOn: string;
  notes: string;
};

export const ASSET_CATEGORIES = [
  "water-heater",
  "dishwasher",
  "furnace",
  "refrigerator",
  "washer",
  "smoke-alarm",
  "other",
] as const;
export type AssetCategory = (typeof ASSET_CATEGORIES)[number];

export type DocumentKind = "manual" | "receipt" | "warranty";
export type FiledDocument = {
  id: string;
  assetId: string;
  kind: DocumentKind;
  title: string;
  file: string | null;
  expiresOn: string | null;
};

export type MaintenanceTask = {
  id: string;
  assetId: string;
  title: string;
  everyMonths: number;
  nextDue: string;
};

export type ServiceRecord = {
  id: string;
  assetId: string;
  taskId: string | null;
  date: string;
  summary: string;
  by: string;
};

export type Project = {
  id: string;
  roomId: string;
  title: string;
  before: string;
  after: string;
  finishedOn: string | null;
};

export type Binder = {
  version: 1;
  home: string;
  rooms: Room[];
  assets: Asset[];
  documents: FiledDocument[];
  tasks: MaintenanceTask[];
  history: ServiceRecord[];
  projects: Project[];
};

export const sampleBinder: Binder = {
  version: 1,
  home: "Fern Hollow Cottage (fictional)",
  rooms: [
    { id: "kitchen", name: "Kitchen", floor: "Ground" },
    { id: "utility", name: "Utility room", floor: "Ground" },
    { id: "hall", name: "Upstairs hall", floor: "First" },
  ],
  assets: [
    {
      id: "water-heater",
      roomId: "utility",
      name: "Water heater",
      category: "water-heater",
      brand: "Aquaterra",
      model: "AT-50G",
      serial: "AT50-2291-0457",
      installedOn: "2021-03-14",
      notes: "Gas, 50 gallon. Shut-off valve is on the left pipe.",
    },
    {
      id: "dishwasher",
      roomId: "kitchen",
      name: "Dishwasher",
      category: "dishwasher",
      brand: "Brightwash",
      model: "BW-300",
      serial: "BW3-88120-K",
      installedOn: "2022-09-02",
      notes: "",
    },
    {
      id: "smoke-alarm-hall",
      roomId: "hall",
      name: "Smoke alarm",
      category: "smoke-alarm",
      brand: "Lumen Safe",
      model: "LS-10",
      serial: "LS10-55012",
      installedOn: "2020-11-20",
      notes: "Ten-year sealed battery.",
    },
  ],
  documents: [
    { id: "doc-wh-manual", assetId: "water-heater", kind: "manual", title: "Aquaterra AT-50G owner's manual", file: "aquaterra-at50g-manual.txt", expiresOn: null },
    { id: "doc-wh-warranty", assetId: "water-heater", kind: "warranty", title: "Tank warranty, 6 years", file: null, expiresOn: "2027-03-14" },
    { id: "doc-dw-manual", assetId: "dishwasher", kind: "manual", title: "Brightwash BW-300 use and care guide", file: "brightwash-bw300-manual.txt", expiresOn: null },
    { id: "doc-dw-receipt", assetId: "dishwasher", kind: "receipt", title: "Receipt, Maple Street Appliances", file: null, expiresOn: null },
  ],
  tasks: [
    { id: "task-wh-flush", assetId: "water-heater", title: "Flush sediment from the tank", everyMonths: 12, nextDue: "2026-03-14" },
    { id: "task-wh-anode", assetId: "water-heater", title: "Inspect the anode rod", everyMonths: 24, nextDue: "2027-03-14" },
    { id: "task-dw-filter", assetId: "dishwasher", title: "Clean the filter", everyMonths: 1, nextDue: "2026-11-01" },
    { id: "task-sa-test", assetId: "smoke-alarm-hall", title: "Press the test button", everyMonths: 1, nextDue: "2026-10-15" },
  ],
  history: [
    { id: "rec-1", assetId: "water-heater", taskId: "task-wh-flush", date: "2025-03-10", summary: "Flushed tank. Water ran clear after four minutes.", by: "Resident" },
    { id: "rec-2", assetId: "water-heater", taskId: null, date: "2025-08-22", summary: "Pilot went out twice. Relit following the label instructions.", by: "Resident" },
    { id: "rec-3", assetId: "dishwasher", taskId: "task-dw-filter", date: "2026-10-01", summary: "Filter cleaned. Some glass fragments removed.", by: "Resident" },
  ],
  projects: [
    { id: "proj-1", roomId: "kitchen", title: "Replace splashback", before: "Cracked white tiles behind the sink.", after: "Green zellige tiles, sealed grout.", finishedOn: "2025-05-30" },
    { id: "proj-2", roomId: "utility", title: "Insulate hot water pipes", before: "Bare copper pipes, cold drafts.", after: "", finishedOn: null },
  ],
};

export function cloneBinder(binder: Binder): Binder {
  return JSON.parse(JSON.stringify(binder)) as Binder;
}

export function addMonths(isoDate: string, months: number): string {
  const [y, m, d] = isoDate.split("-").map(Number);
  const date = new Date(Date.UTC(y, m - 1 + months, 1));
  const lastDay = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 0)).getUTCDate();
  date.setUTCDate(Math.min(d, lastDay));
  return date.toISOString().slice(0, 10);
}

export type DueState = "overdue" | "due-soon" | "scheduled";
export function dueState(task: MaintenanceTask, today: string): DueState {
  if (task.nextDue < today) return "overdue";
  if (task.nextDue <= addMonths(today, 1)) return "due-soon";
  return "scheduled";
}

let counter = 0;
export function newId(prefix: string): string {
  counter += 1;
  return `${prefix}-${Date.now().toString(36)}-${counter}`;
}

export type AssetDraft = Omit<Asset, "id">;

export function registerAsset(binder: Binder, draft: AssetDraft, id = newId("asset")): Binder {
  if (!draft.name.trim()) throw new Error("An asset needs a name");
  if (!binder.rooms.some((r) => r.id === draft.roomId)) throw new Error("Choose a room");
  return { ...binder, assets: [...binder.assets, { ...draft, name: draft.name.trim(), id }] };
}

export function updateAsset(binder: Binder, asset: Asset): Binder {
  return { ...binder, assets: binder.assets.map((a) => (a.id === asset.id ? asset : a)) };
}

// Completing a task stamps the history and moves the schedule forward.
export function completeTask(binder: Binder, taskId: string, date: string, summary: string): Binder {
  const task = binder.tasks.find((t) => t.id === taskId);
  if (!task) throw new Error("Unknown task");
  const record: ServiceRecord = {
    id: newId("rec"),
    assetId: task.assetId,
    taskId,
    date,
    summary: summary.trim() || `${task.title}: done.`,
    by: "Resident",
  };
  return {
    ...binder,
    tasks: binder.tasks.map((t) => (t.id === taskId ? { ...t, nextDue: addMonths(date, t.everyMonths) } : t)),
    history: [...binder.history, record],
  };
}

export function fileDocument(binder: Binder, doc: Omit<FiledDocument, "id">): Binder {
  if (!doc.title.trim()) throw new Error("A document needs a title");
  return { ...binder, documents: [...binder.documents, { ...doc, id: newId("doc") }] };
}

export function recordProject(binder: Binder, project: Omit<Project, "id">): Binder {
  if (!project.title.trim()) throw new Error("A project needs a title");
  return { ...binder, projects: [...binder.projects, { ...project, id: newId("proj") }] };
}

export function historyFor(binder: Binder, assetId: string): ServiceRecord[] {
  return binder.history.filter((r) => r.assetId === assetId).sort((a, b) => b.date.localeCompare(a.date));
}
