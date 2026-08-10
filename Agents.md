# Patternbook — Agent Guide

Patternbook is a released static learning site. Keep it simple enough to run from any static file server and deploy directly to GitHub Pages.

## Product boundaries

The active focus areas are:

1. Cloud systems, organized by topic with AWS/Azure/GCP translations
2. Data platforms: Databricks, Snowflake, and Fabric
3. Python interview patterns
4. SQL reasoning patterns
5. Go concurrency

Do not add frameworks, package managers, build systems, servers, authentication, or remote persistence unless the user explicitly asks. Progress is intentionally device-local.

## Knowledge architecture

All active content is in `js/knowledge.js`.

- `TRACKS` controls navigation and visual grouping.
- `TOPICS` is the single learning-note collection.
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
- `js/app.js` renders topics and stores review status in `localStorage`.
- There are no runtime dependencies or external assets.

When changing the application, preserve keyboard access, mobile navigation, dialog close behavior, empty states, and the ability to open a topic from a `#topic=<id>` URL.

## Validation

Before finishing:

```bash
node --check js/knowledge.js
node --check js/app.js
python3 -m http.server 8080
```

Confirm that the page and local assets return HTTP 200. If behavior changed, exercise search, track filters, status changes, topic links, and mobile navigation.
