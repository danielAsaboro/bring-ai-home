import { SERVICE_URL } from "./check-contract";
import { sampleSources } from "./sources";
import { validateWatcherProposal, type WatcherProposal } from "./watcher";

export type ProposeOutcome =
  | { ok: true; proposal: WatcherProposal; raw: string; model: string }
  | { ok: false; message: string; raw?: string };

export async function proposeWatcher(
  sentence: string,
  fetchImpl: typeof fetch = fetch,
  serviceUrl = SERVICE_URL,
): Promise<ProposeOutcome> {
  let response: Response;
  try {
    response = await fetchImpl(`${serviceUrl}/v1/propose-watcher`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ sentence }),
    });
  } catch {
    return { ok: false, message: "The local QVAC service is not running" };
  }
  const body = (await response.json().catch(() => null)) as
    | { proposal?: unknown; raw?: string; model?: string; error?: { message?: string } }
    | null;
  if (!response.ok || !body) {
    return { ok: false, message: body?.error?.message ?? `Service answered ${response.status}`, raw: body?.raw };
  }
  // Validate again on this side of the boundary.
  const checked = validateWatcherProposal(body.proposal, sampleSources.map((s) => s.id));
  if (!checked.ok) return { ok: false, message: checked.message, raw: body.raw };
  return { ok: true, proposal: checked.value, raw: body.raw ?? "", model: body.model ?? "unknown" };
}
