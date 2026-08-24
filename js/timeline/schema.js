/**
 * Timeline data contract.
 *
 * Everything here is plain, JSON-serialisable data: `data/timelines/*.json` is
 * the shared authoring surface, and this module turns one of those files into
 * the resolved shape the renderer draws. It deliberately mirrors the weighted
 * knowledge-graph schema used by the high-level garden — `weight` (0–1) decides
 * prominence, a lane plays the part of a cluster, and a style pack owns the look
 * — so the two visualisations rank and colour the same material the same way.
 *
 * Timestamps are scale-agnostic. A stamp carries its own precision, so a
 * year-only entry never pretends to be the 1st of January, and the same widget
 * serves "ten papers across eighty years" and "one Tuesday, by the half hour".
 */

export const TIER_ORDER = ["landmark", "major", "notable", "minor"];

/** Importance → tier. Drives marker size, card width, and label weight. */
export function tierFor(weight) {
    if (weight >= 0.85) return "landmark";
    if (weight >= 0.6) return "major";
    if (weight >= 0.3) return "notable";
    return "minor";
}

const PRECISIONS = ["year", "month", "day", "time"];
const CLOCK_EPOCH = Date.UTC(1970, 0, 1);

const STAMP_PATTERNS = [
    { re: /^(-?\d{1,6})$/, precision: "year" },
    { re: /^(-?\d{1,6})-(\d{2})$/, precision: "month" },
    { re: /^(-?\d{1,6})-(\d{2})-(\d{2})$/, precision: "day" },
    { re: /^(-?\d{1,6})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2})$/, precision: "time" },
    { re: /^(\d{2}):(\d{2})$/, precision: "time", clockOnly: true },
];

/**
 * Parse an authored `at` value into `{ epoch, precision, raw }`.
 *
 * Accepts `1936`, `1970-06`, `2026-08-24`, `2026-08-24T06:30`, and the
 * clock-only `06:30` (anchored to a single reference day, for daily routines).
 */
export function parseStamp(value, fallback = "day") {
    const raw = String(value ?? "").trim();
    for (const { re, precision, clockOnly } of STAMP_PATTERNS) {
        const match = raw.match(re);
        if (!match) continue;
        const parts = match.slice(1).map(Number);
        const epoch = clockOnly
            ? CLOCK_EPOCH + parts[0] * 3600000 + parts[1] * 60000
            : Date.UTC(parts[0], (parts[1] || 1) - 1, parts[2] || 1, parts[3] || 0, parts[4] || 0);
        return { epoch, precision, raw, clockOnly: Boolean(clockOnly) };
    }
    const parsed = Date.parse(raw);
    if (Number.isFinite(parsed)) return { epoch: parsed, precision: fallback, raw, clockOnly: false };
    console.warn(`[timeline] unreadable timestamp "${raw}" — placing it at the start of the axis.`);
    return { epoch: 0, precision: fallback, raw, clockOnly: false };
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

/** Render a stamp at its own precision — never more exact than it was authored. */
export function formatStamp(stamp, precision = stamp.precision) {
    const date = new Date(stamp.epoch);
    const year = date.getUTCFullYear();
    const level = PRECISIONS.indexOf(precision) >= 0 ? precision : stamp.precision;
    if (stamp.clockOnly || level === "time") {
        const hour = date.getUTCHours();
        const minute = String(date.getUTCMinutes()).padStart(2, "0");
        const suffix = hour < 12 ? "am" : "pm";
        const twelve = hour % 12 === 0 ? 12 : hour % 12;
        const clock = `${twelve}:${minute}${suffix}`;
        return stamp.clockOnly ? clock : `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${year}, ${clock}`;
    }
    if (level === "year") return String(year);
    if (level === "month") return `${MONTHS[date.getUTCMonth()]} ${year}`;
    return `${date.getUTCDate()} ${MONTHS[date.getUTCMonth()]} ${year}`;
}

const DEFAULT_LANE = { id: "__default", label: "Timeline", accent: "var(--acid)" };

function normalizeLanes(lanes) {
    const list = Array.isArray(lanes) && lanes.length ? lanes : [DEFAULT_LANE];
    const map = new Map();
    for (const lane of list) {
        if (!lane?.id) continue;
        map.set(lane.id, { accent: DEFAULT_LANE.accent, ...lane });
    }
    if (!map.size) map.set(DEFAULT_LANE.id, DEFAULT_LANE);
    return map;
}

function normalizeMedia(media) {
    if (!media) return null;
    const type = media.type || (media.src ? "image" : "glyph");
    return { alt: "", credit: "", motion: null, ...media, type };
}

function normalizeResource(resource) {
    return {
        type: resource.type || "reference",
        label: resource.label || resource.href || resource.guide || "Untitled",
        href: resource.href || null,
        guide: resource.guide || null,
        note: resource.note || null,
    };
}

/**
 * Turn an authored timeline spec into the resolved shape the renderer draws.
 * `inheritedLanes` lets a sub-timeline reuse its parent's lane palette without
 * redeclaring it.
 */
export function resolveTimeline(spec, { inheritedLanes = null } = {}) {
    const axis = { scale: "ordinal", precision: "year", direction: "horizontal", ...(spec.axis || {}) };
    const lanes = normalizeLanes(spec.lanes);
    if (inheritedLanes) for (const [id, lane] of inheritedLanes) if (!lanes.has(id)) lanes.set(id, lane);

    const events = (spec.events || [])
        .map((event, index) => {
            const lane = lanes.get(event.lane) || lanes.values().next().value;
            const weight = typeof event.weight === "number" ? Math.max(0, Math.min(1, event.weight)) : 0.5;
            const stamp = parseStamp(event.at, event.precision || axis.precision);
            return {
                id: event.id || `event-${index}`,
                at: { ...stamp, precision: event.precision || stamp.precision },
                lane,
                weight,
                tier: tierFor(weight),
                title: event.title || "Untitled",
                byline: event.byline || "",
                summary: event.summary || "",
                impact: event.impact || "",
                media: normalizeMedia(event.media),
                keyPoints: Array.isArray(event.keyPoints) ? event.keyPoints : [],
                resources: (event.resources || []).map(normalizeResource),
                bodyUrl: event.bodyUrl || null,
                style: event.style || lane.style || spec.style || "polaroid",
                children: event.children || null,
            };
        })
        .sort((a, b) => a.at.epoch - b.at.epoch);

    const epochs = events.map((event) => event.at.epoch);
    return {
        id: spec.id || "timeline",
        title: spec.title || "",
        tagline: spec.tagline || "",
        axis,
        style: spec.style || "polaroid",
        lanes,
        events,
        min: epochs.length ? Math.min(...epochs) : 0,
        max: epochs.length ? Math.max(...epochs) : 0,
    };
}
