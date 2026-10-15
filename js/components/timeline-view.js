function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

class TimelineView extends HTMLElement {
    connectedCallback() {
        if (this.dataset.ready === "true") return;
        this.dataset.ready = "true";
        this.innerHTML = `
            <section class="view timeline-page-view">
                <section class="timeline-home" data-timeline-home aria-labelledby="timeline-home-title">
                    <h1 class="sr-only" id="timeline-home-title">Taste of the Past</h1>
                    <figure class="timeline-landing-image">
                        <img src="public/taste-of-the-past.webp?v=20261014" alt="A paper collage tracing computing from punch cards and mainframes to personal computers and connected systems">
                        <figcaption><strong>Taste of the Past</strong></figcaption>
                    </figure>
                </section>
                <section class="timeline-detail hidden" data-timeline-detail aria-live="polite">
                    <div data-timeline-sections></div>
                </section>
            </section>`;
    }

    showHome(entries = []) {
        this.querySelector("[data-timeline-home]")?.classList.remove("hidden");
        this.querySelector("[data-timeline-detail]")?.classList.add("hidden");
        const sections = this.querySelector("[data-timeline-sections]");
        if (sections) sections.innerHTML = "";
        const home = this.querySelector("[data-timeline-home]");
        if (!home) return;

        const cardsMarkup = (entries && entries.length ? entries : []).map((entry) => `
            <a class="timeline-hub-card" href="timeline.html?series=${encodeURIComponent(entry.id)}" style="--card-accent: var(--acid);">
                <div class="timeline-hub-card__top">
                    <span class="timeline-hub-card__symbol">${escapeHtml(entry.symbol || "◷")}</span>
                    <span class="timeline-hub-card__eyebrow">${escapeHtml(entry.eyebrow || "")}</span>
                </div>
                <h3>${escapeHtml(entry.heading)}</h3>
                <p>${escapeHtml(entry.note || "")}</p>
                <div class="timeline-hub-card__footer">
                    <span>${escapeHtml(entry.label)}</span>
                    <b>Explore timeline →</b>
                </div>
            </a>
        `).join("");

        home.innerHTML = `
            <div class="timeline-hub">
                <div class="timeline-hub-hero">
                    <figure class="timeline-landing-image">
                        <img src="public/taste-of-the-past.webp?v=20261014" alt="Taste of the Past">
                    </figure>
                    <div class="timeline-hub-copy">
                        <p class="eyebrow">Taste of the Past · 7 Computing Eras</p>
                        <h1 id="timeline-home-title">The Computing History Hub</h1>
                        <p>Illustrated, weighted timelines of the foundational ideas, papers, architectures, and breakthroughs computing and modern data systems were built on. Select any timeline below to follow its chronological arc.</p>
                    </div>
                </div>

                <div class="timeline-hub-head">
                    <div>
                        <p class="eyebrow">Chronological Series</p>
                        <h2>7 Historic Rails</h2>
                    </div>
                    <p>Each rail features chronological event markers, key milestones, and deep-dive technical notes.</p>
                </div>

                <div class="timeline-cards-grid">
                    ${cardsMarkup}
                </div>
            </div>`;
    }

    showTimeline(entry) {
        this.querySelector("[data-timeline-home]")?.classList.add("hidden");
        this.querySelector("[data-timeline-detail]")?.classList.remove("hidden");
        const sections = this.querySelector("[data-timeline-sections]");
        if (!sections) return;
        sections.innerHTML = `
            <section class="timeline-series" aria-labelledby="heading-${escapeHtml(entry.id)}">
                <header class="timeline-series__heading">
                    ${entry.eyebrow ? `<p class="eyebrow">${escapeHtml(entry.eyebrow)}</p>` : ""}
                    <h1 id="heading-${escapeHtml(entry.id)}">${escapeHtml(entry.heading)}</h1>
                    ${entry.note ? `<p class="timeline-series__note">${escapeHtml(entry.note)}</p>` : ""}
                </header>
                <div id="rail-${escapeHtml(entry.id)}" class="tl-mount" data-state="loading">
                    <p class="tl-fallback">Loading the rail…</p>
                </div>
            </section>`;
    }

    showError(message, source = "") {
        this.querySelector("[data-timeline-home]")?.classList.add("hidden");
        this.querySelector("[data-timeline-detail]")?.classList.remove("hidden");
        const sections = this.querySelector("[data-timeline-sections]");
        if (sections) {
            sections.innerHTML = `<p class="tl-fallback">${escapeHtml(message)}${source ? ` Check that <code>${escapeHtml(source)}</code> is reachable.` : ""}</p>`;
        }
    }

    showNotFound() {
        this.querySelector("[data-timeline-home]")?.classList.add("hidden");
        this.querySelector("[data-timeline-detail]")?.classList.remove("hidden");
        const sections = this.querySelector("[data-timeline-sections]");
        if (sections) sections.innerHTML = `<div class="tl-fallback"><strong>Timeline not found.</strong><br><a href="timeline.html">Return to Taste of the Past</a></div>`;
    }
}

if (!customElements.get("timeline-view")) customElements.define("timeline-view", TimelineView);

export { TimelineView };
