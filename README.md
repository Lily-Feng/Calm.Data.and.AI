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
- `js/knowledge.js` contains the detailed applied guides.
- `KNOWLEDGE_GRAPH_PLAN.md` documents the proposed integration with the main knowledge garden and the expansion plan for each domain.

The graph structure and guide content are intentionally separate. A concept can have a useful place and summary before a long guide is written, and a guide can deepen without changing its graph location.

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

Use `guide` only when a corresponding detailed entry exists in `js/knowledge.js`.

## Add a detailed guide

A guide should contain:

- a representative problem
- a reusable reasoning sequence
- common failure modes
- a concise synthesis
- optional product translations or code

After adding the guide, link it from its concept node in `js/atlas.js`.

## Project structure

```text
.
├── index.html
├── css/styles.css
├── js/atlas.js
├── js/knowledge.js
├── js/app.js
├── KNOWLEDGE_GRAPH_PLAN.md
├── public/og.png
└── .github/workflows/deploy-pages.yml
```
