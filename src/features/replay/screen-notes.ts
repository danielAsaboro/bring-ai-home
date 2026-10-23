// What a local vision model said about one screenshot.
// A screen note is evidence. It never becomes a frame without a person.

export const SCREEN_NOTE_PROMPT =
  "This is a screenshot taken while someone demonstrated a task. In two short sentences, name the app or page that is visible and the control that looks active. Describe only what is visible. Do not guess passwords, names, or numbers you cannot read.";

export const MAX_NOTE_CHARS = 400;

export type ScreenNote = { text: string; truncated: boolean };

export function parseScreenNote(raw: string): ScreenNote {
  // SmolVLM2 sometimes echoes a role prefix; strip it before judging the text.
  const text = raw.replace(/^\s*(assistant|answer)\s*:\s*/i, "").replace(/\s+/g, " ").trim();
  if (!text) throw new Error("The vision model returned an empty description");
  if (text.length <= MAX_NOTE_CHARS) return { text, truncated: false };
  const cut = text.slice(0, MAX_NOTE_CHARS);
  return { text: `${cut.slice(0, Math.max(cut.lastIndexOf(" "), 1))}…`, truncated: true };
}

export const IMAGE_TYPES: Record<string, string> = { png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg" };

export function imageExtension(fileName: string) {
  const ext = fileName.toLowerCase().split(".").pop() ?? "";
  return ext in IMAGE_TYPES ? ext : null;
}
