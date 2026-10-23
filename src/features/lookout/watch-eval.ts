import type { CheckOutcome } from "./check-client";
import { inWindow } from "./rules.ts";
import type { Frame } from "./sources";
import type { Verdict } from "./verdict";
import type { Watcher } from "./watcher";

export type WatchHit = {
  id: string;
  watcherId: string;
  frameId: string;
  verdict: Verdict;
  model: string;
  status: "pending" | "confirmed" | "dismissed";
};

export type WatchRun = { hits: WatchHit[]; checked: number; skipped: number; errors: string[] };

// Ordinary prefilters run first. They are cheap, deterministic, and keep
// frames away from the model when the watcher cannot apply.
export function passesPrefilter(watcher: Watcher, frame: Frame): boolean {
  return (
    frame.sourceId === watcher.sourceId &&
    inWindow(frame.at, watcher.fromHour, watcher.toHour) &&
    frame.motion >= watcher.minMotion
  );
}

// The model proposes a verdict per frame. The app decides: only a clear "yes"
// becomes a hit, and every hit waits for a person to confirm or dismiss it.
export async function evaluateWatcher(
  watcher: Watcher,
  frames: Frame[],
  check: (frame: Frame, condition: string) => Promise<CheckOutcome>,
): Promise<WatchRun> {
  const run: WatchRun = { hits: [], checked: 0, skipped: 0, errors: [] };
  for (const frame of frames) {
    if (!passesPrefilter(watcher, frame)) {
      run.skipped += 1;
      continue;
    }
    const outcome = await check(frame, watcher.condition);
    if (!outcome.ok) {
      run.errors.push(`${frame.id}: ${outcome.message}`);
      // A service that is down will not come back mid-run; stop asking.
      if (outcome.kind === "unavailable") break;
      continue;
    }
    run.checked += 1;
    if (outcome.value.verdict.answer === "yes") {
      run.hits.push({
        id: `${watcher.id}:${frame.id}`,
        watcherId: watcher.id,
        frameId: frame.id,
        verdict: outcome.value.verdict,
        model: outcome.value.model,
        status: "pending",
      });
    }
  }
  return run;
}

// Re-running keeps earlier human decisions for the same watcher and frame.
export function mergeHits(previous: WatchHit[], next: WatchHit[]): WatchHit[] {
  const decided = new Map(previous.filter((h) => h.status !== "pending").map((h) => [h.id, h]));
  const merged = next.map((h) => decided.get(h.id) ?? h);
  const kept = previous.filter((h) => h.status !== "pending" && !merged.some((m) => m.id === h.id));
  return [...merged, ...kept];
}

export function decideHit(hits: WatchHit[], id: string, status: "confirmed" | "dismissed"): WatchHit[] {
  return hits.map((h) => (h.id === id ? { ...h, status } : h));
}
