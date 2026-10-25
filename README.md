# Bring AI Home

Ten small apps that move everyday AI work onto your own machine with [QVAC](https://docs.qvac.tether.io). The lessons live at [bringaihome.xyz/docs](https://bringaihome.xyz/docs).

`main` is the site. Each app lives on its own branch, one commit per lesson.

| App | Branch |
|---|---|
| Chronicle | `course/chronicle-qvac` |
| Circle | `course/circle-qvac` |
| Closet | `course/closet-qvac` |
| Deck | `course/deck-qvac` |
| Homebook | `course/homebook-qvac` |
| Ledger | `course/ledger-qvac` |
| Lookout | `course/lookout-qvac` |
| Pattern | `course/pattern-qvac` |
| Redact | `course/redact-qvac` |
| Replay | `course/replay-qvac` |

## Follow along

```bash
git clone https://github.com/danielAsaboro/bring-ai-home
cd bring-ai-home
git checkout <hash from the lesson>
npm ci
npm run dev
```

Check out the branch instead of a hash to get the finished app.
Redact's lessons are tags on `course/redact-qvac`, from `redact-01-starter` to `redact-11-copy-check`: start a branch at the starter with `git switch -c my-redact redact-01-starter`, then bring in each lesson with `git cherry-pick <tag>`.

## Run the site

Lessons are Mintlify pages under `docs/`; `docs.json` is the config. The landing page is `landing/index.html`.

```bash
npm install -g mint
mint dev
```

## Working locally

Everything for this project lives in this one folder:

| Path | What it is | In Git |
|---|---|---|
| `docs/`, `docs.json`, `landing/`, `scripts/` | The site | Yes, on `main` |
| `apps/<app>/` | A worktree of `course/<app>-qvac` for running an app: `git worktree add apps/redact course/redact-qvac` | Ignored |
| `dist/` | Output of `scripts/build-site.sh`, linked to the Vercel project | Ignored |
| `plans/`, `internal/`, `private/` | Notes and working files | Ignored |

Writing rules for every page:

- One sentence per line in the `.mdx` source, and one empty line between paragraphs. `node scripts/format-prose.mjs docs` does this without changing the rendered page.
- No paragraph or list item longer than four sentences. `node scripts/check-prose.mjs docs` lists offenders.

`scripts/build-site.sh` runs both checks and warns.

Run Redact from its worktree:

```bash
cd apps/redact/redact
npm ci
npm run qvac:service
npm run dev -- --port 3101
```

## Deploy

`scripts/build-site.sh` exports the docs to `dist/`, puts the landing page at `/` and the docs at `/docs`. Deploy `dist/` to the Vercel project `bring-ai-home`:

```bash
scripts/build-site.sh
cd dist && vercel deploy --prod --scope harmonia-b4a76411
```
