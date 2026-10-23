export type ProofStep = {
  route: string;
  status: number;
  ms: number;
  model?: string;
};

export function isLoopback(url: string): boolean {
  const host = new URL(url).hostname;
  return host === "127.0.0.1" || host === "localhost" || host === "[::1]";
}

// A proof only counts when the network was really off and every route answered.
export function summarizeProof(networkReachable: boolean, steps: ProofStep[]) {
  const failed = steps.filter((s) => s.status !== 200);
  const verdict = networkReachable
    ? "not-proven: the network was reachable during this run"
    : failed.length > 0
      ? `failed: ${failed.map((s) => `${s.route} ${s.status}`).join(", ")}`
      : "offline: every route answered with the network off";
  return { networkReachable, verdict, steps };
}
