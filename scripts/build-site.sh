#!/usr/bin/env bash
# Builds the deployable site: landing page at /, Mintlify docs at /docs.
# Usage: scripts/build-site.sh [out-dir]   (default: dist)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$root/dist}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$root"
node scripts/format-prose.mjs --check docs || echo "Warning: run node scripts/format-prose.mjs to put one sentence per line."
node scripts/check-prose.mjs docs || echo "Warning: shorten the paragraphs above to four sentences or fewer."
mint export --output "$tmp/export.zip"
mkdir -p "$out"
unzip -q -o "$tmp/export.zip" -d "$out"
rm -rf "$out/Start Docs.bat" "$out/Start Docs.command" "$out/serve.js" "$out/.gitignore" "$out/landing" "$out/scripts"
cp landing/index.html landing/vercel.json landing/og.png "$out/"
# mint export leaves out .json downloads such as manifest.json.
if [ -d docs/downloads ]; then
  rsync -a --include='*/' --include='*.json' --exclude='*' docs/downloads/ "$out/docs/downloads/"
fi
# Markdown copy of every page at <page>.md, which each page advertises to AI agents.
(cd docs && find . -name '*.mdx' | while read -r page; do
  mkdir -p "$out/docs/$(dirname "$page")"
  cp "$page" "$out/docs/${page%.mdx}.md"
done)
# Public brand kit (SVG, PNG, zip) at /brand.
rsync -a brand/ "$out/brand/"
echo "Built $out"
