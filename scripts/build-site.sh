#!/usr/bin/env bash
# Builds the deployable site: landing page at /, Mintlify docs at /docs.
# Usage: scripts/build-site.sh [out-dir]   (default: dist)
set -euo pipefail
root="$(cd "$(dirname "$0")/.." && pwd)"
out="${1:-$root/dist}"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

cd "$root"
# On Vercel, mint comes from the install step in vercel.json.
command -v mint >/dev/null || PATH="$root/node_modules/.bin:$PATH"
node scripts/format-prose.mjs --check docs || echo "Warning: run node scripts/format-prose.mjs to put one sentence per line."
node scripts/check-prose.mjs docs || echo "Warning: shorten the paragraphs above to four sentences or fewer."
mint export --output "$tmp/export.zip"
mkdir -p "$out"
if command -v unzip >/dev/null; then unzip -q -o "$tmp/export.zip" -d "$out"; else python3 -m zipfile -e "$tmp/export.zip" "$out"; fi
rm -rf "$out/Start Docs.bat" "$out/Start Docs.command" "$out/serve.js" "$out/.gitignore" "$out/landing" "$out/scripts"
cp landing/index.html landing/og.png "$out/"
# Routing lives in the root vercel.json; the CLI deploy from dist/ needs it without the build keys.
node -e 'const c = require("./vercel.json"); for (const k of ["installCommand", "buildCommand", "outputDirectory", "framework"]) delete c[k]; require("fs").writeFileSync(process.argv[1], JSON.stringify(c, null, 2) + "\n")' "$out/vercel.json"
# mint export leaves out .json downloads such as manifest.json.
if [ -d docs/downloads ]; then
  (cd docs/downloads && find . -name '*.json' | while read -r f; do mkdir -p "$out/docs/downloads/$(dirname "$f")"; cp "$f" "$out/docs/downloads/$f"; done)
fi
# Markdown copy of every page at <page>.md, which each page advertises to AI agents.
(cd docs && find . -name '*.mdx' | while read -r page; do
  mkdir -p "$out/docs/$(dirname "$page")"
  cp "$page" "$out/docs/${page%.mdx}.md"
done)
# Public brand kit (SVG, PNG, zip) at /brand.
mkdir -p "$out/brand" && cp -R brand/. "$out/brand/"
echo "Built $out"
