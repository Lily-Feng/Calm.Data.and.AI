/**
 * Polaroid — a tilted photo card with a taped corner and a handwritten caption.
 * The default pack: reads as a scrapbook, holds a real image well, and gives
 * landmark entries enough room to look like landmarks.
 */
import { escapeHtml, renderMedia, renderMeter } from "../dom.js";

export const polaroid = {
    id: "polaroid",
    label: "Polaroid",
    marker(event) {
        return `<span class="tl-marker__dot"></span>
            <span class="tl-marker__stamp">${escapeHtml(event.stampLabel)}</span>`;
    },
    card(event) {
        return `
            <span class="tl-card__tape" aria-hidden="true"></span>
            ${renderMedia(event.media, { size: "card" })}
            <div class="tl-card__body">
                <p class="tl-card__lane">${escapeHtml(event.lane.label)}</p>
                <h3>${escapeHtml(event.title)}</h3>
                ${event.byline ? `<p class="tl-card__byline">${escapeHtml(event.byline)}</p>` : ""}
                ${event.summary ? `<p class="tl-card__summary">${escapeHtml(event.summary)}</p>` : ""}
                ${renderMeter(event.weight)}
            </div>`;
    },
};
