/**
 * Style packs.
 *
 * A pack owns the markup of a marker and a card; css/timeline.css owns the
 * pixels, scoped under `[data-style="<id>"]`. Packs resolve per event
 * (event.style → lane.style → timeline.style), so one rail can mix a polaroid
 * headline with a filmstrip aside.
 *
 * To add a style: write a pack, register it below, then reference its id from a
 * timeline JSON file. Nothing else needs to change. `createTimeline` also takes
 * a `styles` option, so a page can register a one-off pack without editing this
 * file.
 */
import { filmstrip } from "./filmstrip.js";
import { polaroid } from "./polaroid.js";
import { sticker } from "./sticker.js";

export const STYLE_PACKS = { polaroid, filmstrip, sticker };

export function stylePack(id, extra = {}) {
    return extra[id] || STYLE_PACKS[id] || polaroid;
}
