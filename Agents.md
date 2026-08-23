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

The taxonomy, guide metadata, and guide content are three separate layers:

- `js/atlas.js` defines domains, clusters, concepts, and graph-to-guide connections.
- `js/manifest.js` holds `TRACKS` and guide metadata only (`id`, `track`, `type`, `title`, `difficulty`, `minutes`, `summary`, `tags`, `bodyUrl`) — no guide body content.
- `guides/<id>.html` holds each guide's actual body as a freeform HTML fragment, authored directly rather than as JS object fields. `guides/README.md` is the authoring contract (one `<article class="guide-content">` wrapper, no `<script>`/inline handlers/full document, asset paths relative to `index.html`, repo-owned content only).
- `KNOWLEDGE_GRAPH_PLAN.md` records the proposed high-level integration and expansion plan.
- `scripts/migrate-guides.mjs` was the one-time script that split the old `js/knowledge.js` (TOPICS-as-JS-objects) into the current manifest + fragment layout. It's a reference, not part of the deploy path.
- A topic belongs to exactly one track.
- Cloud notes should teach a vendor-neutral concept first and translate it to AWS, Azure, and GCP within the fragment.
- Data-platform notes should compare products by workload and trade-off, not repeat marketing feature lists.
- Python, SQL, and Go notes should include a representative problem and a reusable reasoning pattern. Add a compact code panel (see `guides/README.md`) when code materially helps.

Every entry in `js/manifest.js` must include:

- a stable, unique `id`
- `track`, `type`, `title`, `difficulty`, and estimated `minutes`
- a one-sentence `summary`
- useful search `tags`
- `bodyUrl` pointing at its `guides/<id>.html` fragment

Every guide fragment should read as one deep, reusable note — a representative problem, an ordered reasoning sequence, failure modes, and a concise synthesis — rather than several product-specific fragments, but the HTML format doesn't enforce a fixed shape.

## UI architecture

- `index.html` contains the semantic page shell.
- `css/styles.css` owns the responsive visual system, including baseline typography for `.guide-content` fragments.
- `js/app.js` renders the overview graph, domain graphs, concept inspector, and search from `js/manifest.js` + `js/atlas.js`, and fetches/injects the matching `guides/<id>.html` fragment when a guide opens. It also preloads every fragment once at startup (`Promise.allSettled`, cached) to build the full-text search index — a fragment that fails to load degrades to metadata-only search for that guide rather than breaking the page.
- There are no runtime dependencies or external assets, and no build step — fetch-based fragment loading works directly against the static file server / GitHub Pages.

When changing the application, preserve keyboard access, mobile navigation, dialog close behavior, empty states, and deep links for guides and graph concepts. `openGuide()` guards against stale fetches with a monotonic token — if you touch it, keep that guard so rapidly opening guide A then B can't let A's late response overwrite B's content.

## Validation

Before finishing:

```bash
node --check js/manifest.js
node --check js/atlas.js
node --check js/app.js
python3 -m http.server 8080
```

Confirm that the page and local assets return HTTP 200, and that a guide's fragment (e.g. `http://localhost:8080/guides/<id>.html`) returns 200 too. If behavior changed, exercise search (including a term that only appears inside a guide body, to confirm full-text search), domain filters, concept selection, guide links, and mobile navigation.
