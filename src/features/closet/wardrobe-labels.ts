import { isCategory, type Category } from "./model";

export type ClassifierResult = { label: string; confidence: number };

export type ClassifierVerdict =
  | { kind: "accepted"; label: Category; confidence: number }
  | { kind: "below-threshold"; label: Category; confidence: number }
  | { kind: "not-a-wardrobe-label"; label: string; confidence: number }
  | { kind: "no-result" };

export const CLASSIFIER_THRESHOLD = 0.6;

// A classifier's label is only useful if it is one of Closet's categories and
// confident enough. The bundled QVAC classifier emits food/report/other, so it
// lands in "not-a-wardrobe-label" until a wardrobe model is configured.
export function judgeClassification(
  results: readonly ClassifierResult[],
  threshold = CLASSIFIER_THRESHOLD,
): ClassifierVerdict {
  const valid = results.filter(
    (r) => typeof r.label === "string" && Number.isFinite(r.confidence) && r.confidence >= 0 && r.confidence <= 1,
  );
  if (valid.length === 0) return { kind: "no-result" };
  const top = [...valid].sort((a, b) => b.confidence - a.confidence)[0];
  const label = top.label.trim().toLowerCase();
  if (!isCategory(label)) return { kind: "not-a-wardrobe-label", label: top.label, confidence: top.confidence };
  if (top.confidence < threshold) return { kind: "below-threshold", label, confidence: top.confidence };
  return { kind: "accepted", label, confidence: top.confidence };
}

export function describeVerdict(verdict: ClassifierVerdict): string {
  const pct = (c: number) => `${Math.round(c * 100)}%`;
  switch (verdict.kind) {
    case "accepted":
      return `${verdict.label} (${pct(verdict.confidence)})`;
    case "below-threshold":
      return `${verdict.label} at ${pct(verdict.confidence)} is below the ${pct(CLASSIFIER_THRESHOLD)} threshold`;
    case "not-a-wardrobe-label":
      return `no wardrobe label (the model said "${verdict.label}")`;
    case "no-result":
      return "no result";
  }
}
