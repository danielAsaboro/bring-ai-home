import type { CandidateSuggestion } from "../src/features/redact/analysis-contract";
import { validateCandidateForEvidence } from "./candidate-validation";

export type ReasoningBlock = {
  text: string;
  bbox: [number, number, number, number];
  confidence: number | null;
};

export type DocumentReasoner = {
  getState(): { id: string; state: "not_loaded" | "loading" | "ready" | "error" };
  classify(input: {
    documentId: string;
    level: "private" | "confidential";
    direction: string;
    blocks: ReasoningBlock[];
  }): Promise<{ candidates: CandidateSuggestion[]; reasoningMs: number }>;
  close(): Promise<void>;
};

type NoulQuestion = { type: "noul"; instructions: string };

export type DecisionRuntime = {
  loadModel(options: {
    modelSrc: unknown;
    modelType: "llamacpp-decision";
    modelConfig: { device: "gpu" | "cpu" };
  }): Promise<string>;
  decide(options: {
    modelId: string;
    states: string[];
    questions: Record<string, NoulQuestion>;
  }): Promise<Array<{ answers: Record<string, { noul?: number }> }>>;
  unloadModel(options: { modelId: string; clearStorage: boolean }): Promise<unknown>;
};

export const DECISION_THRESHOLD = 0.5;

const privateQuestions = {
  name: "This text contains a person's name.",
  email: "This text contains an email address.",
  phone: "This text contains a telephone number.",
  address: "This text contains a street address.",
  account: "This text contains a bank, card or account number.",
  identity: "This text contains a passport, national ID or employee ID number.",
} as const;

const confidentialQuestions = {
  ...privateQuestions,
  amount: "This text contains a specific amount of money.",
  date: "This text contains a sensitive date such as a birth date.",
  reference: "This text contains a tracking, case or project reference code.",
  business: "This text contains a private company detail.",
} as const;

type FieldLabel = keyof typeof confidentialQuestions;

export function decisionQuestions(level: "private" | "confidential", direction: string) {
  const fields = level === "confidential" ? confidentialQuestions : privateQuestions;
  const questions: Record<string, NoulQuestion> = Object.fromEntries(
    Object.entries(fields).map(([id, instructions]) => [id, { type: "noul", instructions }]),
  );
  if (direction.trim()) {
    questions.direction = {
      type: "noul",
      instructions: `This text is something the user asked to hide: ${direction.trim()}`,
    };
  }
  return questions;
}

export function createDecisionReasoner(options: {
  runtime: DecisionRuntime;
  modelSource: unknown;
  now?: () => number;
}): DocumentReasoner {
  let modelId: string | null = null;
  let loading: Promise<string> | null = null;
  let failed = false;
  const now = options.now ?? Date.now;

  async function ensureModel() {
    if (modelId) return modelId;
    loading ??= options.runtime.loadModel({
      modelSrc: options.modelSource,
      modelType: "llamacpp-decision",
      modelConfig: { device: "gpu" },
    });
    try {
      modelId = await loading;
      failed = false;
      return modelId;
    } catch (error) {
      loading = null;
      failed = true;
      throw error;
    }
  }

  return {
    getState: () => ({
      id: "laya-421m-q8",
      state: failed ? "error" : modelId ? "ready" : loading ? "loading" : "not_loaded",
    }),
    async classify(input) {
      const started = now();
      if (input.blocks.length === 0) return { candidates: [], reasoningMs: 0 };
      const loadedModelId = await ensureModel();
      const questions = decisionQuestions(input.level, input.direction);
      const results = await options.runtime.decide({
        modelId: loadedModelId,
        states: input.blocks.map((block) => block.text),
        questions,
      });
      if (results.length !== input.blocks.length) {
        throw new Error("Local decisions did not match the OCR blocks");
      }
      const candidates = results.flatMap((result, blockIndex) => {
        const [question, probability] = Object.keys(questions)
          .map((id) => [id, result.answers[id]?.noul ?? 0] as const)
          .reduce((best, entry) => (entry[1] > best[1] ? entry : best));
        if (probability < DECISION_THRESHOLD) return [];
        const proposed: CandidateSuggestion = {
          blockIndex,
          label: question === "direction" ? "other" : (question as FieldLabel),
          explanation: "Proposed by local decisions.",
          confidence: probability,
        };
        const validated = validateCandidateForEvidence(proposed, input.blocks[blockIndex].text);
        return validated ? [validated] : [];
      });
      return { candidates, reasoningMs: now() - started };
    },
    async close() {
      if (modelId) {
        await options.runtime.unloadModel({ modelId, clearStorage: false }).catch(() => undefined);
        modelId = null;
      }
    },
  };
}
