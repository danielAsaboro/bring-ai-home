import { runWeave, type Rule } from "./rules";

export type Example = { id: string; before: string; after: string };

export type Revision = { id: string; savedAt: string; note: string; rules: Rule[] };

export type Pattern = {
  id: string;
  name: string;
  description: string;
  examples: Example[];
  rules: Rule[];
  revisions: Revision[];
};

export type ExampleResult = { example: Example; actual: string; passed: boolean };

export function checkExamples(rules: readonly Rule[], examples: readonly Example[]): ExampleResult[] {
  return examples.map((example) => {
    const actual = runWeave(rules, example.before).output;
    return { example, actual, passed: actual === example.after };
  });
}

// Fictional sample patterns. Every vendor, person, and code is invented.
export const samplePatterns: Pattern[] = [
  {
    id: "p-contacts",
    name: "Contact names",
    description: "Turn 'family, given' export names into 'Given Family'.",
    examples: [
      { id: "e-c1", before: "hollis, maren", after: "Maren Hollis" },
      { id: "e-c2", before: "  OKAFOR,  tunde ", after: "Tunde Okafor" },
      { id: "e-c3", before: "van der berg, lise", after: "Lise Van Der Berg" },
    ],
    rules: [
      { kind: "trim", collapse: true },
      { kind: "split", separator: ",", order: [1, 0], join: " " },
      { kind: "case", to: "title" },
    ],
    revisions: [
      {
        id: "r-c1",
        savedAt: "2026-03-02T09:00:00.000Z",
        note: "First weave",
        rules: [
          { kind: "trim", collapse: true },
          { kind: "split", separator: ",", order: [1, 0], join: " " },
          { kind: "case", to: "title" },
        ],
      },
    ],
  },
  {
    id: "p-invoices",
    name: "Invoice codes",
    description: "Normalize hand-typed invoice references to INV-0000.",
    examples: [
      { id: "e-i1", before: " inv 0042 ", after: "INV-0042" },
      { id: "e-i2", before: "Inv 1187", after: "INV-1187" },
      { id: "e-i3", before: "INV  0310", after: "INV-0310" },
    ],
    rules: [
      { kind: "trim", collapse: true },
      { kind: "case", to: "upper" },
    ],
    revisions: [],
  },
  {
    id: "p-vendors",
    name: "Vendor names",
    description: "Clean shouting, padded vendor names from the purchasing export.",
    examples: [
      { id: "e-v1", before: "  BRIGHTWOOL   SUPPLY CO ", after: "Brightwool Supply Co" },
      { id: "e-v2", before: "harbor & finch", after: "Harbor & Finch" },
    ],
    rules: [],
    revisions: [],
  },
];
