#!/usr/bin/env node
// Puts each sentence of a prose paragraph or list item on its own line in docs/**/*.mdx.
// Markdown joins consecutive lines, so the rendered page doesn't change.
// Usage: node scripts/format-prose.mjs [--check] [path ...]   (default: docs)
import { readdir, readFile, stat, writeFile } from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const check = args.includes("--check");
const targets = args.filter((arg) => arg !== "--check");

async function* mdxFiles(target) {
  if ((await stat(target)).isFile()) {
    if (target.endsWith(".mdx")) yield target;
    return;
  }
  for (const entry of await readdir(target, { withFileTypes: true })) {
    yield* mdxFiles(path.join(target, entry.name));
  }
}

// Spans that must never be split: inline code, whole links, bare URLs (without trailing punctuation).
const PROTECTED = /`[^`]*`|!?\[[^\]]*\]\([^)]*\)|https?:\/\/[^\s)]*[^\s).,;:!?]/g;
const ABBREVIATION = /(?:\b(?:e\.g|i\.e|vs|etc|Mr|Ms|Dr|No|Fig)\.)$/;
// A line starting like this would turn into block syntax, so it stays on the previous line.
const BLOCK_START = /^(?:[-*+]\s|\d+[.)]\s|#|>|\||<|\{|```|~~~)/;

export function splitSentences(text) {
  const shielded = [];
  const masked = text.replace(PROTECTED, (match) => {
    shielded.push(match);
    return `\u0000${shielded.length - 1}\u0000`;
  });
  const parts = [];
  let start = 0;
  const boundary = /([.!?](?:\*\*|\*|_)?["'”’)]*)\s+(?=[A-Z0-9"“'‘(\[`*_\u0000])/g;
  for (const match of masked.matchAll(boundary)) {
    const end = match.index + match[1].length;
    if (ABBREVIATION.test(masked.slice(start, end))) continue;
    if ((masked.slice(0, end).match(/\*\*/g) ?? []).length % 2 === 1) continue;
    parts.push(masked.slice(start, end));
    start = match.index + match[0].length;
  }
  parts.push(masked.slice(start));
  const restore = (part) => part.replace(/\u0000(\d+)\u0000/g, (_, index) => shielded[Number(index)]);
  const sentences = [];
  for (const part of parts.map(restore)) {
    if (sentences.length && BLOCK_START.test(part)) sentences[sentences.length - 1] += ` ${part}`;
    else sentences.push(part);
  }
  return sentences;
}

export function formatProse(source) {
  const lines = source.split("\n");
  const out = [];
  let inFence = false;
  let inFrontmatter = lines[0] === "---";
  let block = null; // { marker, indent, text }

  const flush = () => {
    if (!block) return;
    const sentences = splitSentences(block.text);
    sentences.forEach((sentence, index) => {
      out.push(index === 0 ? `${block.indent}${block.marker}${sentence}` : `${block.indent}${" ".repeat(block.marker.length)}${sentence}`);
    });
    block = null;
  };

  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    if (inFrontmatter) {
      out.push(line);
      if (i > 0 && line === "---") inFrontmatter = false;
      continue;
    }
    if (/^\s*(```|~~~)/.test(line)) {
      flush();
      inFence = !inFence;
      out.push(line);
      continue;
    }
    const trimmed = line.trim();
    if (inFence || !trimmed || /^(#|\||<|\{|import |export |!\[|>)/.test(trimmed)) {
      flush();
      out.push(line);
      continue;
    }
    const item = line.match(/^(\s*)([-*+]\s+|\d+[.)]\s+)(.*)$/);
    if (item) {
      flush();
      block = { indent: item[1], marker: item[2], text: item[3].trim() };
      continue;
    }
    const indent = line.match(/^\s*/)[0];
    if (block) {
      block.text += ` ${trimmed}`;
    } else {
      block = { indent, marker: "", text: trimmed };
    }
  }
  flush();
  return out.join("\n");
}

if (import.meta.url === `file://${process.argv[1]}`) {
  let changed = 0;
  for (const target of targets.length ? targets : ["docs"]) {
    for await (const file of mdxFiles(path.resolve(target))) {
      const source = await readFile(file, "utf8");
      const formatted = formatProse(source);
      if (formatted === source) continue;
      if (source.replace(/\s+/g, " ") !== formatted.replace(/\s+/g, " ")) {
        throw new Error(`Formatting would change the text of ${file}`);
      }
      changed += 1;
      if (check) console.log(path.relative(process.cwd(), file));
      else await writeFile(file, formatted);
    }
  }
  if (check && changed) {
    console.log(`\n${changed} file(s) need one sentence per line: node scripts/format-prose.mjs`);
    process.exitCode = 1;
  } else if (!check) {
    console.log(`Formatted ${changed} file(s).`);
  }
}
