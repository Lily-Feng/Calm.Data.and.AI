/**
 * Taste of the Past — landing page and direct-linked timeline pages.
 *
 * `timeline.html` is the quiet series home. A `?series=<id>` query selects one
 * authored timeline, so every rail has a stable, shareable URL and the page
 * never renders unrelated rails below it.
 */
import { escapeHtml } from "./timeline/dom.js";
import { createTimeline } from "./timeline/index.js";
import "./components/site-header.js";
import "./components/side-navigation.js";
import "./components/timeline-view.js?v=20260829-1";

const SERIES_URL = "data/timelines/series.json";
const PUBLIC_URL = "https://lily-feng.github.io/Calm.Data.and.AI/timeline.html";
const rails = new Map();

/** A cited guide lives in the atlas, so leave the page and deep-link into it. */
function openGuide(guideId) {
    window.location.href = `index.html#guide=${encodeURIComponent(guideId)}`;
}

function writeHash(params) {
    const query = new URLSearchParams(params).toString();
    history.replaceState(null, "", query ? `#${query}` : `${location.pathname}${location.search}`);
}

/** `#event=<id>` opens an entry; `#branch=<id>` opens its sub-timeline. */
function applyHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const branchId = params.get("branch");
    const eventId = params.get("event");
    for (const rail of rails.values()) {
        if (branchId && rail.events.some((event) => event.id === branchId)) rail.expand(branchId);
        if (eventId && rail.events.some((event) => event.id === eventId)) rail.select(eventId);
    }
}

async function mount(entry) {
    const container = document.getElementById(`rail-${entry.id}`);
    if (!container) return;
    try {
        const response = await fetch(entry.src);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const spec = await response.json();
        container.innerHTML = "";
        rails.set(
            entry.id,
            createTimeline(container, spec, {
                chrome: false,
                onOpenGuide: openGuide,
                onSelect: (event) => writeHash({ event: event.id }),
                onExpand: (event) => writeHash({ branch: event.id }),
            }),
        );
        container.dataset.state = "ready";
    } catch (error) {
        container.dataset.state = "error";
        container.innerHTML = `<p class="tl-fallback">This timeline could not be loaded (${escapeHtml(error.message)}). Check that <code>${escapeHtml(entry.src)}</code> is reachable.</p>`;
    }
}

function updatePageMetadata(entry) {
    const title = entry ? `${entry.heading} — Taste of the Past` : "Taste of the Past";
    const description = entry?.note || "Illustrated, weighted timelines of the ideas computing was built on.";
    const url = entry ? `${PUBLIC_URL}?series=${encodeURIComponent(entry.id)}` : PUBLIC_URL;

    document.title = title;
    document.querySelector('site-header[variant="topbar"]')?.setHeading(entry?.label || "Taste of the Past");
    document.querySelector('link[rel="canonical"]')?.setAttribute("href", url);
    document.querySelector('meta[property="og:title"]')?.setAttribute("content", title);
    document.querySelector('meta[property="og:description"]')?.setAttribute("content", description);
    document.querySelector('meta[property="og:url"]')?.setAttribute("content", url);
}

function setupSidebar() {
    const body = document.body;
    document.getElementById("menu-button")?.addEventListener("click", () => body.classList.add("sidebar-open"));
    document.getElementById("sidebar-close")?.addEventListener("click", () => body.classList.remove("sidebar-open"));
    document.getElementById("sidebar-scrim")?.addEventListener("click", () => body.classList.remove("sidebar-open"));
    document.addEventListener("keydown", (keyEvent) => {
        if (keyEvent.key === "Escape") body.classList.remove("sidebar-open");
    });
}

async function init() {
    setupSidebar();
    const view = document.querySelector("timeline-view");
    const navigation = document.querySelector('side-navigation[variant="timeline"]');
    const selectedId = new URLSearchParams(location.search).get("series");

    let series;
    try {
        const response = await fetch(SERIES_URL);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        series = await response.json();
    } catch (error) {
        view.showError(`The series index could not be loaded (${error.message}).`, SERIES_URL);
        return;
    }

    const entries = series.timelines || [];
    const selected = selectedId ? entries.find((entry) => entry.id === selectedId) : null;
    navigation.setTimelineSeries(entries, selectedId || "");

    if (!selectedId) {
        updatePageMetadata(null);
        view.showHome();
        return;
    }

    if (!selected) {
        updatePageMetadata(null);
        view.showNotFound();
        return;
    }

    updatePageMetadata(selected);
    view.showTimeline(selected);
    await mount(selected);
    applyHash();
    window.addEventListener("hashchange", applyHash);
    document.addEventListener("tl-popup-closed", () => {
        const params = new URLSearchParams(location.hash.slice(1));
        if (!params.has("event")) return;
        params.delete("event");
        writeHash(params);
    });
}

init();
