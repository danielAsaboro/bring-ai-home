import type { Asset, MaintenanceTask, ServiceRecord } from "./binder.ts";
import type { ChatMessage } from "./cited-answer.ts";

export type SummaryRequest = { asset: Asset; history: ServiceRecord[]; tasks: MaintenanceTask[] };

export function buildSummaryHistory({ asset, history, tasks }: SummaryRequest): ChatMessage[] {
  const records = history.map((r) => `- ${r.date}: ${r.summary}`).join("\n") || "- none";
  const schedule = tasks.map((t) => `- ${t.title}, every ${t.everyMonths} months, next due ${t.nextDue}`).join("\n") || "- none";
  return [
    {
      role: "system",
      content:
        "Write a short maintenance summary for the next person who looks after this home. " +
        "Use only the records given. Copy dates exactly as written. Three sentences at most. No advice that is not in the records.",
    },
    {
      role: "user",
      content: `Asset: ${asset.name} (${asset.brand} ${asset.model}), installed ${asset.installedOn || "unknown"}.\nService records:\n${records}\nSchedule:\n${schedule}`,
    },
  ];
}

export type SummaryDraft = {
  kind: "proposed-summary";
  draft: string;
  // Dates in the draft that appear nowhere in the records it was given.
  unsupportedDates: string[];
};

export function parseSummaryDraft(rawText: string, request: SummaryRequest): SummaryDraft {
  const draft = rawText.replace(/\s+/g, " ").trim().slice(0, 800);
  if (!draft) throw new Error("The model returned an empty summary");
  const known = new Set<string>([
    ...request.history.map((r) => r.date),
    ...request.tasks.map((t) => t.nextDue),
    request.asset.installedOn,
  ]);
  const unsupportedDates = [...new Set(draft.match(/\b\d{4}-\d{2}-\d{2}\b/g) ?? [])].filter((d) => !known.has(d));
  return { kind: "proposed-summary", draft, unsupportedDates };
}

export function parseSummaryRequest(value: unknown): SummaryRequest {
  const v = value as Partial<SummaryRequest> | null;
  if (!v || !v.asset || typeof v.asset.name !== "string" || !Array.isArray(v.history) || !Array.isArray(v.tasks)) {
    throw new Error("Request must contain an asset, its history, and its tasks");
  }
  return { asset: v.asset, history: v.history.slice(-30), tasks: v.tasks.slice(0, 20) };
}
