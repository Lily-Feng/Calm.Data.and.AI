/**
 * Small shared helpers for building timeline markup.
 *
 * Timeline data is repository-owned, but every authored string still goes
 * through `escapeHtml` — the cost is nothing and it keeps a stray `<` in a
 * paper title from silently breaking the rail.
 */

export function escapeHtml(value = "") {
    return String(value)
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#39;");
}

export function stripHtml(html = "") {
    const holder = document.createElement("div");
    holder.innerHTML = html;
    return holder.textContent || "";
}

/**
 * Render an event's artwork.
 *
 * `glyph` is the zero-asset fallback — a big character on the lane accent —
 * so a timeline is authorable before any art exists. `motion` names a CSS
 * keyframe class in css/timeline.css; it is inert under reduced motion.
 */
export function renderMedia(media, { size = "card" } = {}) {
    if (!media) return "";
    const motion = media.motion ? ` tl-media--${escapeHtml(media.motion)}` : "";
    const frame = (inner) => `<div class="tl-media tl-media--${escapeHtml(size)}${motion}">${inner}</div>`;

    if (media.type === "video") {
        return frame(
            `<video src="${escapeHtml(media.src)}" autoplay muted loop playsinline
                    aria-label="${escapeHtml(media.alt)}"></video>`,
        );
    }
    if (media.type === "glyph" || !media.src) {
        return frame(`<span class="tl-media__glyph" role="img" aria-label="${escapeHtml(media.alt)}">${escapeHtml(media.glyph || "◆")}</span>`);
    }
    return frame(
        `<img src="${escapeHtml(media.src)}" alt="${escapeHtml(media.alt)}" loading="lazy" decoding="async">`,
    );
}

/** 0–1 weight as the shared impact meter used on cards and in the popup. */
export function renderMeter(weight, label = "Impact") {
    const percent = Math.round(weight * 100);
    return `<span class="tl-meter" title="${escapeHtml(label)} ${percent} of 100">
        <i style="width:${percent}%"></i><small>${percent}</small>
    </span>`;
}
