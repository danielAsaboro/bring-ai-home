import assert from "node:assert/strict";
import test from "node:test";
import { validateDelegationTimeout, validateProviderPublicKey } from "../src/lib/delegation.js";

test("provider keys require 64 hexadecimal characters", () => {
  assert.throws(() => validateProviderPublicKey("not-a-key"), /64 hexadecimal/);
  assert.equal(validateProviderPublicKey("A".repeat(64)), "a".repeat(64));
});

test("delegation timeouts are bounded", () => {
  assert.equal(validateDelegationTimeout("60000"), 60_000);
  assert.throws(() => validateDelegationTimeout("0"), /1 to 300000/);
  assert.throws(() => validateDelegationTimeout("Infinity"), /1 to 300000/);
});
