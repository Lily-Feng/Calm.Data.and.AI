const LOGO_URL = "public/apple-touch-icon.png";
const FAVICON_URL = "public/favicon-32.png";

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function ensureFavicon() {
    let icon = document.querySelector('link[rel="icon"][data-site-favicon]');
    if (!icon) {
        icon = document.createElement("link");
        icon.rel = "icon";
        icon.type = "image/png";
        icon.dataset.siteFavicon = "";
        document.head.append(icon);
    }
    icon.href = FAVICON_URL;
}

class SiteHeader extends HTMLElement {
    connectedCallback() {
        if (this.dataset.ready === "true") return;
        this.dataset.ready = "true";
        ensureFavicon();
        this.render();
        this.setupAbout();
    }

    setupAbout() {
        this.addEventListener("click", (event) => {
            const aboutBtn = event.target.closest("[data-open-about], #open-about");
            if (aboutBtn) {
                event.preventDefault();
                const dialog = document.getElementById("about-dialog");
                if (dialog && typeof dialog.showModal === "function") {
                    dialog.showModal();
                } else {
                    window.location.href = "index.html#open-about";
                }
            }
        });
    }

    render() {
        const variant = this.getAttribute("variant");
        if (variant === "topbar") {
            this.renderTopbar();
            return;
        }
        if (variant === "atlas") {
            this.renderAtlas();
            return;
        }
        this.renderBrand();
    }

    renderAtlas() {
        const currentPage = this.getAttribute("current-page") || "atlas";
        this.innerHTML = `
            <header id="brand" class="brand-block">
                <a class="brand" href="index.html" aria-label="Calm Data and AI home">
                    <img class="brand-mark" src="${LOGO_URL}" alt="" width="38" height="38">
                    <span class="brand-copy">
                        <b>Calm Data and AI</b>
                        <small>Learning made easy with notes and AI</small>
                    </span>
                </a>
                <nav class="site-links" aria-label="Primary navigation">
                    <a href="index.html"${currentPage === "atlas" ? ' class="active" aria-current="page"' : ""}>Field Atlas</a>
                    <a href="field-notes.html"${currentPage === "field-notes" ? ' class="active" aria-current="page"' : ""}>Field notes</a>
                    <a href="timeline.html"${currentPage === "timeline" ? ' class="active" aria-current="page"' : ""}>Timelines</a>
                    <button id="open-about" type="button" data-open-about>About</button>
                </nav>
            </header>`;
    }

    renderBrand() {
        const useButton = this.getAttribute("home-mode") === "button";
        const homeHref = escapeHtml(this.getAttribute("home-href") || "index.html");
        const brandContent = `
            <img class="brand-mark" src="${LOGO_URL}" alt="" width="38" height="38">
            <span class="brand-copy">
                <b>Calm Data and AI</b>
                <small>Learning made easy with notes and AI</small>
            </span>`;
        const homeControl = useButton
            ? `<button class="brand" type="button" data-view="overview" aria-label="Go to the homepage">${brandContent}</button>`
            : `<a class="brand" href="${homeHref}" aria-label="Calm Data and AI home">${brandContent}</a>`;

        this.innerHTML = `
            <div class="brand-row">
                ${homeControl}
                <button class="icon-button sidebar-close" id="sidebar-close" type="button" aria-label="Close navigation">×</button>
            </div>`;
    }

    renderTopbar() {
        const heading = this.getAttribute("heading") || "";
        const currentPage = this.getAttribute("current-page") || "";
        this.innerHTML = `
            <header class="topbar">
                <button class="icon-button menu-button" id="menu-button" type="button" aria-label="Open navigation">☰</button>
                <div class="topbar-heading-group">
                    <a class="topbar-brand" href="index.html" aria-label="Calm Data and AI home">
                        <img class="brand-mark" src="${LOGO_URL}" alt="" width="36" height="36">
                        <span class="brand-copy">
                            <b>Calm Data and AI</b>
                            <small>Learning made easy with notes and AI</small>
                        </span>
                    </a>
                    ${heading ? `<span class="topbar-divider" aria-hidden="true">/</span><p class="topbar-title" data-site-header-title>${escapeHtml(heading)}</p>` : ""}
                </div>
                <nav class="site-links" aria-label="Primary navigation">
                    <a href="index.html"${currentPage === "atlas" ? ' class="active" aria-current="page"' : ""}>Field Atlas</a>
                    <a href="field-notes.html"${currentPage === "field-notes" ? ' class="active" aria-current="page"' : ""}>Field notes</a>
                    <a href="timeline.html"${currentPage === "timeline" ? ' class="active" aria-current="page"' : ""}>Timelines</a>
                    <button type="button" id="open-about" data-open-about>About</button>
                </nav>
            </header>`;
    }

    setHeading(value) {
        this.setAttribute("heading", value || "");
        const title = this.querySelector("[data-site-header-title]");
        if (title) title.textContent = value || "";
        else if (this.getAttribute("variant") === "topbar") this.renderTopbar();
    }
}

if (!customElements.get("site-header")) customElements.define("site-header", SiteHeader);

export { SiteHeader };
