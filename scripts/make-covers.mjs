/**
 * Generates the timeline's cover art.
 *
 * The papers themselves are copyrighted, so the timeline does not reproduce
 * scans — each entry gets a drawn cover that states the year and the title and
 * carries a motif for the idea, and every card links out to the real paper.
 *
 * Run: node scripts/make-covers.mjs
 * Writes: public/timeline/cs-papers/<id>.svg
 *
 * This is an authoring tool, not part of the deploy path — the generated SVGs
 * are committed and served directly.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/timeline/cs-papers");
const W = 520;
const H = 260;

const INK = "#15271f";
const PAPER = "#f4f2ec";

/** Deterministic jitter, so a re-run produces byte-identical files. */
function seeded(seed) {
    let state = seed % 2147483647 || 1;
    return () => ((state = (state * 16807) % 2147483647) - 1) / 2147483646;
}

const motifs = {
    /** Punched paper tape — the machine that reads a strip of symbols. */
    tape(accent, rand) {
        const holes = Array.from({ length: 13 }, (_, column) =>
            Array.from({ length: 5 }, (_, row) => (rand() > 0.45 ? `<circle cx="${58 + column * 34}" cy="${64 + row * 20}" r="5.5"/>` : ""))
                .join(""),
        ).join("");
        return `<g fill="${INK}" opacity=".82">${holes}</g>
            <rect x="40" y="46" width="440" height="112" rx="6" fill="none" stroke="${accent}" stroke-width="4"/>`;
    },
    /** Signal against noise. */
    signal(accent, rand) {
        const clean = Array.from({ length: 61 }, (_, i) => `${40 + i * 7.3},${104 - Math.sin(i / 4.4) * 34}`).join(" ");
        const noisy = Array.from({ length: 61 }, (_, i) => `${40 + i * 7.3},${104 - Math.sin(i / 4.4) * 34 + (rand() - 0.5) * 30}`).join(" ");
        return `<polyline points="${noisy}" fill="none" stroke="${INK}" stroke-width="1.4" opacity=".38"/>
            <polyline points="${clean}" fill="none" stroke="${accent}" stroke-width="6" stroke-linecap="round"/>`;
    },
    /** A parse tree. */
    tree(accent) {
        const edges = [[260, 44, 150, 100], [260, 44, 370, 100], [150, 100, 100, 156], [150, 100, 200, 156], [370, 100, 320, 156], [370, 100, 420, 156]];
        return `<g stroke="${INK}" stroke-width="2.4" opacity=".55">${edges.map(([x1, y1, x2, y2]) => `<line x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}"/>`).join("")}</g>
            <g fill="${accent}" stroke="${INK}" stroke-width="2.4">
                <circle cx="260" cy="44" r="15"/><circle cx="150" cy="100" r="12"/><circle cx="370" cy="100" r="12"/>
                <circle cx="100" cy="156" r="9"/><circle cx="200" cy="156" r="9"/><circle cx="320" cy="156" r="9"/><circle cx="420" cy="156" r="9"/>
            </g>`;
    },
    /** Rows and columns — data as a set, not a path through pointers. */
    table(accent) {
        const cells = [];
        for (let row = 0; row < 4; row += 1) {
            for (let column = 0; column < 5; column += 1) {
                const filled = (row + column) % 3 === 0;
                cells.push(
                    `<rect x="${58 + column * 82}" y="${44 + row * 30}" width="76" height="24" rx="3"
                        fill="${filled ? accent : "none"}" stroke="${INK}" stroke-width="1.8" opacity="${row === 0 ? 1 : 0.72}"/>`,
                );
            }
        }
        return cells.join("");
    },
    /** Everything reducing to one problem. */
    reduction(accent) {
        const sources = [[70, 52], [70, 104], [70, 156]];
        return `<g stroke="${INK}" stroke-width="2.2" opacity=".6">${sources
            .map(([x, y]) => `<path d="M${x + 46} ${y} C 180 ${y}, 230 104, 300 104" fill="none"/>`)
            .join("")}</g>
            <g fill="none" stroke="${INK}" stroke-width="2.4">${sources.map(([x, y]) => `<rect x="${x}" y="${y - 15}" width="46" height="30" rx="5"/>`).join("")}</g>
            <circle cx="358" cy="104" r="46" fill="${accent}" stroke="${INK}" stroke-width="3"/>
            <text x="358" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="26" fill="${INK}">SAT</text>`;
    },
    /** Packets crossing between two networks. */
    packets(accent, rand) {
        const boxes = Array.from({ length: 7 }, (_, i) => {
            const y = 74 + Math.round(rand() * 56);
            return `<rect x="${46 + i * 62}" y="${y}" width="40" height="26" rx="4" fill="${i % 2 ? accent : PAPER}" stroke="${INK}" stroke-width="2.2"/>`;
        }).join("");
        return `<line x1="30" y1="104" x2="490" y2="104" stroke="${INK}" stroke-width="1.6" stroke-dasharray="7 7" opacity=".5"/>
            <circle cx="30" cy="104" r="13" fill="none" stroke="${INK}" stroke-width="2.6"/>
            <circle cx="490" cy="104" r="13" fill="none" stroke="${INK}" stroke-width="2.6"/>${boxes}`;
    },
    /** Two parties arriving at one secret. */
    keys(accent) {
        return `<g stroke="${INK}" stroke-width="2.6" fill="none">
                <path d="M110 60 C 200 60, 220 148, 300 148"/>
                <path d="M110 148 C 200 148, 220 60, 300 60"/>
            </g>
            <circle cx="110" cy="60" r="20" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
            <circle cx="110" cy="148" r="20" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
            <rect x="330" y="70" width="112" height="68" rx="10" fill="${accent}" stroke="${INK}" stroke-width="3"/>
            <path d="M366 70 v-14 a20 20 0 0 1 40 0 v14" fill="none" stroke="${INK}" stroke-width="3"/>`;
    },
    /** A mesh of documents pointing at each other. */
    web(accent, rand) {
        const nodes = Array.from({ length: 11 }, () => [50 + rand() * 420, 40 + rand() * 130]);
        const links = nodes
            .map((node, i) => {
                const other = nodes[(i * 3 + 1) % nodes.length];
                return `<line x1="${node[0]}" y1="${node[1]}" x2="${other[0]}" y2="${other[1]}"/>`;
            })
            .join("");
        return `<g stroke="${INK}" stroke-width="1.5" opacity=".45">${links}</g>
            <g fill="${accent}" stroke="${INK}" stroke-width="2">${nodes.map(([x, y], i) => `<rect x="${x - 11}" y="${y - 13}" width="22" height="26" rx="3" opacity="${i % 3 ? 0.8 : 1}"/>`).join("")}</g>`;
    },
    /** Rank flowing along links. */
    rank(accent) {
        const bars = [26, 54, 92, 148, 74, 40, 22];
        return `<g>${bars
            .map(
                (height, i) =>
                    `<rect x="${64 + i * 58}" y="${172 - height}" width="40" height="${height}" rx="4" fill="${i === 3 ? accent : PAPER}" stroke="${INK}" stroke-width="2.4"/>`,
            )
            .join("")}</g>
            <line x1="46" y1="174" x2="474" y2="174" stroke="${INK}" stroke-width="2.4"/>`;
    },
    /** An attention matrix. */
    attention(accent, rand) {
        const cells = [];
        for (let row = 0; row < 7; row += 1) {
            for (let column = 0; column < 7; column += 1) {
                const weight = Math.max(0, 1 - Math.abs(row - column) / 3.4) * (0.55 + rand() * 0.45);
                cells.push(
                    `<rect x="${146 + column * 32}" y="${30 + row * 22}" width="28" height="18" rx="3" fill="${accent}" opacity="${weight.toFixed(2)}" stroke="${INK}" stroke-width=".8"/>`,
                );
            }
        }
        return cells.join("");
    },
};

/** Break a title across the cover's two available lines. */
function wrap(text, perLine = 30) {
    const words = text.split(" ");
    const lines = [""];
    for (const word of words) {
        const line = lines[lines.length - 1];
        if (line && `${line} ${word}`.length > perLine) lines.push(word);
        else lines[lines.length - 1] = line ? `${line} ${word}` : word;
    }
    return lines.slice(0, 2);
}

function cover({ id, year, title, accent, motif, seed }) {
    const rand = seeded(seed);
    const lines = wrap(title);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}, ${year}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="0" y="0" width="${W}" height="10" fill="${accent}"/>
    <g transform="translate(0, 12)">${motifs[motif](accent, rand)}</g>
    <g transform="translate(34, 224)">
        <text font-family="ui-monospace, SFMono-Regular, Menlo, monospace" font-size="30" font-weight="700" fill="${INK}" y="0">${year}</text>
        ${lines
            .map(
                (line, index) =>
                    `<text x="112" y="${-11 + index * 16}" font-family="Georgia, 'Times New Roman', serif" font-size="14" fill="${INK}" opacity=".82">${line.replace(/&/g, "&amp;")}</text>`,
            )
            .join("\n        ")}
    </g>
</svg>
`;
}

