import type { Memory } from "./archive";

export const CAPTION_SERVICE_URL = "http://127.0.0.1:4318";

export type DraftResult =
  | { ok: true; memoryId: string; draft: string; model: string }
  | { ok: false; error: string };

export type RequestDraft = (memory: Memory) => Promise<DraftResult>;

export function parseDraftResponse(memoryId: string, status: number, body: unknown): DraftResult {
  const v = body as { memoryId?: unknown; draft?: unknown; model?: unknown; error?: unknown } | null;
  if (status !== 200) {
    return { ok: false, error: typeof v?.error === "string" ? v.error : `Service answered ${status}` };
  }
  if (
    !v ||
    v.memoryId !== memoryId ||
    typeof v.draft !== "string" ||
    v.draft.trim().length === 0 ||
    typeof v.model !== "string"
  ) {
    return { ok: false, error: "The service returned an invalid draft" };
  }
  return { ok: true, memoryId, draft: v.draft, model: v.model };
}

export const requestDraft: RequestDraft = async (memory) => {
  try {
    const res = await fetch(`${CAPTION_SERVICE_URL}/caption`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify(memory),
    });
    return parseDraftResponse(memory.id, res.status, await res.json().catch(() => null));
  } catch {
    return { ok: false, error: "The local QVAC service is not running" };
  }
};
