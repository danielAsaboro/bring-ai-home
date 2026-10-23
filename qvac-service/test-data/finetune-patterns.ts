import type { Pattern } from "../../src/features/pattern/patterns.ts";

// FIXTURE: tiny fictional training set of human-approved weaves. Invented data only.
export const approvedFixturePatterns: Pattern[] = [
  {
    id: "f-sku", name: "SKU codes", description: "Upper-case padded SKU codes.",
    examples: [{ id: "f1", before: " sku-12 ", after: "SKU-12" }, { id: "f2", before: "sku-0907", after: "SKU-0907" }],
    rules: [{ kind: "trim", collapse: true }, { kind: "case", to: "upper" }], revisions: [],
  },
  {
    id: "f-email", name: "Email addresses", description: "Lower-case and trim email addresses.",
    examples: [{ id: "f3", before: "  Maren.Hollis@Example.TEST ", after: "maren.hollis@example.test" }],
    rules: [{ kind: "trim", collapse: true }, { kind: "case", to: "lower" }], revisions: [],
  },
  {
    id: "f-phone", name: "Phone numbers", description: "Turn (555) 010-2231 into 555-010-2231.",
    examples: [{ id: "f4", before: "(555) 010-2231", after: "555-010-2231" }, { id: "f5", before: "(555) 019-0004", after: "555-019-0004" }],
    rules: [{ kind: "replace", find: "(", with: "" }, { kind: "replace", find: ") ", with: "-" }], revisions: [],
  },
  {
    id: "f-city", name: "City and country", description: "Title-case 'city,country' pairs.",
    examples: [{ id: "f6", before: "lisbon,portugal", after: "Lisbon / Portugal" }, { id: "f7", before: "OSLO, norway", after: "Oslo / Norway" }],
    rules: [{ kind: "split", separator: ",", order: [0, 1], join: " / " }, { kind: "case", to: "title" }], revisions: [],
  },
];
