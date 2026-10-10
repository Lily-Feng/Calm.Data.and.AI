/** Bespoke, deterministic vector covers for the data-platforms timeline. */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import { resolve } from "node:path";

const root = resolve(import.meta.dirname, "..");
const timeline = JSON.parse(await readFile(resolve(root, "data/timelines/data-platforms.json"), "utf8"));
const out = resolve(root, "public/timeline/data-platforms");
const ink = "#15271f";
const paper = "#f4f2ec";
const accent = Object.fromEntries(timeline.lanes.map(({ id, accent }) => [id, accent]));
const esc = (s) => String(s).replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll('"', "&quot;");
const r = (x, y, w, h, fill = "none", rx = 3, sw = 2) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`;
const c = (x, y, radius, fill = paper, sw = 2) => `<circle cx="${x}" cy="${y}" r="${radius}" fill="${fill}" stroke="${ink}" stroke-width="${sw}"/>`;
const l = (x1, y1, x2, y2, sw = 2, dash = "") => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}" stroke="${ink}" stroke-width="${sw}" ${dash ? `stroke-dasharray="${dash}"` : ""}/>`;
const p = (d, fill = "none", sw = 2) => `<path d="${d}" fill="${fill}" stroke="${ink}" stroke-width="${sw}" stroke-linecap="round" stroke-linejoin="round"/>`;
const t = (x, y, label, size = 12, anchor = "start") => `<text x="${x}" y="${y}" fill="${ink}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="${size}" text-anchor="${anchor}">${esc(label)}</text>`;
const arrow = (x1, y1, x2, y2) => l(x1, y1, x2, y2) + p(`M${x2 - 6} ${y2 - 5} l6 5 -6 5`);
const chip = (x, y, a) => r(x, y, 23, 18, a, 2) + Array.from({ length: 3 }, (_, i) => l(x + 5 + i * 6, y - 4, x + 5 + i * 6, y) + l(x + 5 + i * 6, y + 18, x + 5 + i * 6, y + 22)).join("");
const cylinder = (x, y, a) => `<ellipse cx="${x + 37}" cy="${y}" rx="37" ry="10" fill="${a}" stroke="${ink}" stroke-width="2"/>${r(x, y, 74, 64, a, 0)}<ellipse cx="${x + 37}" cy="${y + 64}" rx="37" ry="10" fill="${a}" stroke="${ink}" stroke-width="2"/>`;

