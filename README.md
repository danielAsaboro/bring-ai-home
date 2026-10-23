# Bring AI Home

Ten small apps that move everyday AI work onto your own machine with [QVAC](https://docs.qvac.tether.io), and the lessons that build them one commit at a time.

## Layout

| Path | What it holds |
|---|---|
| `docs/` | The Mintlify site: every lesson, with `docs/docs.json` as its config |
| `apps/` | The ten finished apps: chronicle, circle, closet, deck, homebook, ledger, lookout, pattern, redact, replay |
| `course/<app>-qvac` branches | One commit per lesson. Each lesson's `git checkout <hash>` points at a commit on these branches |
| `companion/`, `ep00`–`ep10` tags | The original companion course and its episode checkpoints |

Lesson checkpoints for nine of the apps hold the app at the repository root, so run them from the clone root:

```bash
git clone https://github.com/danielAsaboro/bring-ai-home
cd bring-ai-home
git checkout <hash from the lesson>
npm ci
npm run dev
```

Redact's checkpoints keep the `apps/` layout; its lessons use the starter zip and patches in `docs/downloads/redact/`.

## Run the docs locally

```bash
cd docs
npx mint dev
```

## Connect Mintlify

In the Mintlify dashboard, connect this repository, turn on the monorepo setting, and set the docs path to `/docs`. Mintlify reads `docs/docs.json` from there.
