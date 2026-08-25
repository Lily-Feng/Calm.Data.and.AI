# Calm Data and AI

Calm Data and AI is a connected engineering knowledge atlas for:

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

## Taste of the Past

`timeline.html` hosts **Taste of the Past**, a series of illustrated,
weighted timelines. The page owns no
timeline markup — it loads authored JSON and calls the component:

```js
import { createTimeline } from "./js/timeline/index.js";

const spec = await (await fetch("data/timelines/cs-papers.json")).json();
const rail = createTimeline(document.querySelector("#rail"), spec, { onOpenGuide });
```

Timestamps carry their own precision, so `1936`, `1970-06`, `2026-08-24`,
`2026-08-24T06:30`, and the clock-only `06:40` all sit on the same axis
machinery — the same component serves eight decades of papers and a single
working day.
Three axis scales are available: `ordinal` (even spacing, real gaps named
between the markers), `linear` (distance is elapsed time), and `log`.

An entry's `weight` (0–1) sets its tier, which drives marker size, card width,
and how prominent the entry reads. An entry carrying a `children` block gets a
sub-timeline: the same function, called again inside a drawer under the parent
rail, with its own scale and style pack.

Three style packs ship — `polaroid`, `filmstrip`, and `sticker` — and resolve
per entry (`event.style` → `lane.style` → `timeline.style`), so one rail can mix
them. Add a pack in `js/timeline/styles/`, register it in that directory's
`index.js`, and reference its id from a JSON file.

### Add a timeline to the series

1. Write `data/timelines/<id>.json`. See `js/timeline/schema.js` for the full
   field reference — lanes, weights, media, key points, impact, and resources.
2. Mount it from `js/timeline-page.js` by adding a `{ mount, src }` entry.
3. Optionally give an entry a `bodyUrl` pointing at a long-form fragment in
   `timelines/<timeline>/<event>.html` — see `timelines/README.md`.

Cover art is generated, not scanned: `node scripts/make-covers.mjs` writes the
SVGs in `public/timeline/cs-papers/`. The papers themselves are copyrighted, so
each entry links out to the real thing rather than reproducing it.

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
├── timeline.html
├── css/styles.css
├── css/timeline.css
├── js/atlas.js
├── js/manifest.js
├── js/app.js
├── js/timeline-page.js
├── js/timeline/            # the timeline component
├── data/timelines/<id>.json
├── guides/<id>.html
├── guides/README.md
├── timelines/<timeline>/<event>.html
├── timelines/README.md
├── scripts/migrate-guides.mjs
├── scripts/make-covers.mjs
├── KNOWLEDGE_GRAPH_PLAN.md
├── public/og.png
└── .github/workflows/deploy-pages.yml
```
