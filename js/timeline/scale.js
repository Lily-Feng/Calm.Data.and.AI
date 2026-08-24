/**
 * Axis maths: where each event sits along the rail, and what the ruler says.
 *
 * Three scales, because "a timeline" means different things at different
 * zooms:
 *
 *   ordinal  Even spacing, gaps annotated. Right when the story is the sequence
 *            and the years are lumpy (eight decades, ten papers, six of them
 *            after 1970).
 *   linear   Distance is proportional to elapsed time. Right for a day, a
 *            sprint, or any span where the pauses are part of the point.
 *   log      Distance compresses as it recedes. Right for "everything since",
 *            where recent detail matters more than ancient detail.
 *
 * Positions come back as fractions of the rail (0–1) and are then separated in
 * pixel space, so two events three days apart on a fifty-year axis still get
 * legible cards.
 */

const MINUTE = 60000;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const YEAR = 365.2425 * DAY;

/** Tick ladder, coarsest useful unit first matched by target density. */
const STEPS = [
    { size: 5 * MINUTE, unit: "minute" },
    { size: 15 * MINUTE, unit: "minute" },
    { size: HOUR, unit: "hour" },
    { size: 3 * HOUR, unit: "hour" },
    { size: 6 * HOUR, unit: "hour" },
    { size: DAY, unit: "day" },
    { size: 7 * DAY, unit: "day" },
    { size: 30 * DAY, unit: "month" },
    { size: 91 * DAY, unit: "month" },
    { size: YEAR, unit: "year" },
    { size: 5 * YEAR, unit: "year" },
    { size: 10 * YEAR, unit: "year" },
    { size: 25 * YEAR, unit: "year" },
    { size: 50 * YEAR, unit: "year" },
    { size: 100 * YEAR, unit: "year" },
];

function fractionsFor(events, scale, min, max) {
    const count = events.length;
    if (count === 0) return [];
    if (count === 1) return [0.5];
    if (scale === "ordinal") return events.map((_, index) => index / (count - 1));

    const span = max - min;
    if (span <= 0) return events.map((_, index) => index / (count - 1));

    if (scale === "log") {
        // Anchor the compression to a tenth of the span so the first event is
        // not driven to negative infinity.
        const base = Math.log(1 + span / (span / 10));
        return events.map((event) => Math.log(1 + (event.at.epoch - min) / (span / 10)) / base);
    }
    return events.map((event) => (event.at.epoch - min) / span);
}

/**
 * Push same-side neighbours apart until each has `minGap` px of room, then
 * report how much rail the result actually needs.
 */
function separate(points, minGap, size) {
    for (const side of ["above", "below"]) {
        const lane = points.filter((point) => point.side === side);
        for (let index = 1; index < lane.length; index += 1) {
            const previous = lane[index - 1];
            if (lane[index].px - previous.px < minGap) lane[index].px = previous.px + minGap;
        }
    }
    points.sort((a, b) => a.px - b.px);
    const overflow = points.length ? points[points.length - 1].px : 0;
    return Math.max(size, overflow);
}

/**
 * Lay the events out along the rail.
 *
 * Rather than squashing a scale until neighbours collide, the rail *grows*:
 * the track is stretched until the tightest same-side pair clears `minGap`,
 * which keeps `linear` and `log` spacing honest. `maxSize` caps that growth for
 * pathological data (two events a second apart on a fifty-year axis), and the
 * push-apart pass below is the safety net for exactly that case.
 *
 * @param {object[]} events resolved, already sorted by epoch
 * @param {object} axis     resolved axis spec
 * @param {object} box      `{ size, minGap, pad, maxSize }` in px along the rail
 * @returns {{ size: number, points: {id,px,fraction,side}[] }}
 */
