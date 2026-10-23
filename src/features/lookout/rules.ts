import type { Frame } from "./sources";

// Ordinary, deterministic rules. No model is involved.
export type Rule =
  | { id: string; sourceId: string; kind: "motion"; minMotion: number }
  | { id: string; sourceId: string; kind: "change"; minChange: number }
  | { id: string; sourceId: string; kind: "time"; fromHour: number; toHour: number };

export const ANY_SOURCE = "any";

function hourOf(at: string): number {
  return Number(at.slice(11, 13));
}

// True when the hour falls inside [fromHour, toHour). Windows may wrap midnight.
export function inWindow(at: string, fromHour: number, toHour: number): boolean {
  const h = hourOf(at);
  if (fromHour === toHour) return true;
  return fromHour < toHour ? h >= fromHour && h < toHour : h >= fromHour || h < toHour;
}

export function describeRule(rule: Rule): string {
  switch (rule.kind) {
    case "motion":
      return `motion ≥ ${Math.round(rule.minMotion * 100)}%`;
    case "change":
      return `scene change ≥ ${Math.round(rule.minChange * 100)}%`;
    case "time":
      return `between ${String(rule.fromHour).padStart(2, "0")}:00 and ${String(rule.toHour).padStart(2, "0")}:00`;
  }
}

function applies(rule: Rule, frame: Frame): boolean {
  return rule.sourceId === ANY_SOURCE || rule.sourceId === frame.sourceId;
}

function matches(rule: Rule, frame: Frame): boolean {
  switch (rule.kind) {
    case "motion":
      return frame.motion >= rule.minMotion;
    case "change":
      return frame.change >= rule.minChange;
    case "time":
      return inWindow(frame.at, rule.fromHour, rule.toHour);
  }
}

// A frame raises an event when any applicable motion or change rule matches and
// every applicable time rule matches. Time rules only narrow; they never trigger alone.
export function evaluateRules(rules: Rule[], frame: Frame): string[] | null {
  const applicable = rules.filter((r) => applies(r, frame));
  const windows = applicable.filter((r) => r.kind === "time");
  const fired = applicable.filter((r) => r.kind !== "time" && matches(r, frame));
  if (fired.length === 0) return null;
  if (!windows.every((r) => matches(r, frame))) return null;
  return [...windows, ...fired].map(describeRule);
}
