/**
 * createTimeline — the timeline component.
 *
 * A page never builds timeline markup itself. It loads a JSON spec and calls:
 *
 *     import { createTimeline } from "./js/timeline/index.js";
 *     const rail = createTimeline(container, spec, { onOpenGuide });
 *
 * The component owns layout, the detail dialog, keyboard access, and — for
 * high-weight entries carrying `children` — a nested sub-timeline, which is
 * simply this same function called again inside a drawer under the parent rail.
 *
 * Returned handle:
 *   select(id)      open an entry's detail dialog
 *   expand(id)      open (or, when already open, keep) an entry's sub-timeline
 *   collapse()      close any open sub-timeline
 *   scrollTo(id)    bring an entry into view without opening anything
 *   refresh()       re-measure and re-lay-out
 *   destroy()       remove listeners, observers, and DOM
 *   events          the resolved events, in chronological order
 */
import { escapeHtml } from "./dom.js";
import { createPopup } from "./popup.js";
import { axisTicks, gapLabel, layoutAxis, projectEpoch } from "./scale.js";
import { formatStamp, resolveTimeline } from "./schema.js";
import { stylePack } from "./styles/index.js";

/** Rail spacing per style: the room one card needs before the rail must grow. */
const GEOMETRY = {
    polaroid: { horizontal: { cell: 330, pad: 176 }, vertical: { cell: 260, pad: 96 } },
    filmstrip: { horizontal: { cell: 252, pad: 140 }, vertical: { cell: 200, pad: 76 } },
    sticker: { horizontal: { cell: 224, pad: 124 }, vertical: { cell: 168, pad: 64 } },
};

const MAX_DEPTH = 2;

/** Gap between the axis and the near edge of a card, matching css/timeline.css. */
const CARD_OFFSET = 48;

/** Headroom for the lift-and-scale a pack applies on hover. */
const HOVER_SLACK = 36;