export function layoutAxis(events, axis, box) {
    const { size, minGap, pad, maxSize = 14000 } = box;
    const min = events.length ? events[0].at.epoch : 0;
    const max = events.length ? events[events.length - 1].at.epoch : 0;
    const fractions = fractionsFor(events, axis.scale, min, max);

    const sides = events.map((_, index) => (index % 2 === 0 ? "above" : "below"));
    let tightest = 1;
    for (let index = 2; index < fractions.length; index += 1) {
        const delta = fractions[index] - fractions[index - 2];
        if (delta > 0 && delta < tightest) tightest = delta;
    }

    const wanted = tightest > 0 ? minGap / tightest : size;
    const usable = Math.max(1, Math.min(Math.max(size - pad * 2, wanted), maxSize));

    const points = events.map((event, index) => ({
        id: event.id,
        fraction: fractions[index],
        px: pad + fractions[index] * usable,
        // Alternating sides halve the crowding pressure and give the rail its
        // scrapbook rhythm.
        side: sides[index],
    }));

    const needed = separate(points, minGap, usable + pad);
    return { size: needed + pad, points };
}

function alignUp(epoch, step) {
    return Math.ceil(epoch / step) * step;
}

/** Ruler marks under the axis. Ordinal scales label the events themselves. */
export function axisTicks(events, axis, target = 7) {
    if (!events.length) return [];
    // Ordinal rails have no meaningful ruler — position carries no time — and
    // every marker already prints its own stamp. The gap labels do this job.
    if (axis.scale === "ordinal") return [];
    const min = events[0].at.epoch;
    const max = events[events.length - 1].at.epoch;
    const span = max - min;
    if (span <= 0) return [];

    const step = STEPS.find((candidate) => span / candidate.size <= target) || STEPS[STEPS.length - 1];
    const precision = step.unit === "year" ? "year" : step.unit === "month" ? "month" : step.unit === "day" ? "day" : "time";
    const ticks = [];
    for (let epoch = alignUp(min, step.size); epoch <= max; epoch += step.size) {
        ticks.push({ epoch, precision, atEvent: null });
    }
    return ticks;
}

/** Where a raw epoch falls on an already-laid-out rail, in px. */
export function projectEpoch(epoch, events, axis, layout) {
    if (!events.length) return 0;
    const min = events[0].at.epoch;
    const max = events[events.length - 1].at.epoch;
    if (max === min) return layout.points[0]?.px ?? 0;

    // Interpolate between the two nearest laid-out events so ticks follow the
    // same separation nudges the markers received.
    let index = events.findIndex((event) => event.at.epoch >= epoch);
    if (index <= 0) index = epoch <= min ? 0 : events.length - 1;
    const after = layout.points.find((point) => point.id === events[index].id);
    const beforeEvent = events[index - 1];
    if (!beforeEvent) return after.px;
    const before = layout.points.find((point) => point.id === beforeEvent.id);
    const t = (epoch - beforeEvent.at.epoch) / (events[index].at.epoch - beforeEvent.at.epoch || 1);
    return before.px + (after.px - before.px) * t;
}

/** Human gap label between two stamps, used by the ordinal scale's spacers. */
export function gapLabel(from, to) {
    const delta = to.epoch - from.epoch;
    if (delta <= 0) return "";
    // Calendar years are a few hours short of the astronomical one; round in
    // so that 1970 → 1971 reads as "1 year later", not "12 months later".
    if (delta >= YEAR * 0.92) {
        const years = Math.round(delta / YEAR);
        return years === 1 ? "1 year later" : `${years} years later`;
    }
    if (delta >= 28 * DAY) {
        const months = Math.max(1, Math.round(delta / (30 * DAY)));
        return months === 1 ? "1 month later" : `${months} months later`;
    }
    if (delta >= DAY) {
        const days = Math.round(delta / DAY);
        return days === 1 ? "next day" : `${days} days later`;
    }
    if (delta >= HOUR) {
        const hours = Math.round(delta / HOUR);
        return hours === 1 ? "1 hour later" : `${hours} hours later`;
    }
    return `${Math.max(1, Math.round(delta / MINUTE))} min later`;
}
