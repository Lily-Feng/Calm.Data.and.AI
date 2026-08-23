# Guide fragment contract

Each file in this directory is the body of one guide, referenced by a
`bodyUrl` entry in `js/manifest.js`. `openGuide()` in `js/app.js` fetches the
file and injects it with `innerHTML` into the topic dialog, alongside a
header (title, summary, tags, graph location) rendered from the manifest.

A guide fragment must be:

- Wrapped in one `<article class="guide-content">…</article>`.
- A fragment, not a document: no `<script>`, inline event handlers (`onclick`
  etc.), `<html>`, `<head>`, or `<body>`.
- Free of duplicate heading or element `id`s across guides, if you add any —
  the fragment is injected into a live page that may hold other ids.
- Careful with relative paths: an image or link inside `guides/foo.html`
  resolves against `index.html`'s location (and GitHub Pages' path prefix),
  not against `guides/`. Reference other assets as `guides/images/x.png`,
  never as `images/x.png` or a root-absolute `/images/x.png`.
- Repository-owned content only. `innerHTML` injection is not safe for
  untrusted HTML — don't wire this up to accept guide bodies from anyone but
  yourself.

A code sample that should offer a "Copy code" button follows this shape —
the button locates its own code block via `.closest(".code-panel")`, so no
JS-side wiring is needed per guide:

```html
<div class="code-panel">
    <div class="code-panel__header">
        <span>python reference</span>
        <button class="copy-button" type="button" data-copy-code>Copy code</button>
    </div>
    <pre><code>def example():
    return True</code></pre>
</div>
```

Beyond that, a fragment can use whatever markup fits the guide — headings,
lists, tables, blockquotes. `css/styles.css` gives two typographic tiers:

- Wrap a section in the existing `.prompt-box` / `.content-block` /
  `.answer-block` classes to match the original guides' dense scale (used by
  the 15 migrated fragments).
- Write plain top-level `<p>`, `<h2>`/`<h3>`, `<ul>`/`<ol>`, or `<blockquote>`
  directly inside `.guide-content` for a slightly larger, more open reading
  size — better suited to longer freeform prose. Tables, images, and inline
  `<code>` get baseline styling either way.

## Adding a new guide

1. Add its metadata to the `GUIDES` array in `js/manifest.js`, including
   `bodyUrl: "guides/<id>.html"`.
2. Write `guides/<id>.html` following the contract above.
3. Link it from its concept node in `js/atlas.js` via `guide: "<id>"`, same as
   before.

Full-text search covers guide bodies automatically — `js/app.js` fetches
every `bodyUrl` once at page load and indexes the stripped text.
