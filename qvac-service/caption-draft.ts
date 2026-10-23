import type { Memory } from "../src/features/chronicle/archive";

export const MAX_CAPTION_LENGTH = 160;

export type CaptionContext = {
  memory: Memory;
  // Optional proposals from earlier chapters. They are labelled as such.
  photoDescription?: string;
  spokenTranscript?: string;
};

export function buildCaptionHistory(context: CaptionContext) {
  const { memory } = context;
  const facts = [
    `Title: ${memory.title}`,
    `Date: ${memory.date}`,
    `People: ${memory.people.join(", ")}`,
    `Current caption (written by the family): ${memory.caption}`,
  ];
  if (context.photoDescription) {
    facts.push(`Unconfirmed photo description: ${context.photoDescription}`);
  }
  if (context.spokenTranscript) {
    facts.push(`Unconfirmed spoken memory: ${context.spokenTranscript}`);
  }
  return [
    {
      role: "system" as const,
      content:
        "You write short captions for a private family magazine. Use only the facts given. Do not invent names, places, or events. Reply with the caption only, one or two sentences.",
    },
    { role: "user" as const, content: facts.join("\n") },
  ];
}

// Raw model text becomes a draft only if it passes these checks.
export function parseCaptionDraft(raw: string): string {
  const text = raw
    .replace(/^\s*(caption|draft)\s*:\s*/i, "")
    .replace(/\s+/g, " ")
    .trim()
    .replace(/^["“']+|["”']+$/g, "")
    .trim();
  if (text.length === 0) throw new Error("The model returned an empty caption");
  if (text.length > MAX_CAPTION_LENGTH) {
    throw new Error(
      `The draft is ${text.length} characters; captions are limited to ${MAX_CAPTION_LENGTH}`,
    );
  }
  return text;
}