const COVERS = [
    { id: "turing-1936", year: "1936", title: "On Computable Numbers", accent: "#d9cdfd", motif: "tape", seed: 11 },
    { id: "shannon-1948", year: "1948", title: "A Mathematical Theory of Communication", accent: "#b8d9ff", motif: "signal", seed: 22 },
    { id: "chomsky-1956", year: "1956", title: "Three Models for the Description of Language", accent: "#d9cdfd", motif: "tree", seed: 33 },
    { id: "codd-1970", year: "1970", title: "A Relational Model of Data", accent: "#bfe8cf", motif: "table", seed: 44 },
    { id: "cook-1971", year: "1971", title: "The Complexity of Theorem-Proving Procedures", accent: "#d9cdfd", motif: "reduction", seed: 55 },
    { id: "cerf-kahn-1974", year: "1974", title: "A Protocol for Packet Network Intercommunication", accent: "#ffcbb2", motif: "packets", seed: 66 },
    { id: "diffie-hellman-1976", year: "1976", title: "New Directions in Cryptography", accent: "#f9e293", motif: "keys", seed: 77 },
    { id: "berners-lee-1989", year: "1989", title: "Information Management: A Proposal", accent: "#ffcbb2", motif: "web", seed: 88 },
    { id: "page-brin-1998", year: "1998", title: "The Anatomy of a Search Engine", accent: "#ffcbb2", motif: "rank", seed: 99 },
    { id: "vaswani-2017", year: "2017", title: "Attention Is All You Need", accent: "#d9ff62", motif: "attention", seed: 110 },
];

await mkdir(OUT, { recursive: true });
for (const spec of COVERS) {
    await writeFile(`${OUT}/${spec.id}.svg`, cover(spec), "utf8");
}
console.log(`Wrote ${COVERS.length} covers to public/timeline/cs-papers/`);
