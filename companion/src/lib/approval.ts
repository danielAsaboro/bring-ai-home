import { createInterface } from "node:readline/promises";
import { stdin, stdout } from "node:process";

export type Risk = "read" | "write" | "external";

export type ProposedAction = {
  tool: "save_note";
  risk: Risk;
  arguments: { title: string; body: string };
};

export function requiresApproval(action: ProposedAction): boolean {
  return action.risk !== "read";
}

export async function requestApproval(action: ProposedAction): Promise<boolean> {
  if (!requiresApproval(action)) return true;
  if (!stdin.isTTY || !stdout.isTTY) return false;
  const terminal = createInterface({ input: stdin, output: stdout });
  try {
    const answer = await terminal.question(
      `Approve ${action.tool} with ${JSON.stringify(action.arguments)}? [y/N] `,
    );
    return /^y(es)?$/i.test(answer.trim());
  } finally {
    terminal.close();
  }
}
