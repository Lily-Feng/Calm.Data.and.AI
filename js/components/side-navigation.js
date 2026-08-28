const PROGRAMMING_IDS = new Set(["python", "sql", "go", "rust"]);

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

class SideNavigation extends HTMLElement {
    constructor() {
        super();
        this.tracks = [];
        this.series = [];
        this.activeDomain = "";
        this.selectedSeries = "";
        this.handleClick = this.handleClick.bind(this);
    }

    connectedCallback() {
        this.removeEventListener("click", this.handleClick);
        this.addEventListener("click", this.handleClick);
        if (this.dataset.ready !== "true") {
            this.dataset.ready = "true";
            this.render();
        }
    }

    disconnectedCallback() {
        this.removeEventListener("click", this.handleClick);
    }

    handleClick(event) {
        const toggle = event.target.closest("[data-nav-toggle]");
        if (toggle) {
            const menu = this.querySelector(`#${toggle.dataset.navToggle}-navigation`);
            const opening = toggle.getAttribute("aria-expanded") !== "true";
            toggle.setAttribute("aria-expanded", String(opening));
            if (menu) menu.hidden = !opening;
            return;
        }
        if (event.target.closest("a, [data-domain]")) document.body.classList.remove("sidebar-open");
    }

    setTracks(tracks) {
        this.tracks = Array.isArray(tracks) ? tracks : [];
        if (this.getAttribute("variant") !== "timeline") this.renderAtlas();
    }

    setActiveDomain(domainId = "") {
        this.activeDomain = domainId;
        this.querySelectorAll("[data-domain]").forEach((item) => {
            const active = item.dataset.domain === domainId;
            item.classList.toggle("active", active);
            if (active) item.setAttribute("aria-current", "page");
            else item.removeAttribute("aria-current");
        });
        if (PROGRAMMING_IDS.has(domainId)) this.setProgrammingExpanded(true);
    }

    setTimelineSeries(series, selectedId = "") {
        this.series = Array.isArray(series) ? series : [];
        this.selectedSeries = selectedId || "";
        if (this.getAttribute("variant") === "timeline") this.renderTimeline();
    }

    setProgrammingExpanded(expanded) {
        const toggle = this.querySelector('[data-nav-toggle="programming"]');
        const menu = this.querySelector("#programming-navigation");
        toggle?.setAttribute("aria-expanded", String(expanded));
        if (menu) menu.hidden = !expanded;
    }

    trackLink(track, isChild = false) {
        const active = track.id === this.activeDomain;
        return `
            <a class="nav-item${isChild ? " nav-subitem" : ""}${active ? " active" : ""}"
               href="#domain=${encodeURIComponent(track.id)}&concept=root" data-domain="${escapeHtml(track.id)}"
               ${active ? 'aria-current="page"' : ""}>
                <span class="nav-symbol">${escapeHtml(track.mark)}</span>
                <span>${escapeHtml(track.shortName)}</span>
            </a>`;
    }

    render() {
        if (this.getAttribute("variant") === "timeline") this.renderTimeline();
        else this.renderAtlas();
    }

    renderAtlas() {
        const primaryTracks = this.tracks.filter((track) => !PROGRAMMING_IDS.has(track.id));
        const programmingTracks = this.tracks.filter((track) => PROGRAMMING_IDS.has(track.id));
        const programmingOpen = PROGRAMMING_IDS.has(this.activeDomain);
        this.innerHTML = `
            <nav class="primary-nav" aria-label="Knowledge domains">
                <a class="nav-item nav-feature-link" href="index.html">
                    <span class="nav-symbol">✣</span>
                    <span>Data &amp; AI Field Atlas</span>
                </a>
                <p class="nav-label">Domain maps</p>
                ${primaryTracks.map((track) => this.trackLink(track)).join("")}
                <div class="nav-group">
                    <button class="nav-item nav-group-toggle" type="button" data-nav-toggle="programming"
                            aria-expanded="${programmingOpen}" aria-controls="programming-navigation">
                        <span class="nav-symbol">PL</span>
                        <span>Programming Languages</span>
                        <i aria-hidden="true">⌄</i>
                    </button>
                    <div class="nav-submenu" id="programming-navigation" ${programmingOpen ? "" : "hidden"}>
                        ${programmingTracks.map((track) => this.trackLink(track, true)).join("")}
                    </div>
                </div>
                <a class="nav-item nav-feature-link" href="timeline.html">
                    <span class="nav-symbol">⟜</span>
                    <span>Taste of the Past</span>
                </a>
            </nav>`;
    }

    renderTimeline() {
        const homeActive = !this.selectedSeries;
        const seriesLinks = this.series.map((entry) => {
            const active = entry.id === this.selectedSeries;
            return `
                <a class="nav-item${active ? " active" : ""}" href="timeline.html?series=${encodeURIComponent(entry.id)}"
                   ${active ? 'aria-current="page"' : ""}>
                    <span class="nav-symbol">${escapeHtml(entry.symbol || "◷")}</span>
                    <span>${escapeHtml(entry.label || entry.heading)}</span>
                </a>`;
        }).join("");
        this.innerHTML = `
            <nav class="primary-nav" aria-label="Sections">
                <a class="nav-item" href="index.html">
                    <span class="nav-symbol">◎</span>
                    <span>Calm Data and AI</span>
                </a>
                <a class="nav-item${homeActive ? " active" : ""}" href="timeline.html" ${homeActive ? 'aria-current="page"' : ""}>
                    <span class="nav-symbol">⟜</span>
                    <span>Taste of the Past</span>
                </a>
                <p class="nav-label">Timelines</p>
                <div data-series-navigation>${seriesLinks}</div>
            </nav>`;
    }
}

if (!customElements.get("side-navigation")) customElements.define("side-navigation", SideNavigation);

export { SideNavigation };
