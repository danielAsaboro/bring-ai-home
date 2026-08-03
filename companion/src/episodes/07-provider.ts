import { close, startQVACProvider, stopQVACProvider } from "@qvac/sdk";
import { option } from "../lib/args.js";
import { errorMessage, recordEvidence } from "../lib/evidence.js";

const allowedKey = option("--allow");
const seed = option("--seed");
if (seed) process.env.QVAC_HYPERSWARM_SEED = seed;

try {
  const response = await startQVACProvider(
    allowedKey ? { firewall: { mode: "allow", publicKeys: [allowedKey] } } : undefined,
  );
  if (!response.success || !response.publicKey) throw new Error(response.error ?? "Provider did not return a public key");
  await recordEvidence(7, "provider-started", "verified", { publicKey: response.publicKey, firewalled: Boolean(allowedKey) });
  console.log(`PROVIDER_KEY=${response.publicKey}`);
  console.log("Keep this process open. Press Ctrl+C to stop.");
  await new Promise<void>((resolve) => {
    process.once("SIGINT", resolve);
    process.once("SIGTERM", resolve);
  });
  await stopQVACProvider();
} catch (error) {
  await recordEvidence(7, "provider-failed", "verified", { error: errorMessage(error) });
  throw error;
} finally {
  await close();
}
