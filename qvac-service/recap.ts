export type RecapSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

// A transcript is a proposal. Nothing here writes to a person's timeline.
export type RecapDraft = {
  status: "proposed";
  source: "local-transcription";
  model: string;
  transcript: string;
  durationMs: number;
  segments: RecapSegment[];
};

export function buildRecapDraft(
  segments: RecapSegment[],
  model: string,
): RecapDraft {
  const kept = segments
    .map((s) => ({ ...s, text: s.text.replace(/\s+/g, " ").trim() }))
    .filter((s) => s.text.length > 0);
  if (kept.length === 0) {
    throw new Error("No speech was recognised in this recap");
  }
  return {
    status: "proposed",
    source: "local-transcription",
    model,
    transcript: kept.map((s) => s.text).join(" "),
    durationMs: Math.max(...kept.map((s) => s.endMs)),
    segments: kept,
  };
}
