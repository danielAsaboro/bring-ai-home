import type { Passage } from "./context";

export type FollowUpDraft = {
  status: "draft";
  model: string;
  text: string;
  basedOn: string[];
};

export const MAX_DRAFT_CHARS = 600;

export function buildFollowUpPrompt(
  personName: string,
  intent: string,
  context: Passage[],
): string {
  return [
    `Write a short, warm message I could send to ${personName}.`,
    `What I want to say: ${intent}`,
    "Use only these notes I saved. Do not add facts, plans, or dates that are not here.",
    ...context.map((c) => `- ${c.text}`),
    "Two to four sentences. Plain text. No subject line, no signature.",
  ].join("\n");
}

// The app, not the model, decides what a usable draft looks like.
export function cleanDraft(
  raw: string,
  model: string,
  context: Passage[],
): FollowUpDraft {
  const text = raw
    .replace(/^\s*subject:.*$/gim, "")
    .trim()
    .replace(/^["“]+|["”]+$/g, "")
    .trim();
  if (!text) throw new Error("The model returned an empty draft");
  return {
    status: "draft",
    model,
    text: text.length > MAX_DRAFT_CHARS ? `${text.slice(0, MAX_DRAFT_CHARS).trimEnd()}…` : text,
    basedOn: context.map((c) => c.id),
  };
}