export function createTimeline(container, spec, options = {}) {
    const {
        depth = 0,
        popup = createPopup({ onOpenGuide: options.onOpenGuide }),
        ownsPopup = depth === 0,
        styles = {},
        inheritedLanes = null,
        onSelect = null,
        onExpand = null,
        chrome = depth === 0,
    } = options;

    // `chrome: true | false` toggles the whole header; an object turns parts of
    // it off, for a page that already prints its own heading above the rail.
    const parts = chrome === true ? { title: true, tagline: true, legend: true } : chrome || {};

    const timeline = resolveTimeline(spec, { inheritedLanes });
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const vertical = timeline.axis.direction === "vertical";
    const byId = new Map();
    const branches = new Map();

    let root = null;
    let track = null;
    let viewport = null;
    let observer = null;
    let reveal = null;
    let expandedId = null;
    let lastSize = -1;
    let lastHeight = "";

    // ── Decoration ──────────────────────────────────────────────────────────

    function decorate(event) {
        return Object.assign(event, {
            // A range such as "1951–52" still needs one machine-readable point
            // on the axis, but should not pretend to be a single-year event.
            stampLabel: event.displayAt || formatStamp(event.at),
            pack: stylePack(event.style, styles),
            /** Sub-timelines only exist while there is depth left to nest into. */
            branchable: Boolean(event.children) && depth < MAX_DEPTH - 1,
        });
    }

    // ── Markup ──────────────────────────────────────────────────────────────

    function laneLegend() {
        const lanes = [...timeline.lanes.values()].filter((lane) => lane.id !== "__default");
        if (!lanes.length) return "";
        return `<div class="tl__legend">${lanes
            .map(
                (lane) =>
                    `<span style="--lane-accent:${escapeHtml(lane.accent)}"><i></i>${escapeHtml(lane.label)}</span>`,
            )
            .join("")}</div>`;
    }

    function eventMarkup(event) {
        return `
        <article class="tl__event" data-event="${escapeHtml(event.id)}" data-style="${escapeHtml(event.style)}"
                 data-tier="${escapeHtml(event.tier)}" style="--lane-accent:${escapeHtml(event.lane.accent)}">
            <button class="tl-marker" type="button" aria-expanded="false"
                    aria-label="${escapeHtml(`${event.title}, ${event.stampLabel}`)}">
                ${event.pack.marker(event)}
            </button>
            <div class="tl-card">
                <button class="tl-card__hit" type="button" tabindex="-1" aria-hidden="true"></button>
                ${event.pack.card(event)}
                ${
                    event.branchable
                        ? `<button class="tl-card__branch" type="button" data-branch="${escapeHtml(event.id)}">
                             <i aria-hidden="true">⑂</i> ${escapeHtml(String(event.children.events?.length ?? 0))} that followed
                           </button>`
                        : ""
                }
            </div>
        </article>`;
    }

    function build() {
        root = document.createElement("section");
        root.className = "tl";
        root.dataset.style = timeline.style;
        root.dataset.orientation = vertical ? "vertical" : "horizontal";
        root.dataset.scale = timeline.axis.scale;
        root.dataset.depth = String(depth);
        if (reduceMotion) root.dataset.motion = "reduced";

        root.innerHTML = `
            ${
                parts.title || parts.tagline || parts.legend
                    ? `<header class="tl__chrome">
                         <div>
                            ${parts.title && timeline.title ? `<h2 class="tl__title">${escapeHtml(timeline.title)}</h2>` : ""}
                            ${parts.tagline && timeline.tagline ? `<p class="tl__tagline">${escapeHtml(timeline.tagline)}</p>` : ""}
                         </div>
                         ${parts.legend ? laneLegend() : ""}
                       </header>`
                    : ""
            }
            <div class="tl__viewport" tabindex="0" role="group"
                 aria-label="${escapeHtml(timeline.title || "Timeline")} — scroll or use the arrow keys">
                <div class="tl__track">
                    <div class="tl__axis" aria-hidden="true"></div>
                    <div class="tl__ticks" aria-hidden="true"></div>
                    <div class="tl__gaps" aria-hidden="true"></div>
                    ${timeline.events.map((event) => eventMarkup(decorate(event))).join("")}
                </div>
            </div>
            <div class="tl__branch" hidden></div>`;

        viewport = root.querySelector(".tl__viewport");
        track = root.querySelector(".tl__track");
        for (const event of timeline.events) byId.set(event.id, event);
        container.append(root);
    }

    // ── Layout ──────────────────────────────────────────────────────────────

    function measure() {
        if (!track || !timeline.events.length) return;
        const available = vertical ? viewport.clientHeight || 640 : viewport.clientWidth;
        // Re-laying the axis is only worth it when the rail's own length
        // changed; fitting across it is cheap and idempotent, so it always runs.
        if (available !== lastSize) {
            lastSize = available;
            layoutAlong(available);
        }
        fitAcross();
    }

    function layoutAlong(available) {
        const geometry = GEOMETRY[timeline.style]?.[vertical ? "vertical" : "horizontal"] || GEOMETRY.polaroid.horizontal;
        const layout = layoutAxis(timeline.events, timeline.axis, {
            size: Math.max(available, geometry.cell * 2),
            minGap: geometry.cell,
            pad: geometry.pad,
        });

        track.style.setProperty("--tl-track", `${Math.round(layout.size)}px`);
        for (const point of layout.points) {
            const element = track.querySelector(`[data-event="${CSS.escape(point.id)}"]`);
            if (!element) continue;
            element.style.setProperty("--tl-pos", `${Math.round(point.px)}px`);
            element.dataset.side = point.side;
        }
        renderTicks(layout);
        renderGaps(layout);
    }

    /**
     * Size the rail across its short axis from the cards that are actually
     * there. A card's height is content-driven — a long summary, a branch
     * button — so any constant here would eventually clip somebody's entry.
     */
    function fitAcross() {
        if (vertical) return;
        let tallest = 0;
        for (const card of track.querySelectorAll(":scope > .tl__event > .tl-card")) {
            // The bounding rect, not offsetHeight: the polaroid pack tilts its
            // cards, and the tilt is what actually has to fit.
            tallest = Math.max(tallest, card.getBoundingClientRect().height);
        }
        if (!tallest) return;
        // Idempotent on purpose: this write resizes the viewport the
        // ResizeObserver is watching, and repeating the same value ends the loop.
        const height = `${Math.ceil((tallest + CARD_OFFSET) * 2 + HOVER_SLACK)}px`;
        if (height === lastHeight) return;
        lastHeight = height;
        root.style.setProperty("--tl-height", height);
    }

    function renderTicks(layout) {
        // Tick density follows the rail's real length, so a long day gets an
        // hourly ruler while a short one does not crowd.
        const ticks = axisTicks(timeline.events, timeline.axis, Math.max(4, Math.round(layout.size / 150)));
        const holder = root.querySelector(".tl__ticks");
        // A rail authored entirely in clock time gets a clock ruler, not one
        // stamped with the reference date the clock stamps are anchored to.
        const clockOnly = timeline.events.every((event) => event.at.clockOnly);
        holder.innerHTML = ticks
            .map((tick) => ({
                px: tick.atEvent
                    ? layout.points.find((point) => point.id === tick.atEvent)?.px ?? 0
                    : projectEpoch(tick.epoch, timeline.events, timeline.axis, layout),
                label: formatStamp({ epoch: tick.epoch, precision: tick.precision, clockOnly }, tick.precision),
            }))
            // The ruler is there to give the space *between* entries a sense of
            // scale. A tick sitting on top of an entry's own stamp is noise.
            .filter((tick) => layout.points.every((point) => Math.abs(point.px - tick.px) > 70))
            .map((tick) => `<span class="tl__tick" style="--tl-pos:${Math.round(tick.px)}px">${escapeHtml(tick.label)}</span>`)
            .join("");
    }

    /** Ordinal rails hide real elapsed time, so name it between the markers. */
    function renderGaps(layout) {
        const holder = root.querySelector(".tl__gaps");
        if (timeline.axis.scale !== "ordinal" || timeline.events.length < 2) {
            holder.innerHTML = "";
            return;
        }
        const spans = [];
        for (let index = 1; index < timeline.events.length; index += 1) {
            const label = gapLabel(timeline.events[index - 1].at, timeline.events[index].at);
            if (!label) continue;
            const from = layout.points.find((point) => point.id === timeline.events[index - 1].id).px;
            const to = layout.points.find((point) => point.id === timeline.events[index].id).px;
            if (to - from < 90) continue;
            spans.push(`<span class="tl__gap" style="--tl-pos:${Math.round((from + to) / 2)}px">${escapeHtml(label)}</span>`);
        }
        holder.innerHTML = spans.join("");
    }

    // ── Sub-timelines ───────────────────────────────────────────────────────

    function expand(id) {
        const event = byId.get(id);
        const drawer = root.querySelector(".tl__branch");
        if (!event?.branchable) return;
        if (expandedId === id) {
            scrollIntoView(drawer);
            return;
        }
        collapse();

        drawer.hidden = false;
        drawer.innerHTML = `
            <div class="tl__branch-head">
                <p class="tl__branch-eyebrow" style="--lane-accent:${escapeHtml(event.lane.accent)}"><i></i>Branch</p>
                <h3>What ${escapeHtml(event.title)} set in motion</h3>
                <button class="tl__branch-close" type="button" aria-label="Close sub-timeline">×</button>
            </div>
            <div class="tl__branch-rail"></div>`;

        const nested = createTimeline(drawer.querySelector(".tl__branch-rail"), event.children, {
            ...options,
            depth: depth + 1,
            popup,
            ownsPopup: false,
            chrome: false,
            inheritedLanes: timeline.lanes,
        });
        branches.set(id, nested);
        expandedId = id;

        const marker = track.querySelector(`[data-event="${CSS.escape(id)}"]`);
        marker?.setAttribute("data-expanded", "true");
        marker?.querySelector(".tl-marker")?.setAttribute("aria-expanded", "true");
        onExpand?.(event);
        scrollIntoView(drawer);
    }

    function collapse() {
        if (!expandedId) return;
        branches.get(expandedId)?.destroy();
        branches.delete(expandedId);
        const marker = track.querySelector(`[data-event="${CSS.escape(expandedId)}"]`);
        marker?.removeAttribute("data-expanded");
        marker?.querySelector(".tl-marker")?.setAttribute("aria-expanded", "false");
        expandedId = null;
        const drawer = root.querySelector(".tl__branch");
        drawer.hidden = true;
        drawer.innerHTML = "";
    }

    function scrollIntoView(element) {
        element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest" });
    }

    // ── Interaction ─────────────────────────────────────────────────────────

    function select(id) {
        const event = byId.get(id);
        if (!event) return;
        scrollTo(id);
        popup.open(event);
        onSelect?.(event);
    }

    function scrollTo(id) {
        const element = track?.querySelector(`[data-event="${CSS.escape(id)}"]`);
        if (!element) return;
        element.scrollIntoView({ behavior: reduceMotion ? "auto" : "smooth", block: "nearest", inline: "center" });
    }

    function onClick(clickEvent) {
        const branchButton = clickEvent.target.closest("[data-branch]");
        if (branchButton) {
            expand(branchButton.dataset.branch);
            return;
        }
        if (clickEvent.target.closest(".tl__branch-close")) {
            collapse();
            return;
        }
        const article = clickEvent.target.closest(".tl__event");
        // Only this rail's own entries — a nested rail handles its own clicks.
        if (article && article.parentElement === track) select(article.dataset.event);
    }

    function onKeyDown(keyEvent) {
        const forward = vertical ? "ArrowDown" : "ArrowRight";
        const back = vertical ? "ArrowUp" : "ArrowLeft";
        if (![forward, back, "Home", "End"].includes(keyEvent.key)) return;
        const markers = [...track.querySelectorAll(":scope > .tl__event > .tl-marker")];
        if (!markers.length) return;
        const active = markers.indexOf(document.activeElement);
        const next =
            keyEvent.key === "Home"
                ? 0
                : keyEvent.key === "End"
                  ? markers.length - 1
                  : Math.max(0, Math.min(markers.length - 1, (active < 0 ? 0 : active) + (keyEvent.key === forward ? 1 : -1)));
        keyEvent.preventDefault();
        markers[next].focus();
        markers[next].closest(".tl__event").scrollIntoView({
            behavior: reduceMotion ? "auto" : "smooth",
            block: "nearest",
            inline: "center",
        });
    }

    /** The shared dialog asks for a branch by id; claim it only if it is ours. */
    function onBranchRequest(customEvent) {
        const id = customEvent.detail?.id;
        if (byId.get(id)?.branchable) expand(id);
    }

    /** Entrance reveal: cards fade in as the rail scrolls past them. */
    function watchReveal() {
        if (reduceMotion || !("IntersectionObserver" in window)) {
            for (const article of track.children) article.dataset.seen = "true";
            return;
        }
        reveal = new IntersectionObserver(
            (entries) => {
                for (const entry of entries) {
                    if (!entry.isIntersecting) continue;
                    entry.target.dataset.seen = "true";
                    reveal.unobserve(entry.target);
                }
            },
            { root: viewport, threshold: 0.15 },
        );
        for (const article of track.querySelectorAll(":scope > .tl__event")) reveal.observe(article);
    }

    function onWindowResize() {
        lastSize = -1;
        measure();
    }

    // ── Boot ────────────────────────────────────────────────────────────────

    build();
    measure();
    watchReveal();
    root.addEventListener("click", onClick);
    viewport.addEventListener("keydown", onKeyDown);
    document.addEventListener("tl:branch", onBranchRequest);

    // Card heights move once the real typeface arrives, so fit again then.
    document.fonts?.ready.then(measure).catch(() => {});

    if ("ResizeObserver" in window) {
        observer = new ResizeObserver(() => measure());
        observer.observe(viewport);
    } else {
        window.addEventListener("resize", onWindowResize);
    }

    return {
        get events() {
            return timeline.events;
        },
        get resolved() {
            return timeline;
        },
        get element() {
            return root;
        },
        select,
        expand,
        collapse,
        scrollTo,
        refresh: measure,
        destroy() {
            collapse();
            observer?.disconnect();
            reveal?.disconnect();
            window.removeEventListener("resize", onWindowResize);
            root.removeEventListener("click", onClick);
            viewport.removeEventListener("keydown", onKeyDown);
            document.removeEventListener("tl:branch", onBranchRequest);
            if (ownsPopup) popup.destroy();
            root.remove();
        },
    };
}

export { createPopup } from "./popup.js";
export { resolveTimeline, formatStamp, tierFor } from "./schema.js";
export { STYLE_PACKS, stylePack } from "./styles/index.js";
