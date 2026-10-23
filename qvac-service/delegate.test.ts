import { describe, expect, it } from "vitest";

import { delegateModelConfig, describePlacement, parseDelegateEndpoint } from "./delegate";

describe("delegate endpoint", () => {
  it("accepts private-network IPv4 endpoints", () => {
    expect(parseDelegateEndpoint("192.168.1.20:50052")).toEqual({ host: "192.168.1.20", port: 50052 });
    expect(parseDelegateEndpoint("10.0.0.2:50052")).toEqual({ host: "10.0.0.2", port: 50052 });
    expect(parseDelegateEndpoint("172.20.4.9:9000")?.host).toBe("172.20.4.9");
    expect(parseDelegateEndpoint(undefined)).toBeNull();
  });

  it("refuses public hosts, names, and bad ports", () => {
    expect(() => parseDelegateEndpoint("8.8.8.8:50052")).toThrow("not on a private network");
    expect(() => parseDelegateEndpoint("172.32.0.1:50052")).toThrow("not on a private network");
    expect(() => parseDelegateEndpoint("gpu-box.local:50052")).toThrow("<private-ipv4>:<port>");
    expect(() => parseDelegateEndpoint("192.168.1.20:70000")).toThrow("out of range");
    expect(() => parseDelegateEndpoint("192.168..20:5")).toThrow("not on a private network");
  });

  it("builds the llama.cpp RPC model config", () => {
    expect(delegateModelConfig(parseDelegateEndpoint("192.168.1.20:50052"))).toEqual({
      "rpc-servers": "192.168.1.20:50052",
      devices: "RPC0",
    });
    expect(delegateModelConfig(null)).toEqual({});
    expect(describePlacement(null)).toBe("this machine");
  });
});
