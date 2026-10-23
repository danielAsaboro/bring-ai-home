export type TranscriptSegment = {
  text: string;
  startMs: number;
  endMs: number;
};

export type MemoryDraft = {
  status: "proposed";
  transcript: string;
  durationMs: number;
  sourceName: string;
  sourceDigest: string;
  model: string;
};

// Whisper segments can carry leading spaces and empty pieces.
export function joinSegments(segments: TranscriptSegment[]): string {
  return segments
    .map((segment) => segment.text.trim())
    .filter((text) => text.length > 0)
    .join(" ")
    .replace(/\s+/g, " ")
    .trim();
}

// A transcript only proposes a memory. A person still titles and saves it.
export function buildMemoryDraft(input: {
  segments: TranscriptSegment[];
  sourceName: string;
  sourceDigest: string;
  model: string;
}): MemoryDraft {
  const transcript = joinSegments(input.segments);
  if (transcript.length === 0) {
    throw new Error("No speech was recognised in this recording");
  }
  const durationMs = Math.max(0, ...input.segments.map((segment) => segment.endMs));
  return {
    status: "proposed",
    transcript,
    durationMs,
    sourceName: input.sourceName,
    sourceDigest: input.sourceDigest,
    model: input.model,
  };
}
