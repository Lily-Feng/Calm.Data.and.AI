# Patternbook — Agent Guide

Patternbook is a released static engineering knowledge atlas. Keep it simple enough to run from any static file server and deploy directly to GitHub Pages.

## Product boundaries

The active focus areas are:

1. Cloud systems, organized by topic with AWS/Azure/GCP translations
2. Data platforms: Databricks, Snowflake, and Fabric
3. Python interview patterns
4. SQL reasoning patterns
5. Go concurrency

Do not add frameworks, package managers, build systems, servers, authentication, remote persistence, or browser storage unless the user explicitly asks.

Do not add completion states, streaks, review queues, mastery scores, or other learning-progress mechanics. The product is a reference and concept map, not a tracker.

## Knowledge architecture

The taxonomy and the detailed content are separate:

- `js/atlas.js` defines domains, clusters, concepts, and graph-to-guide connections.
- `js/knowledge.js` holds the detailed applied guides.
- `KNOWLEDGE_GRAPH_PLAN.md` records the proposed high-level integration and expansion plan.
- A topic belongs to exactly one track.
- Cloud notes should teach a vendor-neutral concept first and use `platformMap` to translate it to AWS, Azure, and GCP.
- Data-platform notes should compare products by workload and trade-off, not repeat marketing feature lists.
- Python, SQL, and Go notes should include a representative problem and a reusable reasoning pattern. Add a compact `code` block when code materially helps.

Every topic must include:

- a stable, unique `id`
- `track`, `type`, `title`, `difficulty`, and estimated `minutes`
- a one-sentence `summary`
- a realistic `prompt`
- three to five ordered `approach` steps
- two or more `pitfalls`
- a concise, speakable `answer`
- useful search `tags`

Prefer one deep, reusable note over several product-specific fragments.

## UI architecture

- `index.html` contains the semantic page shell.
- `css/styles.css` owns the responsive visual system.
- `js/app.js` renders the overview graph, domain graphs, concept inspector, search, and guides.
- There are no runtime dependencies or external assets.

When changing the application, preserve keyboard access, mobile navigation, dialog close behavior, empty states, and deep links for guides and graph concepts.

## Validation

Before finishing:

```bash
node --check js/knowledge.js
node --check js/atlas.js
node --check js/app.js
python3 -m http.server 8080
```

Confirm that the page and local assets return HTTP 200. If behavior changed, exercise search, domain filters, concept selection, guide links, and mobile navigation.
