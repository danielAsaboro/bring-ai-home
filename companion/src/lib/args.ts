export function hasFlag(flag: string): boolean {
  return process.argv.slice(2).includes(flag);
}

export function option(name: string): string | undefined {
  const args = process.argv.slice(2);
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : undefined;
}
