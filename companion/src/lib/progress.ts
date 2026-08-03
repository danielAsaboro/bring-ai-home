import type { ModelProgressUpdate } from "@qvac/sdk";

export function printProgress(progress: ModelProgressUpdate): void {
  const wholePercent = Math.floor(progress.percentage);
  if (wholePercent !== 100 && wholePercent % 5 !== 0) return;
  const state = globalThis as typeof globalThis & { __courseProgress?: number };
  if (state.__courseProgress === wholePercent) return;
  state.__courseProgress = wholePercent;
  const downloaded = (progress.downloaded / 1_000_000).toFixed(1);
  const total = (progress.total / 1_000_000).toFixed(1);
  const line = `Downloading ${progress.percentage.toFixed(0)}% (${downloaded}/${total} MB)`;
  process.stderr.write(process.stderr.isTTY ? `\r${line}` : `${line}\n`);
  if (process.stderr.isTTY && progress.percentage >= 100) process.stderr.write("\n");
}
