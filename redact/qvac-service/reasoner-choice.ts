import { createDecisionReasoner } from "./decision-reasoner";
import { createStructuredReasoner, type DocumentReasoner } from "./reasoning";

export type ReasonerKind = "laya" | "qwen";

type Qvac = typeof import("@qvac/sdk");

export function reasonerKindFromEnv(value = process.env.REDACT_REASONER): ReasonerKind {
  if (!value || value === "laya") return "laya";
  if (value === "qwen") return "qwen";
  throw new Error(`REDACT_REASONER must be "laya" or "qwen", not "${value}"`);
}

export function createReasoner(
  qvac: Qvac,
  kind: ReasonerKind,
  loadModel: (options: unknown) => Promise<string> = (options) => qvac.loadModel(options as never),
): DocumentReasoner {
  if (kind === "laya") {
    return createDecisionReasoner({
      modelSource: qvac.LAYA_421M_Q8_0,
      runtime: {
        loadModel,
        decide: (options) => qvac.decide(options as never) as never,
        unloadModel: (options) => qvac.unloadModel(options),
      },
    });
  }
  return createStructuredReasoner({
    modelSource: qvac.QWEN3_600M_INST_Q4,
    runtime: {
      loadModel,
      completion: (options) => qvac.completion(options as never),
      unloadModel: (options) => qvac.unloadModel(options),
    },
  });
}
