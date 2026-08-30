/**
 * Sticker — a chunky rounded chip with a hard drop shadow. Suits short,
 * repeating cadences (a day, a week) where every entry carries the same weight
 * and the glyph does most of the talking.
 */
import { escapeHtml, renderMedia } from "../dom.js";

export const sticker = {
    id: "sticker",
    label: "Sticker",
    marker(event) {
        return `<span class="tl-marker__dot"></span>
            <span class="tl-marker__stamp">${escapeHtml(event.stampLabel)}</span>`;
    },
    card(event) {
        return `
            ${renderMedia(event.media, { size: "chip" })}
            <div class="tl-card__body">
                <p class="tl-card__lane">${escapeHtml(event.lane.label)}</p>
                <h3>${escapeHtml(event.title)}</h3>
                ${event.summary ? `<p class="tl-card__summary">${escapeHtml(event.summary)}</p>` : ""}
            </div>`;
    },
};
