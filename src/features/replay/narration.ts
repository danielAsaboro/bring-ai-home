// Turns raw transcription segments into a reviewable narration.
// The transcript is evidence of what was said. It is never a step by itself.

export type NarrationSegment = { text: string; startMs: number; endMs: number };

export type Narration = {
  transcript: string;
  segments: NarrationSegment[];
  durationMs: number;
};

export function toNarration(raw: readonly NarrationSegment[]): Narration {
  const segments = raw
    .map((s) => ({ text: s.text.replace(/\s+/g, " ").trim(), startMs: s.startMs, endMs: s.endMs }))
    .filter((s) => s.text.length > 0 && Number.isFinite(s.startMs) && Number.isFinite(s.endMs))
    // Whisper marks silence and noise with bracketed tags such as [BLANK_AUDIO].
    .filter((s) => !/^\[[A-Z_ ]+\]$/.test(s.text))
    .sort((a, b) => a.startMs - b.startMs);
  if (segments.length === 0) throw new Error("No speech was recognised in this recording");
  return {
    transcript: segments.map((s) => s.text).join(" "),
    segments,
    durationMs: Math.max(...segments.map((s) => s.endMs)),
  };
}

export function formatTimestamp(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, "0")}`;
}
