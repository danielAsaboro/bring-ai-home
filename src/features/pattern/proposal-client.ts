import type { Example } from "./patterns.ts";
import { checkProposal, type ProposalCheck } from "./rule-schema.ts";

export const SERVICE_URL = "http://127.0.0.1:4319";

export type ProposalResponse =
  | { status: "ok"; raw: string; model: string; check: ProposalCheck }
  | { status: "unavailable"; message: string }
  | { status: "error"; message: string };

// Transport failures and model failures are reported differently. Neither changes a pattern.
export async function requestProposal(
  examples: readonly Example[],
  fetchImpl: typeof fetch = fetch,
): Promise<ProposalResponse> {
  let res: Response;
  try {
    res = await fetchImpl(`${SERVICE_URL}/propose`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ examples: examples.map(({ before, after }) => ({ before, after })) }),
    });
  } catch {
    return { status: "unavailable", message: "The local QVAC service is not running. Keep weaving by hand." };
  }
  const body = (await res.json().catch(() => ({}))) as {
    raw?: unknown;
    model?: unknown;
    error?: unknown;
    check?: { ok?: unknown; rules?: unknown; reasons?: unknown };
  };
  if (res.status === 503) return { status: "unavailable", message: String(body.error ?? "Proposals are not available") };
  if (!res.ok || typeof body.raw !== "string" || typeof body.model !== "string") {
    return { status: "error", message: String(body.error ?? `Service answered ${res.status}`) };
  }
  // Re-check in the browser: the app never trusts a rule it did not validate itself.
  const check: ProposalCheck =
    body.check?.ok === true
      ? checkProposal(body.check.rules)
      : { ok: false, reasons: Array.isArray(body.check?.reasons) ? body.check.reasons.map(String) : ["Proposal was not checked"] };
  return { status: "ok", raw: body.raw, model: body.model, check };
}
