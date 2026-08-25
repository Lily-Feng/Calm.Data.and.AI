/**
 * The detail dialog behind a timeline marker.
 *
 * One `<dialog>` is created lazily and shared by every timeline on the page,
 * including nested sub-timelines, so opening a branch entry never stacks two
 * modals. Long-form bodies live in `timelines/<timeline>/<event>.html` and are
 * fetched on demand; a monotonic token guards against a slow fetch for event A
 * landing after the reader has already opened event B.
 */
import { escapeHtml, renderMedia, renderMeter } from "./dom.js";

const RESOURCE_GROUPS = {
    paper: { group: "The paper", hint: "primary source", glyph: "▤" },
    code: { group: "Code", hint: "implementations", glyph: "⌘" },
    dataset: { group: "Data", hint: "corpora and benchmarks", glyph: "▦" },
    talk: { group: "Watch", hint: "talks and lectures", glyph: "▷" },
    guide: { group: "In this atlas", hint: "connected guides", glyph: "≡" },
    successor: { group: "What came next", hint: "descendants", glyph: "↳" },
    reference: { group: "Reference", hint: "background", glyph: "◇" },
    external: { group: "Elsewhere", hint: "further reading", glyph: "↗" },
};
const RESOURCE_ORDER = ["paper", "code", "dataset", "talk", "guide", "successor", "reference", "external"];

const bodyCache = new Map();

async function fetchBody(url) {
    if (bodyCache.has(url)) return bodyCache.get(url);
    const request = fetch(url).then((response) => {
        if (!response.ok) throw new Error(`${response.status} ${response.statusText}`);
        return response.text();
    });
    bodyCache.set(url, request);
    request.catch(() => bodyCache.delete(url));
    return request;
}

function renderResources(event) {
    const groups = RESOURCE_ORDER.map((type) => ({
        type,
        meta: RESOURCE_GROUPS[type],
        items: event.resources.filter((resource) => resource.type === type),
    })).filter((group) => group.items.length);

    return groups
        .map(
            (group) => `
        <section class="tl-pop__block">
            <h4>${escapeHtml(group.meta.group)} <small>${escapeHtml(group.meta.hint)}</small></h4>
            <div class="tl-res">
                ${group.items.map((resource) => renderResource(resource, group.meta)).join("")}
            </div>
        </section>`,
        )
        .join("");
}

function renderResource(resource, meta) {
    const inner = `
        <span class="tl-res__icon" aria-hidden="true">${escapeHtml(meta.glyph)}</span>
        <span class="tl-res__body">
            <strong>${escapeHtml(resource.label)}</strong>
            ${resource.note ? `<small>${escapeHtml(resource.note)}</small>` : ""}
        </span>
        <span class="tl-res__go" aria-hidden="true">${resource.guide ? "→" : "↗"}</span>`;

    if (resource.guide) {
        return `<button type="button" class="tl-res__link tl-res__link--internal" data-guide="${escapeHtml(resource.guide)}">${inner}</button>`;
    }
    return `<a class="tl-res__link" href="${escapeHtml(resource.href || "#")}" target="_blank" rel="noreferrer">${inner}</a>`;
}

