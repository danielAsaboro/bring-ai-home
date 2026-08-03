import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { z } from "zod";
import type { ProposedAction } from "./approval.js";

export const saveNoteArguments = z.object({
  title: z.string().min(1).max(80),
  body: z.string().min(1).max(4_000),
});

export function safeFilename(title: string): string {
  const value = title
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 64);
  if (!value) throw new Error("Title does not produce a safe filename");
  return `${value}.md`;
}

export async function executeAction(action: ProposedAction, baseDirectory = resolve("workspace", "notes")): Promise<string> {
  const args = saveNoteArguments.parse(action.arguments);
  const directory = resolve(baseDirectory);
  await mkdir(directory, { recursive: true });
  const path = resolve(directory, safeFilename(args.title));
  if (!path.startsWith(`${directory}/`)) throw new Error("Unsafe output path");
  await writeFile(path, `# ${args.title}\n\n${args.body.trim()}\n`, { flag: "wx" });
  return path;
}
