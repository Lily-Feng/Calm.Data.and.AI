/**
 * Filmstrip — sprocket-hole strip, dense and horizontal. Built for the
 * sub-timelines, where a parent's consequences need to read as a sequence
 * rather than as ten more headline moments.
 */
import { escapeHtml, renderMedia } from "../dom.js";

export const filmstrip = {
    id: "filmstrip",
    label: "Filmstrip",
    marker(event) {
        return `<span class="tl-marker__dot"></span>
            <span class="tl-marker__stamp">${escapeHtml(event.stampLabel)}</span>`;
    },
    card(event) {
        return `
            <span class="tl-card__perf" aria-hidden="true"></span>
            ${renderMedia(event.media, { size: "strip" })}
            <div class="tl-card__body">
                <h3>${escapeHtml(event.title)}</h3>
                ${event.byline ? `<p class="tl-card__byline">${escapeHtml(event.byline)}</p>` : ""}
                ${event.summary ? `<p class="tl-card__summary">${escapeHtml(event.summary)}</p>` : ""}
            </div>
            <span class="tl-card__perf" aria-hidden="true"></span>`;
    },
};
