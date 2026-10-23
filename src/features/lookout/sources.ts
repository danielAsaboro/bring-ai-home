// Fictional sample sources. Every frame is a drawn still in
// public/test-files/lookout. No real camera is connected to Lookout.

export type Frame = {
  id: string;
  sourceId: string;
  at: string; // local time of capture, "YYYY-MM-DDTHH:mm"
  image: string;
  motion: number; // 0..1, share of the frame that moved since the last frame
  change: number; // 0..1, share of the frame that differs from the reference still
  caption: string; // written by a person, describes the drawing
};

export type Source = {
  id: string;
  name: string;
  place: string;
  frames: Frame[];
};

function frame(
  sourceId: string,
  n: number,
  at: string,
  motion: number,
  change: number,
  caption: string,
): Frame {
  return {
    id: `${sourceId}-${n}`,
    sourceId,
    at,
    image: `/test-files/lookout/${sourceId}-${n}.png`,
    motion,
    change,
    caption,
  };
}

export const sampleSources: Source[] = [
  {
    id: "front-gate",
    name: "Front gate",
    place: "Path to the street",
    frames: [
      frame("front-gate", 1, "2026-03-14T07:10", 0.02, 0.01, "Closed gate, nobody there"),
      frame("front-gate", 2, "2026-03-14T10:42", 0.61, 0.34, "A courier stands by the gate holding a box"),
      frame("front-gate", 3, "2026-03-14T10:44", 0.08, 0.22, "A parcel sits by the gate, nobody there"),
      frame("front-gate", 4, "2026-03-14T22:15", 0.48, 0.18, "A cat walks along the wall at night"),
    ],
  },
  {
    id: "back-garden",
    name: "Back garden",
    place: "Lawn and apple tree",
    frames: [
      frame("back-garden", 1, "2026-03-14T06:30", 0.01, 0.0, "Quiet garden at dawn"),
      frame("back-garden", 2, "2026-03-14T14:05", 0.55, 0.05, "Wind moves the tree"),
      frame("back-garden", 3, "2026-03-15T02:20", 0.4, 0.2, "A fox crosses the lawn at night"),
      frame("back-garden", 4, "2026-03-15T18:00", 0.01, 0.0, "Quiet garden in the evening"),
    ],
  },
  {
    id: "studio-door",
    name: "Studio door",
    place: "Workshop entrance",
    frames: [
      frame("studio-door", 1, "2026-03-14T09:00", 0.0, 0.0, "Door closed"),
      frame("studio-door", 2, "2026-03-14T23:40", 0.3, 0.41, "Door open at night"),
      frame("studio-door", 3, "2026-03-14T23:41", 0.7, 0.5, "A figure stands in the open doorway"),
      frame("studio-door", 4, "2026-03-15T08:00", 0.0, 0.0, "Door closed"),
    ],
  },
];

export function findFrame(sources: Source[], frameId: string): Frame | undefined {
  for (const source of sources) {
    const match = source.frames.find((f) => f.id === frameId);
    if (match) return match;
  }
  return undefined;
}

// All frames from every source, in capture order.
export function allFrames(sources: Source[]): Frame[] {
  return sources.flatMap((s) => s.frames).sort((a, b) => a.at.localeCompare(b.at));
}