const drawings = {
    "dp-mapreduce-2004": (a) => {
        const boxes = [42, 68, 94, 120, 146].map((y, i) => r(34, y, 27, 18, i === 2 ? a : paper, 2) + p(`M61 ${y + 9} C118 ${y + 9}, 125 ${86 + i * 13}, 176 ${86 + i * 13}`)).join("");
        const lanes = [55, 80, 105, 130, 155].map((y, i) => r(178, y, 37, 17, i === 2 ? a : paper, 2) + p(`M215 ${y + 8} C270 ${y + 8}, 290 105, 337 105`)).join("");
        return boxes + lanes + r(111, 109, 24, 17, paper, 2) + p("M111 109 l24 17 M135 109 l-24 17") + p("M136 118 h18", "none", 1.5) + r(156, 109, 15, 17, a, 2) + p("M337 79 L370 105 337 131 Z", a) + c(415, 105, 37, a, 2.5) + t(415, 112, "MR", 19, "middle");
    },
    "dp-hadoop-2006": (a) => [0, 1, 2, 3].map((i) => {
        const x = 65 + i * 105;
        return r(x, 39, 82, 137, paper, 5, 2.5) + chip(x + 30, 53, a) + [92, 111, 130].map((y) => `<ellipse cx="${x + 41}" cy="${y}" rx="23" ry="5" fill="${a}" stroke="${ink}" stroke-width="1.5"/>${l(x + 18, y, x + 18, y + 10, 1.5)}${l(x + 64, y, x + 64, y + 10, 1.5)}`).join("") + [148, 158].map((y) => l(x + 14, y, x + 68, y, 1.5)).join("");
    }).join("") + l(106, 184, 421, 184, 2.5) + [106, 211, 316, 421].map((x) => l(x, 176, x, 184, 2)).join(""),
    "hive-2008": (a) => {
        const grid = [0, 1, 2, 3, 4, 5].map((i) => [0, 1, 2].map((j) => `<path d="M${250 + i * 25} ${45 + j * 18} l12 -8 12 8 -12 8 z" fill="none" stroke="${ink}" opacity=".25"/>`).join("")).join("");
        const cells = [0, 1, 2, 3].map((row) => [0, 1, 2, 3, 4].map((col) => r(75 + col * 49, 58 + row * 27, 48, 26, (row + col) % 5 === 0 ? a : paper, 0, 1.4)).join("")).join("");
        return grid + r(66, 50, 262, 116, paper, 2, 2.5) + cells + r(362, 84, 91, 62, a, 2) + [105, 119, 133].map((y) => l(377, y, 438, y, 1.5)).join("") + p("M328 107 C344 107, 348 113, 362 113", "none", 1.5);
    },
    "rdd-2012": (a) => [0, 1, 2, 3].map((i) => {
        const x = 38 + i * 117;
        const tiles = [0, 1].map((row) => [0, 1, 2].map((col) => r(x + 10 + col * 22, 77 + row * 22, 19, 18, i === 2 && row === 1 && col === 1 ? paper : a, 2, 1.4)).join("")).join("");
        return r(x, 63, 88, 75, paper, 6, 2.5) + tiles + (i < 3 ? arrow(x + 88, 101, x + 111, 101) : "");
    }).join("") + chip(204, 32, a) + t(249, 46, "memory", 11) + p("M179 151 C230 188, 284 188, 331 150", "none", 2) + p("M323 148 l9 2 -5 8", "none", 2) + t(260, 177, "lineage", 10, "middle") + p("M304 115 l15 17 M319 115 l-15 17", "none", 1.8),
    "databricks-2013": (a) => p("M149 77 a27 27 0 0 1 28 -30 a39 39 0 0 1 70 -3 a30 30 0 0 1 42 32 q30 5 30 30 H147 q-25 -2 -25 -22 q0 -18 27 -7 Z", a, 2.5) + [176, 234, 291].map((x) => l(x, 106, x, 132)).join("") + [176, 234, 291].map((x) => c(x, 142, 11, a)).join("") + l(176, 142, 291, 142) + r(340, 53, 78, 105, paper, 3, 2.5) + [72, 86, 100].map((y) => l(354, y, 398, y, 1.5)).join("") + p("M365 118 l0 26 23 -13 z", a) + t(229, 179, "run code on demand", 10, "middle"),
    "dataframes-2015": (a) => {
        const tree = (x, neat) => r(x + 45, 45, 50, 20, a, 2) + l(x + 70, 65, x + 70, 79) + r(x + 35, 80, 70, 20, paper, 2) + l(x + 70, 100, x + 70, 113) + (neat ? r(x + 36, 114, 68, 20, a, 2) : r(x + 22, 114, 96, 20, paper, 2)) + l(x + 70, 134, x + 70, 146) + r(x + 22, 147, 96, 25, paper, 2) + [0, 1, 2, 3].map((i) => l(x + 42 + i * 19, 147, x + 42 + i * 19, 172, 1)).join("");
        return tree(54, false) + tree(326, true) + arrow(211, 102, 312, 102) + c(262, 73, 13, a) + l(272, 84, 282, 94, 3) + t(124, 38, "before", 10, "middle") + t(396, 38, "after", 10, "middle") + t(125, 129, "join", 10, "middle") + t(396, 129, "filter", 10, "middle");
    },
    "snowflake-2015": (a) => r(64, 137, 393, 39, paper, 3, 2.5) + [0, 1, 2, 3, 4, 5, 6, 7, 8, 9].map((i) => r(74 + i * 38, 146, 32, 21, i % 3 === 0 ? a : paper, 1, 1)).join("") + [0, 1, 2].map((i) => r(94 + i * 113, 83, 94, 43, i === 1 ? paper : a, 3, 2.5)).join("") + r(117, 39, 286, 31, paper, 3, 2.5) + [0, 1, 2, 3].map((i) => c(188 + i * 45, 54, 5, a, 1) + (i ? l(188 + (i - 1) * 45, 54, 188 + i * 45, 54, 1) : "")).join("") + t(50, 34, "services", 10) + t(50, 105, "compute", 10) + t(50, 159, "storage", 10) + t(254, 109, "paused", 9, "middle"),
    "delta-2019": (a) => [0, 1, 2, 3, 4].map((i) => r(66 + i * 59, 50, 43, 107, i === 2 ? paper : a, 2, 2)).join("") + p("M185 69 l26 45 M211 69 l-26 45", "none", 2.5) + r(386, 48, 75, 116, paper, 3, 2) + [0, 1, 2, 3].map((i) => t(399, 73 + i * 23, ["+ 001", "+ 002", "- 003", "+ 004"][i], 12)).join("") + arrow(357, 105, 386, 105) + p("M78 175 C189 188, 289 187, 412 172", "none", 1.5) + c(447, 175, 14, a, 1.5) + p("M447 166 v9 l6 4", "none", 1.5),
    "lakehouse-2020": (a) => p("M76 91 Q172 54 265 91 L265 161 L76 161 Z", paper, 2.5) + p("M66 91 Q99 75 132 91 T198 91 T265 91", "none", 3) + [0, 1, 2].map((i) => r(103, 109 + i * 16, 135, 13, i === 1 ? a : paper, 1, 1.5)).join("") + [0, 1, 2].map((i) => r(309 + i * 43, 140 - i * 29, 29, 21 + i * 29, a, 1)).join("") + p("M407 41 l-12 21 h11 l-8 19 25 -29 h-13 l9 -11 z", a, 1.5) + arrow(264, 125, 304, 125) + t(170, 182, "one copy", 10, "middle"),
    "tpcds-2021": (a) => l(52, 84, 413, 84, 1, "6 6") + l(52, 125, 413, 125, 1, "6 6") + [0, 1].map((i) => r(78, 91 + i * 40, 230 + i * 73, 25, a, 12, 2)).join("") + l(420, 65, 420, 166, 3) + [0, 1, 2, 3].map((i) => r(420 + (i % 2) * 12, 65 + i * 12, 12, 12, i % 2 ? ink : paper, 0, 1)).join("") + c(460, 51, 20, paper, 2) + p("M460 39 v13 l8 5", "none", 2) + r(102, 34, 63, 36, paper, 2) + t(134, 56, "?", 19, "middle"),
    "catalog-war-2024": (a) => r(169, 55, 181, 112, paper, 3, 2.5) + r(182, 79, 155, 67, a, 2) + [0, 1, 2, 3].map((i) => r(193 + i * 31, 66 - i * 5, 30, 66, paper, 2, 1.5)).join("") + r(240, 137, 39, 8, ink, 2, 0) + [[70, 46], [71, 147], [417, 46], [417, 147]].map(([x, y], i) => p(`M${i < 2 ? 169 : 350} 116 Q260 ${i < 2 ? 16 : 190}, ${x + 31} ${y + 15}`, "none", 1.6) + r(x, y, 62, 31, paper, 3) + p(`M${x + 25} ${y + 16} v-6 a6 6 0 0 1 12 0 v6`, "none", 1.3) + r(x + 24, y + 15, 15, 10, a, 2, 1.2)).join(""),
    "spark-4-2025": (a) => [0, 1, 2, 3].map((i) => r(81 + i * 21, 42 + i * 18, 270 - i * 42, 134 - i * 35, i === 3 ? a : paper, 2, 2)).join("") + t(216, 113, "=", 26, "middle") + p("M222 129 l10 10 22 -24", "none", 3.5) + t(383, 110, "{ }", 32, "middle") + t(383, 135, "VARIANT", 10, "middle"),
    "postgres-2025": (a) => cylinder(80, 48, a) + cylinder(362, 48, "#b8d9ff") + r(47, 139, 138, 37, a, 3) + r(330, 139, 138, 37, "#b8d9ff", 3) + l(117, 112, 117, 139) + l(399, 112, 399, 139) + p("M172 84 C230 43, 287 43, 346 84", "none", 2) + p("M337 77 l10 7 -11 5", "none", 2) + p("M346 112 C287 155, 229 155, 170 112", "none", 2) + p("M180 105 l-10 7 11 5", "none", 2) + t(258, 101, "transactions", 10, "middle"),
    "reyden-2026": (a) => [0, 1, 2, 3, 4, 5].map((i) => p(`M31 ${53 + i * 22} C105 ${53 + i * 22}, 135 ${93 + i * 4}, 202 ${93 + i * 4}`, "none", 1.5) + c(60 + i * 16, 53 + i * 22, 3, a, 1)).join("") + r(199, 61, 119, 91, a, 8, 2.5) + [0, 1, 2, 3, 4].map((i) => l(208, 77 + i * 15, 309, 77 + i * 15, 1.2)).join("") + [0, 1, 2, 3, 4, 5].map((i) => p(`M318 ${78 + i * 12} C348 ${78 + i * 12}, 356 ${54 + i * 20}, 381 ${54 + i * 20}`, "none", 1.5)).join("") + [0, 1, 2, 3].map((i) => r(385 + (i % 2) * 49, 47 + Math.floor(i / 2) * 52, 40, 38, paper, 2, 1.5)).join("") + c(442, 162, 17, paper, 1.5) + p("M442 153 v9 l7 3", "none", 1.5),
    "summit-2026": (a) => {
        const layers = [[74, [50, 86, 122, 158]], [181, [58, 102, 146]], [314, [58, 102, 146]], [438, [60, 104, 148]]];
        const edges = layers.slice(0, -1).map((layer, i) => layer[1].map((y) => layers[i + 1][1].map((y2) => l(layer[0] + 8, y, layers[i + 1][0] - 8, y2, 0.8)).join("")).join("")).join("");
        const nodes = layers.map(([x, ys], i) => ys.map((y) => c(x, y, 8, i < 2 ? "#ff9f8a" : a, 1.5)).join("")).join("");
        return `<g opacity=".45">${edges}</g>${nodes}` + p("M390 22 h44 v22 h-16 l-8 7 v-7 h-20 z", paper, 1.5) + t(412, 38, "···", 13, "middle") + t(434, 184, "{ }", 16, "middle");
    },
};

await mkdir(out, { recursive: true });
for (const event of timeline.events) {
    const draw = drawings[event.id];
    if (!draw) throw new Error(`Missing drawing for ${event.id}`);
    const a = accent[event.lane];
    const year = event.at.slice(0, 4);
    const title = event.title;
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 520 260" width="1040" height="520" role="img" aria-label="${esc(title)}, ${year}">
<rect width="520" height="260" fill="${paper}"/>
<rect width="520" height="10" fill="${a}"/>
${draw(a)}
<text x="34" y="226" fill="${ink}" font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-weight="700" font-size="30">${year}</text>
<text x="146" y="215" fill="${ink}" font-family="Georgia, 'Times New Roman', serif" font-size="14">${esc(title)}</text>
</svg>\n`;
    await writeFile(resolve(out, `${event.id}.svg`), svg);
}
console.log(`Wrote ${timeline.events.length} data-platform covers`);
