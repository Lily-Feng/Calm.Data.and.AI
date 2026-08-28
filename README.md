# Calm Data and AI

Calm Data and AI is a connected engineering knowledge atlas for:

- Cloud systems — vendor-neutral architecture with AWS, Azure, and GCP translations
- Data platforms — workload-based reasoning across Databricks, Snowflake, and Fabric
- Python — recurring algorithm and problem-solving patterns
- SQL — relational reasoning and analytical query patterns
- Go — safe, bounded concurrency

It is a detailed layer beneath [Lily Feng's high-level knowledge garden](https://lily-feng.github.io/knowledge). The site is deliberately static: no framework, package install, build step, database, account, or progress tracking.

The homepage is a broad seven-layer Data & AI Field Atlas. The previous domain-map and guide experience remains available at `field-notes.html`.

## Run locally

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Publish with GitHub Pages

Push to `main`. `.github/workflows/deploy-pages.yml` publishes the static site automatically.

## Knowledge architecture

- `data-ai-knowledge-graph.yaml` defines the broad homepage taxonomy. `js/data-ai-knowledge-graph.js` is its browser-ready export, loaded without a runtime dependency so the atlas also works when opened directly.
- `js/knowledge-atlas.js` renders homepage layers, role trails, the cross-cutting compass, filters, search, and topic dialogs.
- `js/atlas.js` defines the graph taxonomy: domains, clusters, concepts, and guide connections.
- `js/manifest.js` defines `TRACKS` and guide metadata (title, summary, tags, difficulty, and a `bodyUrl` pointing at the guide's fragment).
- `js/components/` contains the shared light-DOM Web Components for the site header, side navigation, homepage search, and timeline page view.
- `guides/<id>.html` holds each guide's actual body — freeform HTML, authored directly rather than as JS object fields. See `guides/README.md` for the fragment contract.
- `js/app.js` renders the header (title/summary/tags/graph location) from the manifest, then fetches and injects the matching fragment. It also preloads every fragment once at startup to build a full-text search index.
- `KNOWLEDGE_GRAPH_PLAN.md` documents the proposed integration with the main knowledge garden and the expansion plan for each domain.

The graph structure, guide metadata, and guide content are intentionally separate. A concept can have a useful place and summary before a long guide is written, and a guide's body can be rewritten without touching its graph location or metadata.

## Taste of the Past

`timeline.html` hosts **Taste of the Past**, a series of illustrated,
weighted timelines. The unqualified page is the series landing page. Each
timeline has a direct, shareable URL such as
`timeline.html?series=cs-papers`, and that page renders only the selected rail.
The page owns no timeline markup — it loads authored JSON and calls the component:

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
2. Add one entry to `timelines` in `data/timelines/series.json`. The page builds
   its sidebar link and direct one-rail view from it; no HTML or JS changes are
   needed.
3. Optionally give an entry a `bodyUrl` pointing at a long-form fragment in
   `timelines/<timeline>/<event>.html` — see `timelines/README.md`.

Cover art is generated, not scanned: `node scripts/make-covers.mjs` writes the
SVGs under `public/timeline/<timeline-id>/`. Published papers are copyrighted,
so each entry links out to the real thing rather than reproducing it. A motif
may not repeat within one timeline; the generator enforces that.

Run `node scripts/check-timelines.mjs` before shipping a change to the data. It
checks the things a JSON parse will not — entry ids must be unique across the
*whole series*, because the page deep-links them all at once — plus missing
cover art, missing body fragments, undeclared lanes, and a sub-timeline that
starts before its parent.

### The series so far

| Timeline | Covers |
| --- | --- |
| Ten papers that built computing | Turing to the Transformer, with sub-timelines on Codd, Berners-Lee, and Vaswani |
| Tongues of the machine | Programming languages, Fortran to Rust |
| Where the data sleeps | Storage and databases, RAMAC to open table formats |
| Teaching machines to guess | Machine learning, McCulloch–Pitts to AlphaFold |
| The machine room | Systems and infrastructure, System/360 to Lambda |

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
├── index.html                 # broad field-atlas homepage
├── field-notes.html           # detailed domain maps and guides
├── knowledge-atlas.html       # direct atlas preview alias
├── timeline.html
├── css/styles.css
├── css/timeline.css
├── js/atlas.js
├── js/manifest.js
├── js/app.js
├── js/timeline-page.js
├── js/components/          # shared page Web Components
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
