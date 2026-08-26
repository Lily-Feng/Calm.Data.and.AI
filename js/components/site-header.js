const LOGO_URL = "public/calm.png";

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
    icon.href = LOGO_URL;
}

class SiteHeader extends HTMLElement {
    connectedCallback() {
        if (this.dataset.ready === "true") return;
        this.dataset.ready = "true";
        ensureFavicon();
        this.render();
    }

    render() {
        if (this.getAttribute("variant") === "topbar") {
            this.renderTopbar();
            return;
        }
        this.renderBrand();
    }

    renderBrand() {
        const useButton = this.getAttribute("home-mode") === "button";
        const homeHref = escapeHtml(this.getAttribute("home-href") || "index.html");
        const brandContent = `
            <img class="brand-mark" src="${LOGO_URL}" alt="" width="43" height="43">
            <span>
                <strong>Calm Data and AI</strong>
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
        const homeHref = this.getAttribute("home-href") || "";
        const homeLabel = this.getAttribute("home-label") || "";
        this.innerHTML = `
            <header class="topbar">
                <button class="icon-button menu-button" id="menu-button" type="button" aria-label="Open navigation">☰</button>
                ${heading ? `<p class="topbar-title" data-site-header-title>${escapeHtml(heading)}</p>` : ""}
                ${homeHref && homeLabel ? `<a class="topbar-link" href="${escapeHtml(homeHref)}">${escapeHtml(homeLabel)} <span>→</span></a>` : ""}
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
