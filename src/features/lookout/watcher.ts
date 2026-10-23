// A watcher is an inspectable rule: ordinary prefilters (source, hours, motion)
// plus one plain-language condition that a vision model checks later.
// A language model may propose one. Only a person may activate it.
import { MAX_CONDITION_LENGTH } from "./verdict.ts";

export type Watcher = {
  id: string;
  sourceId: string;
  condition: string;
  fromHour: number;
  toHour: number;
  minMotion: number;
  // Set by a person while tuning (lesson 06). Frames moving more are skipped.
  maxMotion?: number;
};

export type WatcherProposal = Omit<Watcher, "id" | "maxMotion">;

export const WATCHER_JSON_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["sourceId", "condition", "fromHour", "toHour", "minMotion"],
  properties: {
    sourceId: { type: "string" },
    condition: { type: "string" },
    fromHour: { type: "integer", minimum: 0, maximum: 23 },
    toHour: { type: "integer", minimum: 0, maximum: 23 },
    minMotion: { type: "number", minimum: 0, maximum: 1 },
  },
} as const;

export function buildWatcherHistory(sentence: string, sources: { id: string; name: string }[]) {
  const list = sources.map((s) => `${s.id} (${s.name})`).join(", ");
  return [
    {
      role: "system" as const,
      content:
        "You turn a request into a watcher rule as JSON. " +
        `sourceId must be one of: ${list}. ` +
        "condition is a short visible situation to look for in one still frame. " +
        "fromHour and toHour are whole hours 0-23; use 0 and 0 for all day. " +
        "minMotion is 0 to 1; use 0 when the thing may be still.",
    },
    { role: "user" as const, content: sentence },
  ];
}

type Result<T> = { ok: true; value: T } | { ok: false; message: string };

function isHour(v: unknown): v is number {
  return typeof v === "number" && Number.isInteger(v) && v >= 0 && v <= 23;
}

// The app decides. Shape, the fixed source list, and ranges are checked here,
// whatever the JSON Schema promised.
export function validateWatcherProposal(value: unknown, sourceIds: readonly string[]): Result<WatcherProposal> {
  if (typeof value !== "object" || value === null) return { ok: false, message: "Proposal is not an object" };
  const v = value as Record<string, unknown>;
  if (typeof v.sourceId !== "string" || !sourceIds.includes(v.sourceId)) {
    return { ok: false, message: `Unknown source "${String(v.sourceId)}"` };
  }
  const condition = typeof v.condition === "string" ? v.condition.replace(/\s+/g, " ").trim() : "";
  if (!condition || condition.length > MAX_CONDITION_LENGTH) return { ok: false, message: "Condition is empty or too long" };
  if (!isHour(v.fromHour) || !isHour(v.toHour)) return { ok: false, message: "Hours must be whole numbers from 0 to 23" };
  if (typeof v.minMotion !== "number" || !(v.minMotion >= 0 && v.minMotion <= 1)) {
    return { ok: false, message: "minMotion must be between 0 and 1" };
  }
  return {
    ok: true,
    value: { sourceId: v.sourceId, condition, fromHour: v.fromHour, toHour: v.toHour, minMotion: v.minMotion },
  };
}

export function parseWatcherJson(raw: string, sourceIds: readonly string[]): Result<WatcherProposal> {
  try {
    return validateWatcherProposal(JSON.parse(raw), sourceIds);
  } catch {
    return { ok: false, message: "Model reply was not JSON" };
  }
}
