# Timeline body fragments

Each file here is the long-form body of one timeline entry, referenced by a
`bodyUrl` field in `data/timelines/<timeline>.json`. `js/timeline/popup.js`
fetches the file and injects it with `innerHTML` beneath the entry's summary,
key points, impact note, and links — all of which come from the JSON, not from
here.

The contract matches `guides/README.md`, because the same `.guide-content`
typography applies:

- Wrapped in one `<article class="guide-content">…</article>`.
- A fragment, not a document: no `<script>`, inline event handlers, `<html>`,
  `<head>`, or `<body>`.
- No element `id`s that could collide with the live page.
- Relative paths resolve against `timeline.html`, not against this directory —
  reference art as `public/timeline/<timeline>/x.svg`.
- Repository-owned content only. `innerHTML` injection is not safe for
  untrusted HTML.

A fragment is optional. An entry with no `bodyUrl` still gets a complete
dialog from its JSON fields; add a body only when an entry deserves more than
four key points and an impact paragraph.
