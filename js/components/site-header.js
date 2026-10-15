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
        if (this.getAttribute("variant") === "sidebar") this.renderBrand();
        else this.renderTopbar();
    }

    // Sidebar drawer chrome only: the brand lives in the top bar, not here.
    renderBrand() {
        this.innerHTML = `
            <div class="brand-row">
                <button class="icon-button sidebar-close" id="sidebar-close" type="button" aria-label="Close navigation">×</button>
            </div>`;
    }

    // The single top bar. Identical on every page: no per-page heading, no
    // per-page links. Only the active link and the menu button (needed when the
    // page has a sidebar drawer) vary.
    renderTopbar() {
        const currentPage = this.getAttribute("current-page") || "";
        const link = (id, href, label) =>
            `<a href="${href}"${currentPage === id ? ' class="active" aria-current="page"' : ""}>${label}</a>`;
        const menu = document.getElementById("sidebar")
            ? '<button class="site-menu-button" id="menu-button" type="button" aria-label="Open navigation">☰</button>'
            : "";
        this.innerHTML = `
            <header class="site-topbar">
                ${menu}
                <a class="site-brand" href="index.html" aria-label="Calm Data and AI home">
                    <img class="brand-mark" src="${LOGO_URL}" alt="" width="36" height="36">
                    <span class="brand-copy">
                        <b>Calm Data and AI</b>
                        <small>Learning made easy with notes and AI</small>
                    </span>
                </a>
                <nav class="site-links" aria-label="Primary navigation">
                    ${link("atlas", "index.html", "Field Atlas")}
                    ${link("field-notes", "field-notes.html", "Field notes")}
                    ${link("timeline", "timeline.html", "Timelines")}
                    <button type="button" id="open-about" data-open-about>About</button>
                </nav>
            </header>`;
    }
}

if (!customElements.get("site-header")) customElements.define("site-header", SiteHeader);

export { SiteHeader };
