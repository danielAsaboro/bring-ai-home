// Closet's domain model. Every rule about what a garment, look, or trip may
// contain lives here, so the UI and (later) any local model can only propose.

export const CATEGORIES = ["top", "bottom", "dress", "outerwear", "shoes", "accessory"] as const;
export type Category = (typeof CATEGORIES)[number];

export const GARMENT_STATES = ["clean", "worn", "washing", "repair"] as const;
export type GarmentState = (typeof GARMENT_STATES)[number];

export type Garment = {
  id: string;
  name: string;
  category: Category;
  colour: string;
  material: string;
  notes: string;
  state: GarmentState;
  image: string | null;
};

export type Look = {
  id: string;
  title: string;
  occasion: string;
  garmentIds: string[];
  createdAt: string;
};

export type Trip = {
  name: string;
  limit: number;
  garmentIds: string[];
};

export type Closet = {
  garments: Garment[];
  looks: Look[];
  trip: Trip;
};

// Which state a garment may move to next. Repair is reachable from anywhere.
const TRANSITIONS: Record<GarmentState, GarmentState[]> = {
  clean: ["worn", "repair"],
  worn: ["washing", "clean", "repair"],
  washing: ["clean", "repair"],
  repair: ["clean"],
};

export function nextStates(state: GarmentState): GarmentState[] {
  return TRANSITIONS[state];
}

export function isCategory(value: unknown): value is Category {
  return typeof value === "string" && (CATEGORIES as readonly string[]).includes(value);
}

export function setGarmentState(closet: Closet, id: string, state: GarmentState): Closet {
  const garment = closet.garments.find((g) => g.id === id);
  if (!garment) throw new Error(`Unknown garment ${id}`);
  if (!TRANSITIONS[garment.state].includes(state)) {
    throw new Error(`${garment.name} cannot go from ${garment.state} to ${state}`);
  }
  // A garment that is no longer clean leaves the packing carousel.
  const trip =
    state === "clean"
      ? closet.trip
      : { ...closet.trip, garmentIds: closet.trip.garmentIds.filter((g) => g !== id) };
  return {
    ...closet,
    trip,
    garments: closet.garments.map((g) => (g.id === id ? { ...g, state } : g)),
  };
}

export type GarmentDraft = Omit<Garment, "id" | "state"> & { state?: GarmentState };

function slug(text: string) {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "") || "item";
}

function uniqueId(base: string, taken: Set<string>) {
  let id = base;
  for (let n = 2; taken.has(id); n += 1) id = `${base}-${n}`;
  return id;
}

export function addGarment(closet: Closet, draft: GarmentDraft): Closet {
  const name = draft.name.trim();
  if (!name) throw new Error("A garment needs a name");
  if (!isCategory(draft.category)) throw new Error("Choose a category");
  const id = uniqueId(slug(name), new Set(closet.garments.map((g) => g.id)));
  const garment: Garment = {
    id,
    name,
    category: draft.category,
    colour: draft.colour.trim(),
    material: draft.material.trim(),
    notes: draft.notes.trim(),
    state: draft.state ?? "clean",
    image: draft.image,
  };
  return { ...closet, garments: [...closet.garments, garment] };
}

export function updateGarment(
  closet: Closet,
  id: string,
  patch: Partial<Pick<Garment, "name" | "category" | "colour" | "material" | "notes">>,
): Closet {
  if (patch.name !== undefined && !patch.name.trim()) throw new Error("A garment needs a name");
  if (patch.category !== undefined && !isCategory(patch.category)) throw new Error("Choose a category");
  return {
    ...closet,
    garments: closet.garments.map((g) => (g.id === id ? { ...g, ...patch } : g)),
  };
}

export function createLook(
  closet: Closet,
  input: { title: string; occasion: string; garmentIds: string[] },
  now: Date = new Date(),
): Closet {
  const title = input.title.trim();
  if (!title) throw new Error("A look needs a title");
  const ids = [...new Set(input.garmentIds)];
  if (ids.length < 2) throw new Error("A look needs at least two garments");
  const known = new Set(closet.garments.map((g) => g.id));
  const unknown = ids.filter((id) => !known.has(id));
  if (unknown.length) throw new Error(`Unknown garments: ${unknown.join(", ")}`);
  const id = uniqueId(`look-${slug(title)}`, new Set(closet.looks.map((l) => l.id)));
  const look: Look = {
    id,
    title,
    occasion: input.occasion.trim(),
    garmentIds: ids,
    createdAt: now.toISOString(),
  };
  return { ...closet, looks: [look, ...closet.looks] };
}

export function packGarment(closet: Closet, id: string): Closet {
  const garment = closet.garments.find((g) => g.id === id);
  if (!garment) throw new Error(`Unknown garment ${id}`);
  if (closet.trip.garmentIds.includes(id)) return closet;
  if (garment.state !== "clean") throw new Error(`${garment.name} is not clean`);
  if (closet.trip.garmentIds.length >= closet.trip.limit) {
    throw new Error(`The carousel is full (${closet.trip.limit} items)`);
  }
  return { ...closet, trip: { ...closet.trip, garmentIds: [...closet.trip.garmentIds, id] } };
}

export function unpackGarment(closet: Closet, id: string): Closet {
  return {
    ...closet,
    trip: { ...closet.trip, garmentIds: closet.trip.garmentIds.filter((g) => g !== id) },
  };
}

export function setTripLimit(closet: Closet, limit: number): Closet {
  const safe = Math.max(1, Math.min(30, Math.floor(limit)));
  return {
    ...closet,
    trip: { ...closet.trip, limit: safe, garmentIds: closet.trip.garmentIds.slice(0, safe) },
  };
}
