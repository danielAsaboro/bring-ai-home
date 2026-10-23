import {
  parseHealthResponse,
  parseReadReceiptResponse,
  parseServiceError,
  type HealthResponse,
  type ReadReceiptResponse,
} from "./receipt-contract";

export type ReceiptClient = {
  health(signal?: AbortSignal): Promise<HealthResponse>;
  readReceipt(
    input: { receiptId: string; fileName: string; pngBytes: ArrayBuffer },
    signal?: AbortSignal,
  ): Promise<ReadReceiptResponse>;
};

function bytesToBase64(bytes: ArrayBuffer): string {
  const view = new Uint8Array(bytes);
  let binary = "";
  for (let offset = 0; offset < view.length; offset += 0x8000) {
    binary += String.fromCharCode(...view.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

export function createReceiptClient(
  options: { baseUrl?: string; fetchImpl?: typeof fetch } = {},
): ReceiptClient {
  const baseUrl = (
    options.baseUrl ??
    process.env.NEXT_PUBLIC_LEDGER_QVAC_URL ??
    "http://127.0.0.1:4318"
  ).replace(/\/$/, "");
  const fetchImpl = options.fetchImpl ?? fetch;

  async function readJson(response: Response, invalid: string): Promise<unknown> {
    let value: unknown;
    try {
      value = await response.json();
    } catch {
      throw new Error(invalid);
    }
    if (!response.ok) {
      throw new Error(parseServiceError(value)?.error.message ?? invalid);
    }
    return value;
  }

  return {
    async health(signal) {
      const response = await fetchImpl(`${baseUrl}/health`, { signal });
      const parsed = parseHealthResponse(
        await readJson(response, "Local service returned an invalid health response"),
      );
      if (!parsed.ok) throw new Error(parsed.message);
      return parsed.value;
    },
    async readReceipt(input, signal) {
      const response = await fetchImpl(`${baseUrl}/v1/read-receipt`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          receiptId: input.receiptId,
          fileName: input.fileName,
          pngBase64: bytesToBase64(input.pngBytes),
        }),
        signal,
      });
      const parsed = parseReadReceiptResponse(
        await readJson(response, "Local service returned an invalid receipt response"),
      );
      if (!parsed.ok) throw new Error(parsed.message);
      return parsed.value;
    },
  };
}
