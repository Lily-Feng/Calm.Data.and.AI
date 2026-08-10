# Patternbook

Patternbook is a practical interview-learning system for five focused areas:

- Cloud systems — architecture topics compared across AWS, Azure, and GCP
- Data platforms — practical decisions across Databricks, Snowflake, and Fabric
- Python — recurring LeetCode patterns
- SQL — reusable analytical query patterns
- Go — safe, high-concurrency patterns

The site is deliberately static. It has no framework, package install, build step, database, or account system. Topic status and weekly review activity are stored in the browser.

## Run locally

From the repository root:

```bash
python3 -m http.server 8080
```

Open `http://localhost:8080`.

## Publish with GitHub Pages

Push to `main`. The workflow in `.github/workflows/deploy-pages.yml` publishes the repository as a GitHub Pages site.

The first time, open the repository on GitHub and select **Settings → Pages → Source → GitHub Actions**. After that, every push to `main` deploys automatically.

## Add or edit knowledge

All active learning content lives in `js/knowledge.js`:

- `TRACKS` defines the five navigation areas.
- `TOPICS` holds every practical learning note.
- Each topic contains one interview prompt, a reasoning sequence, pitfalls, a concise answer, and optional platform translations or code.

Use this shape:

```js
{
    id: "unique-topic-id",
    track: "python",
    type: "LeetCode pattern",
    title: "Readable topic title",
    difficulty: "Intermediate",
    minutes: 15,
    summary: "One-sentence practical value.",
    prompt: "A representative interview question.",
    approach: ["Step one", "Step two", "Step three"],
    pitfalls: ["Common mistake", "Important edge case"],
    answer: "A concise answer you could say aloud.",
    tags: ["searchable", "keywords"],
    code: {
        language: "python",
        value: "optional runnable pattern"
    }
}
```

Good notes teach a transferable pattern, begin with a realistic problem, make trade-offs explicit, and stay short enough to review in 10–20 minutes.

## Project structure

```text
.
├── index.html                  # Accessible application shell
├── css/styles.css              # Responsive visual system
├── js/knowledge.js             # Tracks and learning notes
├── js/app.js                   # Search, review state, and interactions
├── public/og.png               # Social sharing preview
└── .github/workflows/
    └── deploy-pages.yml        # GitHub Pages deployment
```
