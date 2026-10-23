# Bring AI Home

Ten small apps that move everyday AI work onto your own machine with [QVAC](https://docs.qvac.tether.io). The lessons live at [bringaihome.xyz](https://bringaihome.xyz).

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

Check out the branch instead of a hash to get the finished app. Redact's lessons use the starter zip and patches in `downloads/redact/`.

## Run the site

```bash
npm install -g mint
mint dev
```

Mintlify connects to this repository at its root; `docs.json` is the config.
