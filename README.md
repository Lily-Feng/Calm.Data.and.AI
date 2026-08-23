# Patternbook

Patternbook is a connected engineering knowledge atlas for:

- Cloud systems — vendor-neutral architecture with AWS, Azure, and GCP translations
- Data platforms — workload-based reasoning across Databricks, Snowflake, and Fabric
- Python — recurring algorithm and problem-solving patterns
- SQL — relational reasoning and analytical query patterns
- Go — safe, bounded concurrency

It is a detailed layer beneath [Lily Feng's high-level knowledge garden](https://lily-feng.github.io/knowledge). The site is deliberately static: no framework, package install, build step, database, account, or progress tracking.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Publish with GitHub Pages

Push to `main`. `.github/workflows/deploy-pages.yml` publishes the static site automatically.

## Knowledge architecture

- `js/atlas.js` defines the graph taxonomy: domains, clusters, concepts, and guide connections.
- `js/manifest.js` defines `TRACKS` and guide metadata (title, summary, tags, difficulty, and a `bodyUrl` pointing at the guide's fragment).
- `guides/<id>.html` holds each guide's actual body — freeform HTML, authored directly rather than as JS object fields. See `guides/README.md` for the fragment contract.
- `js/app.js` renders the header (title/summary/tags/graph location) from the manifest, then fetches and injects the matching fragment. It also preloads every fragment once at startup to build a full-text search index.
- `KNOWLEDGE_GRAPH_PLAN.md` documents the proposed integration with the main knowledge garden and the expansion plan for each domain.

The graph structure, guide metadata, and guide content are intentionally separate. A concept can have a useful place and summary before a long guide is written, and a guide's body can be rewritten without touching its graph location or metadata.

## Add a graph concept

Add the concept to the appropriate cluster in `js/atlas.js`:

```js
{
    id: "stable-concept-id",
    label: "Readable concept name",
    summary: "The mental model or decision this concept explains.",
    guide: "optional-guide-id"
}
```

Use `guide` only when a corresponding entry exists in `js/manifest.js`.

## Add a detailed guide

1. Add metadata to the `GUIDES` array in `js/manifest.js`, including `bodyUrl: "guides/<id>.html"`.
2. Write `guides/<id>.html` — see `guides/README.md` for the fragment contract (one wrapping `<article class="guide-content">`, no `<script>`, asset paths relative to `index.html`).
3. Link it from its concept node in `js/atlas.js` via `guide: "<id>"`.

A guide typically covers a representative problem, a reusable reasoning sequence, common failure modes, a concise synthesis, and optionally product translations or code — but the fragment format doesn't enforce that shape.

## Project structure

```text
.
├── index.html
├── css/styles.css
├── js/atlas.js
├── js/manifest.js
├── js/app.js
├── guides/<id>.html
├── guides/README.md
├── scripts/migrate-guides.mjs
├── KNOWLEDGE_GRAPH_PLAN.md
├── public/og.png
└── .github/workflows/deploy-pages.yml
```
