/**
 * The Timelines page.
 *
 * This file owns no timeline markup. It loads authored JSON and hands it to the
 * component:
 *
 *     createTimeline(mount, spec, { onOpenGuide, onSelect, onExpand })
 *
 * Everything page-specific — deep links, the sidebar, jumping back into the
 * atlas when an entry cites a guide — lives here, so the component stays
 * reusable on any page that has data to draw.
 */
import { createTimeline } from "./timeline/index.js";

const RAILS = [
    { mount: "#rail-cs-papers", src: "data/timelines/cs-papers.json" },
];

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

async function load({ mount, src }) {
    const container = document.querySelector(mount);
    if (!container) return;
    try {
        const response = await fetch(src);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        const spec = await response.json();
        container.innerHTML = "";
        const rail = createTimeline(container, spec, {
            // The page already prints the timeline's name in its section
            // heading, so the component contributes the tagline and the lane key.
            chrome: { title: false, tagline: true, legend: true },
            onOpenGuide: openGuide,
            onSelect: (event) => writeHash({ event: event.id }),
            onExpand: (event) => writeHash({ branch: event.id }),
        });
        rails.set(spec.id, rail);
        container.dataset.state = "ready";
    } catch (error) {
        container.dataset.state = "error";
        container.innerHTML = `<p class="tl-fallback">This timeline could not be loaded (${error.message}). It is served as static JSON — check that <code>${src}</code> is reachable.</p>`;
    }
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
    await Promise.all(RAILS.map(load));
    applyHash();
    window.addEventListener("hashchange", applyHash);
    // Closing the dialog should not leave a stale entry in the address bar.
    document.addEventListener("tl-popup-closed", () => {
        const params = new URLSearchParams(location.hash.slice(1));
        if (!params.has("event")) return;
        params.delete("event");
        writeHash(params);
    });
}

init();
