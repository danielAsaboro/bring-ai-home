// A model's answer to "does this frame show <condition>?".
// The model proposes; this parser decides what Lookout will believe.

export type Verdict = {
  answer: "yes" | "no" | "unclear";
  reason: string;
};

export const MAX_CONDITION_LENGTH = 120;

export function buildConditionPrompt(condition: string): string {
  const clean = condition.replace(/\s+/g, " ").trim();
  if (!clean) throw new Error("Write a condition first");
  if (clean.length > MAX_CONDITION_LENGTH) throw new Error("Keep the condition under 120 characters");
  return (
    `Condition: ${clean}\n` +
    "Look only at this still frame. Does it show the condition? " +
    "Start your reply with exactly YES or NO, then give one short reason based on what is visible."
  );
}

// Anything that does not start with a clear yes or no is "unclear".
// Unclear never raises an alert on its own.
export function parseVerdict(raw: string): Verdict {
  const text = raw.replace(/\s+/g, " ").trim();
  const match = /^\W*(yes|no)\b[\s.,:;!-]*(.*)$/i.exec(text);
  if (!match) return { answer: "unclear", reason: text.slice(0, 200) };
  return {
    answer: match[1].toLowerCase() as "yes" | "no",
    reason: match[2].slice(0, 200),
  };
}
