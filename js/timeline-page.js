/**
 * Taste of the Past — the series page.
 *
 * This file owns no timeline markup. `data/timelines/series.json` lists the
 * timelines; the page builds a section and a navigation entry for each, then
 * hands the authored spec to the component:
 *
 *     createTimeline(mount, spec, { onOpenGuide, onSelect, onExpand })
 *
 * Adding a timeline to the series is a one-entry change to the manifest — the
 * section, the sidebar link, and the scroll-spy all follow from it.
 */
import { escapeHtml } from "./timeline/dom.js";
import { createTimeline } from "./timeline/index.js";

const SERIES_URL = "data/timelines/series.json";

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

// ── Building the page from the manifest ─────────────────────────────────────

function navMarkup(entry) {
    return `
        <a class="nav-item" href="#section-${escapeHtml(entry.id)}" data-section="${escapeHtml(entry.id)}">
            <span class="nav-symbol">${escapeHtml(entry.symbol || "◷")}</span>
            <span>${escapeHtml(entry.label || entry.heading)}</span>
        </a>`;
}

function sectionMarkup(entry) {
    return `
        <section class="section-block" id="section-${escapeHtml(entry.id)}" aria-labelledby="heading-${escapeHtml(entry.id)}">
            <div class="section-heading">
                <div>
                    ${entry.eyebrow ? `<p class="eyebrow">${escapeHtml(entry.eyebrow)}</p>` : ""}
                    <h2 id="heading-${escapeHtml(entry.id)}">${escapeHtml(entry.heading)}</h2>
                </div>
                ${entry.note ? `<p>${escapeHtml(entry.note)}</p>` : ""}
            </div>
            <div id="rail-${escapeHtml(entry.id)}" class="tl-mount" data-state="loading">
                <p class="tl-fallback">Loading the rail…</p>
            </div>
        </section>`;
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
                // The section heading already names the timeline, so the
                // component contributes the tagline and the lane key.
                chrome: { title: false, tagline: true, legend: true },
                onOpenGuide: openGuide,
                onSelect: (event) => writeHash({ event: event.id }),
                onExpand: (event) => writeHash({ branch: event.id }),
            }),
        );
        container.dataset.state = "ready";
    } catch (error) {
        container.dataset.state = "error";
        container.innerHTML = `<p class="tl-fallback">This timeline could not be loaded (${escapeHtml(error.message)}). It is served as static JSON — check that <code>${escapeHtml(entry.src)}</code> is reachable.</p>`;
    }
}

/** Mark the sidebar entry for whichever timeline the reader is looking at. */
function followScroll(entries) {
    const links = new Map([...document.querySelectorAll("#series-nav [data-section]")].map((a) => [a.dataset.section, a]));
    if (!("IntersectionObserver" in window) || !links.size) return;
    const visible = new Set();
    const observer = new IntersectionObserver(
        (records) => {
            for (const record of records) {
                const id = record.target.id.replace(/^section-/, "");
                if (record.isIntersecting) visible.add(id);
                else visible.delete(id);
            }
            // Several sections can be on screen at once; the first in document
            // order is the one the reader has arrived at.
            const current = entries.map((entry) => entry.id).find((id) => visible.has(id));
            for (const [id, link] of links) link.classList.toggle("active", id === current);
        },
        { rootMargin: "-25% 0px -55% 0px" },
    );
    for (const entry of entries) {
        const section = document.getElementById(`section-${entry.id}`);
        if (section) observer.observe(section);
    }
}

function setupSidebar() {
    const body = document.body;
    document.getElementById("menu-button")?.addEventListener("click", () => body.classList.add("sidebar-open"));
    document.getElementById("sidebar-close")?.addEventListener("click", () => body.classList.remove("sidebar-open"));
    document.getElementById("sidebar-scrim")?.addEventListener("click", () => body.classList.remove("sidebar-open"));
    // On a phone the sidebar covers the page, so following a link must close it.
    document.getElementById("series-nav")?.addEventListener("click", () => body.classList.remove("sidebar-open"));
    document.addEventListener("keydown", (keyEvent) => {
        if (keyEvent.key === "Escape") body.classList.remove("sidebar-open");
    });
}

async function init() {
    setupSidebar();
    const sections = document.getElementById("series-sections");
    const nav = document.getElementById("series-nav");

    let series;
    try {
        const response = await fetch(SERIES_URL);
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        series = await response.json();
    } catch (error) {
        sections.innerHTML = `<p class="tl-fallback">The series index could not be loaded (${escapeHtml(error.message)}). Check that <code>${SERIES_URL}</code> is reachable.</p>`;
        return;
    }

    const entries = series.timelines || [];
    nav.innerHTML = entries.map(navMarkup).join("");
    sections.innerHTML = entries.map(sectionMarkup).join("");

    await Promise.all(entries.map(mount));
    followScroll(entries);
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
