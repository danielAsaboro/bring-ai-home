#!/usr/bin/env node
// Flags prose paragraphs and list items longer than four sentences in docs/**/*.mdx.
// Pages keep one sentence per line (scripts/format-prose.mjs), so a block's sentences are its lines;
// a line that is only a bold lead-in, like "**Use local AI.**", doesn't count.
// Usage: node scripts/check-prose.mjs [dir]   (default: docs). Exits 1 when anything is flagged.
import { readdir, readFile } from "node:fs/promises";
import path from "node:path";

const MAX_SENTENCES = 4;
const root = path.resolve(process.argv[2] ?? "docs");

async function* mdxFiles(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) yield* mdxFiles(full);
    else if (entry.name.endsWith(".mdx")) yield full;
  }
}

function countSentences(text) {
  const plain = text
    .replace(/`[^`]*`/g, "code")
    .replace(/\[([^\]]*)\]\([^)]*\)/g, "$1")
    .replace(/\b(e\.g|i\.e|vs|etc|Mr|Ms|Dr|No)\./g, "$1")
    .replace(/(\d)\.(\d)/g, "$1$2")
    .replace(/\.\.\.|…/g, "")
    .replace(/"[^"]{0,60}"/g, "quote");
  return (plain.match(/[.!?](?=["'”’)]*(\s|$))/g) ?? []).length;
}

function* blocks(source) {
  const lines = source.split("\n");
  let inFence = false;
  let inFrontmatter = lines[0] === "---";
  let block = [];
  let start = 0;
  const flush = function* () {
    if (block.length) yield { lines: [...block], text: block.join(" "), line: start + 1 };
    block = [];
  };
  for (let i = inFrontmatter ? 1 : 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (inFrontmatter) {
      if (line === "---") inFrontmatter = false;
      continue;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      yield* flush();
      inFence = !inFence;
      continue;
    }
    const trimmed = line.trim();
    const skip = inFence || !trimmed || /^(#|\||<|import |export |!\[)/.test(trimmed);
    const newItem = /^([-*]|\d+\.)\s/.test(trimmed);
    if (skip || newItem) yield* flush();
    if (skip) continue;
    if (!block.length) start = i;
    block.push(trimmed.replace(/^([-*]|\d+\.)\s+/, ""));
  }
  yield* flush();
}

let flagged = 0;
for await (const file of mdxFiles(root)) {
  const source = await readFile(file, "utf8");
  for (const { lines, text, line } of blocks(source)) {
    const sentences = Math.max(
      lines.filter((entry) => !/^\*\*[^*]+\*\*$/.test(entry)).length,
      countSentences(text) - lines.filter((entry) => /^\*\*[^*]+\*\*$/.test(entry)).length,
    );
    if (sentences > MAX_SENTENCES) {
      flagged += 1;
      console.log(`${path.relative(process.cwd(), file)}:${line}  ${sentences} sentences`);
    }
  }
}
if (flagged) {
  console.log(`\n${flagged} paragraph(s) over ${MAX_SENTENCES} sentences.`);
  process.exitCode = 1;
}
