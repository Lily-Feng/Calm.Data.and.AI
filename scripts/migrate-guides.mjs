/**
 * One-time migration: split js/knowledge.js (TRACKS + TOPICS, each guide body
 * as JS fields) into js/manifest.js (TRACKS + trimmed guide metadata) plus one
 * guides/<id>.html fragment per topic holding the freeform guide body.
 *
 * Run once with: node scripts/migrate-guides.mjs
 * Not part of the deployed site and not invoked by CI.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { createContext, runInContext } from "node:vm";
import { fileURLToPath } from "node:url";
import path from "node:path";

const rootDir = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const knowledgeSource = readFileSync(path.join(rootDir, "js/knowledge.js"), "utf8")
    .replace(/window\.PATTERNBOOK[\s\S]*$/, "");

const sandbox = {};
createContext(sandbox);
runInContext(`${knowledgeSource}\nthis.TRACKS = TRACKS; this.TOPICS = TOPICS;`, sandbox);
const { TRACKS, TOPICS } = sandbox;

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderList(items, tag) {
    return `<${tag}>${items.map((item) => `<li>${escapeHtml(item)}</li>`).join("\n            ")}</${tag}>`;
}

function renderGuideBody(topic) {
    const platformBlock = topic.platformMap ? `
    <div class="content-block answer-block">
        <span>Platform translation</span>
        <h2>Same pattern, different names</h2>
        ${renderList(topic.platformMap, "ul")}
    </div>` : "";

    const codeBlock = topic.code ? `
    <div class="code-panel">
        <div class="code-panel__header">
            <span>${escapeHtml(topic.code.language)} reference</span>
            <button class="copy-button" type="button" data-copy-code>Copy code</button>
        </div>
        <pre><code>${escapeHtml(topic.code.value)}</code></pre>
    </div>` : "";

    return `<article class="guide-content">
    <div class="prompt-box">
        <span>Representative problem</span>
        <p>${escapeHtml(topic.prompt)}</p>
    </div>
    <div class="dialog-grid">
        <div class="content-block">
            <span>Reasoning model</span>
            <h2>How to approach it</h2>
            ${renderList(topic.approach, "ol")}
        </div>
        <div class="content-block">
            <span>Failure modes</span>
            <h2>What breaks the model</h2>
            ${renderList(topic.pitfalls, "ul")}
        </div>
    </div>
    <div class="content-block answer-block">
        <span>Core synthesis</span>
        <h2>What to remember</h2>
        <p>${escapeHtml(topic.answer)}</p>
    </div>${platformBlock}${codeBlock}
</article>
`;
}

const guidesDir = path.join(rootDir, "guides");
mkdirSync(guidesDir, { recursive: true });

const manifestTopics = TOPICS.map((topic) => {
    writeFileSync(path.join(guidesDir, `${topic.id}.html`), renderGuideBody(topic));
    return {
        id: topic.id,
        track: topic.track,
        type: topic.type,
        title: topic.title,
        difficulty: topic.difficulty,
        minutes: topic.minutes,
        summary: topic.summary,
        tags: topic.tags || [],
        bodyUrl: `guides/${topic.id}.html`
    };
});

function formatValue(value, indent) {
    if (Array.isArray(value)) {
        if (value.length === 0) return "[]";
        return `[${value.map((item) => JSON.stringify(item)).join(", ")}]`;
    }
    return JSON.stringify(value);
}

function formatTopic(topic) {
    const fields = ["id", "track", "type", "title", "difficulty", "minutes", "summary", "tags", "bodyUrl"];
    const lines = fields.map((field) => `        ${field}: ${formatValue(topic[field])}`);
    return `    {\n${lines.join(",\n")}\n    }`;
}

const manifestSource = `/**
 * Patternbook manifest.
 *
 * TRACKS and guide metadata only. Each guide's body lives in its own
 * fragment at guides/<id>.html (see guides/README.md for the authoring
 * contract) and is fetched at runtime by js/app.js.
 */

const TRACKS = ${JSON.stringify(TRACKS, null, 4)};

const GUIDES = [
${manifestTopics.map(formatTopic).join(",\n")}
];

window.PATTERNBOOK = { tracks: TRACKS, topics: GUIDES };
`;

writeFileSync(path.join(rootDir, "js/manifest.js"), manifestSource);

console.log(`Wrote ${manifestTopics.length} guide fragments to guides/ and js/manifest.js`);
