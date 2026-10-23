import { parseCheckFrameResponse, SERVICE_URL, type CheckFrameResponse } from "./check-contract";
import type { Frame } from "./sources";

export type CheckOutcome =
  | { ok: true; value: CheckFrameResponse }
  | { ok: false; kind: "unavailable" | "rejected" | "invalid"; message: string };

function toBase64(bytes: ArrayBuffer): string {
  let binary = "";
  const view = new Uint8Array(bytes);
  for (let i = 0; i < view.length; i += 1) binary += String.fromCharCode(view[i]);
  return btoa(binary);
}

// Sends one stored frame to the local service. Every failure comes back typed;
// the caller never has to guess, and never invents a verdict.
export async function checkFrame(
  frame: Frame,
  condition: string,
  fetchImpl: typeof fetch = fetch,
  serviceUrl = SERVICE_URL,
): Promise<CheckOutcome> {
  let response: Response;
  try {
    const image = await fetchImpl(frame.image);
    const pngBase64 = toBase64(await image.arrayBuffer());
    response = await fetchImpl(`${serviceUrl}/v1/check-frame`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ frameId: frame.id, condition, pngBase64 }),
    });
  } catch {
    return { ok: false, kind: "unavailable", message: "The local QVAC service is not running" };
  }
  const body: unknown = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      (body as { error?: { message?: string } } | null)?.error?.message ?? `Service answered ${response.status}`;
    return { ok: false, kind: response.status === 503 ? "unavailable" : "rejected", message };
  }
  const parsed = parseCheckFrameResponse(body);
  return parsed.ok ? parsed : { ok: false, kind: "invalid", message: parsed.message };
}
