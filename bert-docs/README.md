# BERT Docs (Standalone)

This directory is a standalone docs site for BERT protocol.
It is intentionally isolated so you can move it into a separate repository later (`bert-docs`).

## Run locally

```bash
cd bert-docs
python3 -m http.server 4040
```

Open: `http://localhost:4040`

## Structure

- `index.html` - docs app shell
- `assets/styles.css` - minimal docs styling
- `assets/docs-data.js` - documentation pages and content
- `assets/app.js` - sidebar routing + full-text search

## How search works

Search checks:
- page title
- page summary
- full page text content

It supports topic search (e.g. `subgraph`, `voting`) and plain text search (e.g. `setVotingDuration`, `sepolia eth`).

## Move to separate repo later

```bash
cd ..
cp -R bert-docs /path/to/new/location/bert-docs
cd /path/to/new/location/bert-docs
git init
git add .
git commit -m "init bert docs"
```

## Planned next improvements

- Split `docs-data.js` into per-page markdown files and add build step.
- Add version switcher (`v1`, `v2`).
- Add command-copy buttons for code blocks.
- Add print-friendly mode for audits and compliance reviews.
