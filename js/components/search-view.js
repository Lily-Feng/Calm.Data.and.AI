function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function renderHubMarkup() {
    const { tracks = [], topics = [] } = window.PATTERNBOOK || {};
    const relevantTracks = tracks.filter((t) => ["cloud", "data-platform", "python", "sql", "go"].includes(t.id));

    const domainCards = relevantTracks.map((track) => {
        const trackGuides = topics.filter((topic) => topic.track === track.id);
        const guideItems = trackGuides.map((guide) => `
            <li>
                <button type="button" class="hub-guide-pill" data-guide="${escapeHtml(guide.id)}">
                    <span>${escapeHtml(guide.title)}</span>
                    <i>→</i>
                </button>
            </li>
        `).join("");

        return `
            <article class="hub-domain-card" style="--domain-accent: ${track.color};">
                <div class="hub-domain-card__top">
                    <span class="hub-domain-badge">${escapeHtml(track.mark)}</span>
                    <div class="hub-domain-title-group">
                        <h3>${escapeHtml(track.name)}</h3>
                        <span class="hub-domain-topics">${escapeHtml(track.topics || "")}</span>
                    </div>
                </div>
                <p class="hub-domain-desc">${escapeHtml(track.description)}</p>
                <div class="hub-domain-guides">
                    <span class="hub-guides-label">Key Reference Notes</span>
                    <ul class="hub-guides-list">
                        ${guideItems}
                    </ul>
                </div>
                <div class="hub-domain-card__footer">
                    <button type="button" class="hub-domain-action" data-domain="${escapeHtml(track.id)}">
                        Explore ${escapeHtml(track.shortName)} Map <span>→</span>
                    </button>
                </div>
            </article>
        `;
    }).join("");

    return `
        <div class="notes-hub" id="home-feature">
            <div class="hub-hero">
                <figure class="hub-hero-media">
                    <img src="public/calm-data-and-ai.webp?v=20261014" alt="Calm Data and AI Notes Hub">
                </figure>
                <div class="hub-hero-copy">
                    <p class="eyebrow">Applied Reference · 5 Domains · 15 Deep Guides</p>
                    <h1>The Field Notes Hub</h1>
                    <p>Applied engineering notes, decision frameworks, and reasoning patterns across cloud systems, modern data platforms, and systems programming. Select a domain below to explore its interactive concept map, or click directly into any note.</p>
                </div>
            </div>

            <div class="hub-section-head">
                <div>
                    <p class="eyebrow">Structured Reference</p>
                    <h2>Explore Knowledge Domains</h2>
                </div>
                <p>Each domain links concepts to practical trade-offs, failure modes, and code patterns.</p>
            </div>

            <div class="hub-domains-grid">
                ${domainCards}
            </div>
        </div>
    `;
}

class SearchView extends HTMLElement {
    connectedCallback() {
        if (this.dataset.ready === "true") return;
        this.dataset.ready = "true";
        this.render();

        this.input.addEventListener("input", () => {
            this.dispatchEvent(new CustomEvent("search-change", { bubbles: true, detail: { query: this.value } }));
        });
    }

    render() {
        this.innerHTML = `
            <section class="view home-view" id="overview-view" aria-labelledby="overview-title">
                <h1 class="sr-only" id="overview-title">Calm Data and AI</h1>

                <div class="home-search">
                    <span aria-hidden="true">⌕</span>
                    <label class="sr-only" for="home-search">Search Calm Data and AI</label>
                    <input id="home-search" type="search" placeholder="Search anything… (press / to focus)" autocomplete="off">
                    <kbd>/</kbd>
                </div>

                <div class="home-content">
                    ${renderHubMarkup()}

                    <section class="home-results hidden" id="home-results" aria-live="polite">
                        <p id="home-results-count"></p>
                        <div class="guide-grid" id="home-results-grid"></div>
                        <div class="empty-state hidden" id="home-empty-state">
                            <span>⌕</span>
                            <h2>No matching knowledge</h2>
                            <p>Try a broader concept, product, or problem.</p>
                        </div>
                    </section>
                </div>
            </section>`;
    }

    get input() {
        return this.querySelector("#home-search");
    }

    get value() {
        return this.input?.value || "";
    }

    clear() {
        if (this.input) this.input.value = "";
        this.showFeature();
    }

    focusSearch() {
        this.input?.focus();
    }

    renderHub() {
        const feature = this.querySelector("#home-feature");
        if (feature) {
            feature.outerHTML = renderHubMarkup();
        }
    }

    showFeature() {
        this.querySelector("#home-feature")?.classList.remove("hidden");
        this.querySelector("#home-results")?.classList.add("hidden");
        const grid = this.querySelector("#home-results-grid");
        if (grid) grid.innerHTML = "";
    }

    showResults(total, markup) {
        this.querySelector("#home-feature")?.classList.add("hidden");
        this.querySelector("#home-results")?.classList.remove("hidden");
        const count = this.querySelector("#home-results-count");
        const grid = this.querySelector("#home-results-grid");
        const empty = this.querySelector("#home-empty-state");
        if (count) count.textContent = `${total} result${total === 1 ? "" : "s"}`;
        if (grid) {
            grid.innerHTML = markup;
            grid.classList.toggle("hidden", total === 0);
        }
        empty?.classList.toggle("hidden", total !== 0);
    }
}

if (!customElements.get("search-view")) customElements.define("search-view", SearchView);

export { SearchView };
