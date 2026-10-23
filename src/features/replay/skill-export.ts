// Export a tape as an agent skill (SKILL.md). Deterministic code only: no model, no clock.
// The same tape revision always produces the same bytes.
import type { Tape } from "./tape.ts";

export function skillName(title: string) {
  const slug = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 64)
    .replace(/-+$/g, "");
  return slug || "replay-tape";
}

function oneLine(text: string) {
  return text.replace(/\s+/g, " ").trim();
}

function yamlString(text: string) {
  return JSON.stringify(oneLine(text)); // JSON strings are valid YAML double-quoted scalars
}

function bullets(items: string[], empty: string) {
  return items.length ? items.map((i) => `- ${oneLine(i)}`).join("\n") : `- ${empty}`;
}

export function tapeToSkill(tape: Tape): { fileName: string; content: string } {
  if (tape.steps.length === 0) throw new Error("Add a step before exporting this tape");
  const name = skillName(tape.title);
  const description = oneLine(tape.summary) || `Follow the "${oneLine(tape.title)}" procedure step by step.`;
  const inputs = tape.parameters.length
    ? ["| Name | Example |", "| --- | --- |", ...tape.parameters.map((p) => `| \`${p.name}\` | ${oneLine(p.example).replace(/\|/g, "\\|")} |`)].join("\n")
    : "This procedure has no inputs.";
  const steps = tape.steps
    .map((s, i) => `${i + 1}. **${oneLine(s.title)}**${s.detail.trim() ? `\n   ${oneLine(s.detail)}` : ""}`)
    .join("\n");

  const content = `---
name: ${name}
description: ${yamlString(description.slice(0, 1024))}
---

# ${oneLine(tape.title)}

${description}

## Inputs

Ask the person for each value before starting. Do not guess.

${inputs}

## Before you start

${bullets(tape.preconditions, "No preconditions recorded.")}

## Steps

${steps}

## Stop and ask a person if

${bullets(tape.stopConditions, "Anything looks different from these steps.")}

## Rules

- Follow the steps in order. Report each step's outcome before moving on.
- Confirm with the person before any step that sends, publishes, deletes, or pays.
- If a stop condition is met, stop and explain what you saw. Do not work around it.

<!-- Exported from Replay tape ${tape.id}, revision ${tape.revision}. -->
`;
  return { fileName: `${name}/SKILL.md`, content };
}
