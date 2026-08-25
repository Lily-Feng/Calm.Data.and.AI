/**
 * Validates the Taste of the Past series before it ships.
 *
 * Run: node scripts/check-timelines.mjs
 *
 * The page deep-links entries as `#event=<id>` across every rail at once, so
 * entry ids have to be unique across the whole series, not just within one
 * file. That is the failure this script exists to catch — it is invisible in a
 * single timeline and only shows up when two of them are on the page together.
 *
 * It also checks the things a JSON parse will not: that every referenced cover
 * exists, that every entry names a lane that was declared, and that a
 * sub-timeline does not start before its parent.
 */
import { access, readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

import { resolveTimeline } from "../js/timeline/schema.js";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const problems = [];

function fail(where, message) {
    problems.push(`${where}: ${message}`);
}

async function exists(path) {
    try {
        await access(resolve(ROOT, path));
        return true;
    } catch {
        return false;
    }
}

const series = JSON.parse(await readFile(resolve(ROOT, "data/timelines/series.json"), "utf8"));
const seenIds = new Map();
let entries = 0;
let branches = 0;

for (const listing of series.timelines) {
    const spec = JSON.parse(await readFile(resolve(ROOT, listing.src), "utf8"));
    if (spec.id !== listing.id) fail(listing.src, `declares id "${spec.id}" but the series lists it as "${listing.id}"`);

    const declaredLanes = new Set((spec.lanes || []).map((lane) => lane.id));

    async function walk(rail, raw, parent) {
        for (const [index, event] of rail.events.entries()) {
            entries += 1;
            const where = `${listing.id}/${event.id}`;
            const authored = raw.events[index] ?? {};

            if (seenIds.has(event.id)) fail(where, `duplicate entry id, also in ${seenIds.get(event.id)}`);
            seenIds.set(event.id, listing.id);

            if (authored.lane && !declaredLanes.has(authored.lane) && !parent) {
                fail(where, `unknown lane "${authored.lane}"`);
            }
            if (event.media?.src && !(await exists(event.media.src))) {
                fail(where, `missing cover art ${event.media.src}`);
            }
            if (event.bodyUrl && !(await exists(event.bodyUrl))) {
                fail(where, `missing body fragment ${event.bodyUrl}`);
            }
            if (parent && event.at.epoch < parent.at.epoch) {
                fail(where, `starts before its parent ${parent.id}`);
            }
            if (event.children) {
                branches += 1;
                await walk(resolveTimeline(event.children, { inheritedLanes: rail.lanes }), event.children, event);
            }
        }
    }

    // `raw.events` is sorted here too, so authored and resolved entries line up.
    const raw = { ...spec, events: [...(spec.events || [])] };
    const resolved = resolveTimeline(spec);
    raw.events.sort((a, b) => resolved.events.findIndex((e) => e.id === (a.id ?? "")) - resolved.events.findIndex((e) => e.id === (b.id ?? "")));
    await walk(resolved, raw, null);

    console.log(
        `${listing.id.padEnd(18)} ${String(resolved.events.length).padStart(2)} entries  ` +
            `${resolved.events.filter((event) => event.children).length} sub-timelines`,
    );
}

console.log(`\n${series.timelines.length} timelines, ${entries} entries, ${branches} sub-timelines, ${seenIds.size} unique ids`);

if (problems.length) {
    console.error(`\n${problems.length} problem(s):`);
    for (const problem of problems) console.error(`  ${problem}`);
    process.exit(1);
}
console.log("no problems found");
