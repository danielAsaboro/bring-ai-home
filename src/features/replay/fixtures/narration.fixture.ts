import type { NarrationSegment } from "../narration.ts";

// FIXTURE: hand-written segments shaped like QVAC Whisper output.
// This is NOT model output. Tests use it so every viewer gets the same result.
export const WEEKLY_REPORT_NARRATION_FIXTURE: NarrationSegment[] = [
  { text: " First I open the Harbor dashboard and pick the Operations workspace.", startMs: 0, endMs: 4200 },
  { text: "[BLANK_AUDIO]", startMs: 4200, endMs: 5000 },
  { text: " Then I set the date range to last week, so for this one the week starting September 28th.", startMs: 5000, endMs: 10400 },
  { text: " I export the summary as a CSV.", startMs: 10400, endMs: 12900 },
  { text: " If the export comes back empty, I stop and ask in the ops channel.", startMs: 12900, endMs: 17100 },
  { text: " Finally I paste the totals into the template and publish it to the team page.", startMs: 17100, endMs: 22000 },
];
