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
                        <img src="public/taste-of-the-past.webp" alt="A paper collage tracing computing from punch cards and mainframes to personal computers and connected systems">
                        <figcaption><strong>Taste of the Past</strong></figcaption>
                    </figure>
                </section>
                <section class="timeline-detail hidden" data-timeline-detail aria-live="polite">
                    <div data-timeline-sections></div>
                </section>
            </section>`;
    }

    showHome() {
        this.querySelector("[data-timeline-home]")?.classList.remove("hidden");
        this.querySelector("[data-timeline-detail]")?.classList.add("hidden");
        const sections = this.querySelector("[data-timeline-sections]");
        if (sections) sections.innerHTML = "";
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
                    ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
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
