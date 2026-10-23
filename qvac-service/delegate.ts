// Delegated inference with QVAC 0.22.0.
// The SDK has no "delegate" call. It has ggml RPC: a stronger machine runs
// startRpcServer, and this machine loads the model with modelConfig
// "rpc-servers" so the heavy tensor work runs over there.
// The RPC link is not encrypted or authenticated, so Lookout only accepts a
// private-network IPv4 endpoint and never a public host or a name to resolve.

export type DelegateEndpoint = { host: string; port: number };

function isPrivateIpv4(host: string): boolean {
  const parts = host.split(".").map(Number);
  if (parts.length !== 4 || parts.some((n, i) => !Number.isInteger(n) || n < 0 || n > 255 || host.split(".")[i] === "")) return false;
  const [a, b] = parts;
  return a === 10 || (a === 172 && b >= 16 && b <= 31) || (a === 192 && b === 168) || a === 127;
}

export function parseDelegateEndpoint(value: string | undefined): DelegateEndpoint | null {
  if (!value) return null;
  const match = /^([0-9.]+):(\d{1,5})$/.exec(value.trim());
  if (!match) throw new Error(`Delegate must be <private-ipv4>:<port>, got "${value}"`);
  const [, host, portText] = match;
  const port = Number(portText);
  if (!isPrivateIpv4(host)) throw new Error(`Delegate ${host} is not on a private network`);
  if (port < 1 || port > 65535) throw new Error(`Delegate port ${port} is out of range`);
  return { host, port };
}

// The modelConfig keys QVAC passes to llama.cpp. One server exposes its first
// device as RPC0. For several servers or devices, use discoverRpcServers and
// getRpcDeviceMap to build these strings instead.
export function delegateModelConfig(endpoint: DelegateEndpoint | null): Record<string, string> {
  if (!endpoint) return {};
  return { "rpc-servers": `${endpoint.host}:${endpoint.port}`, devices: "RPC0" };
}

export function describePlacement(endpoint: DelegateEndpoint | null): string {
  return endpoint ? `delegated to ${endpoint.host}:${endpoint.port}` : "this machine";
}