export function createPopup({ onOpenGuide } = {}) {
    let dialog = null;
    let watcher = null;
    let token = 0;

    function ensure() {
        if (dialog) return dialog;
        dialog = document.createElement("dialog");
        dialog.className = "tl-pop";
        dialog.innerHTML = `
            <div class="tl-pop__shell">
                <button class="tl-pop__close" type="button" aria-label="Close details">×</button>
                <div class="tl-pop__content"></div>
            </div>`;
        dialog.addEventListener("click", (clickEvent) => {
            if (clickEvent.target === dialog) close();
            if (clickEvent.target.closest(".tl-pop__close")) close();
            const guideButton = clickEvent.target.closest("[data-guide]");
            if (guideButton && onOpenGuide) {
                close();
                onOpenGuide(guideButton.dataset.guide);
                return;
            }
            // The dialog lives on <body>, outside any rail's subtree, so the
            // owning timeline is told by event rather than by callback — which
            // also keeps one shared dialog usable by nested rails.
            const branchButton = clickEvent.target.closest("[data-branch]");
            if (branchButton) {
                close();
                document.dispatchEvent(new CustomEvent("tl:branch", { detail: { id: branchButton.dataset.branch } }));
            }
        });
        // Watch the `open` attribute rather than listening for the `close`
        // event. A dialog can be dismissed four ways — the close button, the
        // backdrop, Escape, or programmatically — and only the attribute is
        // guaranteed to change on all of them. (Chrome 151 headless does not
        // fire `close` at all, which is how this was found.)
        watcher = new MutationObserver(() => {
            if (dialog.open) return;
            token += 1;
            dialog.dispatchEvent(new CustomEvent("tl-popup-closed", { bubbles: true }));
        });
        watcher.observe(dialog, { attributes: true, attributeFilter: ["open"] });
        document.body.append(dialog);
        return dialog;
    }

    async function open(event) {
        const element = ensure();
        const current = ++token;
        const content = element.querySelector(".tl-pop__content");
        // Key-point bullets, the impact rule, and the resource icons all tint
        // from the lane, so the accent scopes the dialog, not just its header.
        element.style.setProperty("--lane-accent", event.lane.accent);

        content.innerHTML = `
            <header class="tl-pop__head">
                ${renderMedia(event.media, { size: "hero" })}
                <div class="tl-pop__headline">
                    <p class="tl-pop__eyebrow"><i></i>${escapeHtml(event.lane.label)}<em>${escapeHtml(event.tier)}</em></p>
                    <h2>${escapeHtml(event.title)}</h2>
                    <p class="tl-pop__stamp">${escapeHtml(event.stampLabel)}${event.byline ? ` · ${escapeHtml(event.byline)}` : ""}</p>
                    ${renderMeter(event.weight)}
                </div>
            </header>
            <div class="tl-pop__scroll">
                ${event.summary ? `<p class="tl-pop__lede">${escapeHtml(event.summary)}</p>` : ""}
                ${
                    event.keyPoints.length
                        ? `<section class="tl-pop__block"><h4>What it says</h4>
                             <ul class="tl-points">${event.keyPoints.map((point) => `<li>${escapeHtml(point)}</li>`).join("")}</ul>
                           </section>`
                        : ""
                }
                ${
                    event.impact
                        ? `<section class="tl-pop__block tl-pop__block--impact"><h4>Why it mattered</h4><p>${escapeHtml(event.impact)}</p></section>`
                        : ""
                }
                ${
                    event.branchable
                        ? `<button class="tl-pop__branch" type="button" data-branch="${escapeHtml(event.id)}">
                             <span>This one kept going</span><strong>Open its sub-timeline</strong><i>⑂</i>
                           </button>`
                        : ""
                }
                ${renderResources(event)}
                ${event.bodyUrl ? `<div class="tl-pop__body" data-state="loading"><p class="tl-pop__loading">Loading the long version…</p></div>` : ""}
            </div>`;

        if (!element.open) element.showModal();
        element.querySelector(".tl-pop__scroll").scrollTop = 0;

        if (!event.bodyUrl) return;
        const slot = content.querySelector(".tl-pop__body");
        try {
            const html = await fetchBody(event.bodyUrl);
            if (current !== token) return;
            slot.dataset.state = "ready";
            slot.innerHTML = html;
        } catch (error) {
            if (current !== token) return;
            slot.dataset.state = "error";
            slot.innerHTML = `<p class="tl-pop__error">The long version could not be loaded right now.</p>`;
        }
    }

    function close() {
        if (dialog?.open) dialog.close();
    }

    return {
        open,
        close,
        get element() {
            return ensure();
        },
        destroy() {
            watcher?.disconnect();
            watcher = null;
            dialog?.remove();
            dialog = null;
        },
    };
}
