import type { Example, Pattern } from "./patterns";
import type { Rule } from "./rules";

export type Action =
  | { type: "add-rule"; patternId: string; rule: Rule }
  | { type: "update-rule"; patternId: string; index: number; rule: Rule }
  | { type: "move-rule"; patternId: string; index: number; by: -1 | 1 }
  | { type: "remove-rule"; patternId: string; index: number }
  | { type: "add-example"; patternId: string; example: Example }
  | { type: "remove-example"; patternId: string; exampleId: string }
  | { type: "save-revision"; patternId: string; id: string; savedAt: string; note: string }
  | { type: "restore-revision"; patternId: string; revisionId: string }
  | { type: "replace-all"; patterns: Pattern[] }
  | { type: "apply-proposal"; patternId: string; rules: Rule[]; model: string; ids: [string, string]; savedAt: string };

function edit(patterns: Pattern[], id: string, change: (p: Pattern) => Pattern): Pattern[] {
  return patterns.map((p) => (p.id === id ? change(p) : p));
}

// Every change returns new objects. Saved revisions are never edited in place.
export function reduce(patterns: Pattern[], action: Action): Pattern[] {
  switch (action.type) {
    case "replace-all":
      return action.patterns;
    case "add-rule":
      return edit(patterns, action.patternId, (p) => ({ ...p, rules: [...p.rules, action.rule] }));
    case "update-rule":
      return edit(patterns, action.patternId, (p) => ({
        ...p,
        rules: p.rules.map((r, i) => (i === action.index ? action.rule : r)),
      }));
    case "move-rule":
      return edit(patterns, action.patternId, (p) => {
        const to = action.index + action.by;
        if (to < 0 || to >= p.rules.length) return p;
        const rules = [...p.rules];
        [rules[action.index], rules[to]] = [rules[to], rules[action.index]];
        return { ...p, rules };
      });
    case "remove-rule":
      return edit(patterns, action.patternId, (p) => ({
        ...p,
        rules: p.rules.filter((_, i) => i !== action.index),
      }));
    case "add-example":
      return edit(patterns, action.patternId, (p) => ({ ...p, examples: [...p.examples, action.example] }));
    case "remove-example":
      return edit(patterns, action.patternId, (p) => ({
        ...p,
        examples: p.examples.filter((e) => e.id !== action.exampleId),
      }));
    case "save-revision":
      return edit(patterns, action.patternId, (p) => ({
        ...p,
        revisions: [
          ...p.revisions,
          { id: action.id, savedAt: action.savedAt, note: action.note, rules: structuredClone(p.rules) },
        ],
      }));
    case "apply-proposal":
      // A person confirmed it. Keep the old weave first, so the change can be undone.
      return edit(patterns, action.patternId, (p) => ({
        ...p,
        rules: structuredClone(action.rules),
        revisions: [
          ...p.revisions,
          { id: action.ids[0], savedAt: action.savedAt, note: "Before proposal", rules: structuredClone(p.rules) },
          { id: action.ids[1], savedAt: action.savedAt, note: `Applied proposal from ${action.model}`, rules: structuredClone(action.rules) },
        ],
      }));
    case "restore-revision":
      return edit(patterns, action.patternId, (p) => {
        const revision = p.revisions.find((r) => r.id === action.revisionId);
        return revision ? { ...p, rules: structuredClone(revision.rules) } : p;
      });
  }
}
