import { evaluateRules, type Rule } from "./rules";
import { allFrames, type Source } from "./sources";

export type LookoutEvent = {
  id: string;
  frameId: string;
  sourceId: string;
  at: string;
  reasons: string[];
  acknowledged: boolean;
};

// Replays every stored frame through the ordinary rules. Disarmed sources are
// skipped entirely: they never raise events.
export function replayFrames(
  sources: Source[],
  armed: Record<string, boolean>,
  rules: Rule[],
): LookoutEvent[] {
  const events: LookoutEvent[] = [];
  for (const frame of allFrames(sources)) {
    if (!armed[frame.sourceId]) continue;
    const reasons = evaluateRules(rules, frame);
    if (!reasons) continue;
    events.push({
      id: `evt-${frame.id}`,
      frameId: frame.id,
      sourceId: frame.sourceId,
      at: frame.at,
      reasons,
      acknowledged: false,
    });
  }
  // The tape shows newest first.
  return events.reverse();
}

// Keeps acknowledgements across replays of the same frames.
export function mergeTape(previous: LookoutEvent[], next: LookoutEvent[]): LookoutEvent[] {
  const acked = new Set(previous.filter((e) => e.acknowledged).map((e) => e.id));
  return next.map((e) => (acked.has(e.id) ? { ...e, acknowledged: true } : e));
}

export function acknowledge(tape: LookoutEvent[], eventId: string): LookoutEvent[] {
  return tape.map((e) => (e.id === eventId ? { ...e, acknowledged: true } : e));
}
