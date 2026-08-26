class SearchView extends HTMLElement {
    connectedCallback() {
        if (this.dataset.ready === "true") return;
        this.dataset.ready = "true";
        this.innerHTML = `
            <section class="view home-view" id="overview-view" aria-labelledby="overview-title">
                <h1 class="sr-only" id="overview-title">Calm Data and AI</h1>

                <div class="home-search">
                    <span aria-hidden="true">⌕</span>
                    <label class="sr-only" for="home-search">Search Calm Data and AI</label>
                    <input id="home-search" type="search" placeholder="Search anything…" autocomplete="off">
                    <kbd>/</kbd>
                </div>

                <div class="home-content">
                    <figure class="timeline-feature" id="home-feature">
                        <img src="public/calm-data-and-ai.webp" alt="A paper collage connecting cloud systems, data platforms, programming, and practical AI">
                        <figcaption><strong>Calm Data and AI</strong></figcaption>
                    </figure>

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

        this.input.addEventListener("input", () => {
            this.dispatchEvent(new CustomEvent("search-change", { bubbles: true, detail: { query: this.value } }));
        });
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
