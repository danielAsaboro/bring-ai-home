export function validateProviderPublicKey(value: string): string {
  if (!/^[a-f0-9]{64}$/i.test(value)) {
    throw new Error("Provider public key must be exactly 64 hexadecimal characters");
  }
  return value.toLowerCase();
}

export function validateDelegationTimeout(value: string): number {
  const timeout = Number(value);
  if (!Number.isInteger(timeout) || timeout < 1 || timeout > 300_000) {
    throw new Error("Delegation timeout must be an integer from 1 to 300000 milliseconds");
  }
  return timeout;
}
