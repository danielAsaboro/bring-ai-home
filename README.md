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

Check out the branch instead of a hash to get the finished app. Redact's lessons use the starter zip and patches in `docs/downloads/redact/`.

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
