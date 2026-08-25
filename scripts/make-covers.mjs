/**
 * Generates the timeline's cover art.
 *
 * The papers themselves are copyrighted, so the timeline does not reproduce
 * scans — each entry gets a drawn cover that states the year and the title and
 * carries a motif for the idea, and every card links out to the real paper.
 *
 * Run: node scripts/make-covers.mjs
 * Writes: public/timeline/<timeline-id>/<event-id>.svg
 *
 * This is an authoring tool, not part of the deploy path — the generated SVGs
 * are committed and served directly.
 */
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const OUT = resolve(dirname(fileURLToPath(import.meta.url)), "../public/timeline");
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
    reduction(accent, _rand, spec) {
        const sources = [[70, 52], [70, 104], [70, 156]];
        return `<g stroke="${INK}" stroke-width="2.2" opacity=".6">${sources
            .map(([x, y]) => `<path d="M${x + 46} ${y} C 180 ${y}, 230 104, 300 104" fill="none"/>`)
            .join("")}</g>
            <g fill="none" stroke="${INK}" stroke-width="2.4">${sources.map(([x, y]) => `<rect x="${x}" y="${y - 15}" width="46" height="30" rx="5"/>`).join("")}</g>
            <circle cx="358" cy="104" r="46" fill="${accent}" stroke="${INK}" stroke-width="3"/>
            <text x="358" y="112" text-anchor="middle" font-family="Georgia, serif" font-size="24" fill="${INK}">${spec.motifLabel || "SAT"}</text>`;
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
        const nodes = Array.from({ length: 11 }, () => [56 + rand() * 408, 38 + rand() * 112]);
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
    /** Nested braces — a language that gives structure a syntax. */
    braces(accent) {
        const bar = (y, x, w) => `<rect x="${x}" y="${y}" width="${w}" height="9" rx="4" fill="${accent}" stroke="${INK}" stroke-width="2"/>`;
        return `<g fill="none" stroke="${INK}" stroke-width="5" stroke-linecap="round">
                <path d="M132 42 q-20 0 -20 26 t-18 26 q18 0 18 26 t20 26"/>
                <path d="M388 42 q20 0 20 26 t18 26 q-18 0 -18 26 t-20 26"/>
            </g>
            ${bar(58, 156, 190)}${bar(84, 178, 148)}${bar(110, 178, 96)}${bar(136, 156, 164)}`;
    },
    /** Recursion, drawn as a thing that contains itself. */
    spiral(accent) {
        const rings = [0, 1, 2, 3, 4].map((i) => {
            const size = 152 - i * 30;
            return `<rect x="${260 - size / 2}" y="${104 - size / 2}" width="${size}" height="${size}" rx="${10 - i}"
                fill="${i % 2 ? accent : "none"}" stroke="${INK}" stroke-width="2.4" transform="rotate(${i * 9} 260 104)"/>`;
        });
        return rings.join("");
    },
    /** A platter and an arm — random access, finally. */
    disk(accent) {
        const rings = [72, 56, 40, 24].map((r, i) => `<circle cx="260" cy="104" r="${r}" fill="${i === 3 ? accent : "none"}" stroke="${INK}" stroke-width="${i ? 1.6 : 3}" opacity="${i ? 0.6 : 1}"/>`);
        return `${rings.join("")}<circle cx="260" cy="104" r="6" fill="${INK}"/>
            <path d="M430 30 L 320 92" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>
            <circle cx="430" cy="30" r="9" fill="${INK}"/>`;
    },
    /** Columns, read one at a time. */
    columns(accent, rand) {
        return Array.from({ length: 8 }, (_, i) => {
            const filled = i % 3 === 1;
            const height = 40 + Math.round(rand() * 96);
            return `<rect x="${58 + i * 52}" y="${172 - height}" width="38" height="${height}" rx="4"
                fill="${filled ? accent : PAPER}" stroke="${INK}" stroke-width="2.2"/>`;
        }).join("");
    },
    /** A layered network. */
    neuron(accent) {
        const layers = [[3, 96], [5, 208], [4, 320], [2, 432]];
        const nodes = layers.map(([count, x]) =>
            Array.from({ length: count }, (_, i) => ({ x, y: 104 + (i - (count - 1) / 2) * 38 })),
        );
        const edges = nodes
            .slice(0, -1)
            .flatMap((layer, i) => layer.flatMap((a) => nodes[i + 1].map((b) => `<line x1="${a.x}" y1="${a.y}" x2="${b.x}" y2="${b.y}"/>`)))
            .join("");
        return `<g stroke="${INK}" stroke-width="1" opacity=".34">${edges}</g>
            <g fill="${accent}" stroke="${INK}" stroke-width="2.2">${nodes.flat().map((n) => `<circle cx="${n.x}" cy="${n.y}" r="11"/>`).join("")}</g>`;
    },
    /** Racks, humming. */
    racks(accent, rand) {
        return Array.from({ length: 4 }, (_, column) => {
            const units = Array.from({ length: 6 }, (_, row) =>
                `<rect x="${76 + column * 96}" y="${44 + row * 22}" width="72" height="16" rx="3" fill="${rand() > 0.62 ? accent : PAPER}" stroke="${INK}" stroke-width="1.6"/>`,
            ).join("");
            return `<rect x="${70 + column * 96}" y="${36}" width="84" height="144" rx="7" fill="none" stroke="${INK}" stroke-width="2.6"/>${units}`;
        }).join("");
    },
    /** Slabs, one abstraction on the next. */
    stack(accent) {
        return [0, 1, 2, 3].map((i) =>
            `<rect x="${132 + i * 14}" y="${160 - i * 36}" width="${256 - i * 28}" height="28" rx="6"
                fill="${i === 3 ? accent : PAPER}" stroke="${INK}" stroke-width="2.6"/>`,
        ).join("");
    },
    /** Somebody else's computer. */
    cloudlet(accent) {
        return `<g transform="translate(6 -22)">
                <path d="M158 140 a34 34 0 0 1 4 -67 a44 44 0 0 1 84 -14 a38 38 0 0 1 56 24 a30 30 0 0 1 -6 57 z"
                    fill="${accent}" stroke="${INK}" stroke-width="3"/>
                <g fill="none" stroke="${INK}" stroke-width="2.4">
                    <line x1="200" y1="140" x2="200" y2="166"/><line x1="256" y1="140" x2="256" y2="166"/><line x1="312" y1="140" x2="312" y2="166"/>
                </g>
                <g fill="${PAPER}" stroke="${INK}" stroke-width="2.4">
                    <rect x="180" y="166" width="40" height="24" rx="4"/><rect x="236" y="166" width="40" height="24" rx="4"/><rect x="292" y="166" width="40" height="24" rx="4"/>
                </g>
            </g>`;
    },
    /** Stages, each handing on to the next. */
    pipeline(accent) {
        return [0, 1, 2, 3].map((i) => {
            const x = 62 + i * 108;
            const arrow = i < 3 ? `<path d="M${x + 82} 104 h 18 m -7 -6 l 7 6 l -7 6" fill="none" stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>` : "";
            return `<rect x="${x}" y="${74}" width="82" height="60" rx="9" fill="${i % 2 ? accent : PAPER}" stroke="${INK}" stroke-width="2.6"/>${arrow}`;
        }).join("");
    },
    /** Slices of a shared hour. */
    clockface(accent) {
        const wedges = [0, 1, 2, 3, 4, 5].map((i) => {
            const a0 = (i / 6) * Math.PI * 2 - Math.PI / 2;
            const a1 = ((i + 1) / 6) * Math.PI * 2 - Math.PI / 2;
            const p = (a) => `${(260 + Math.cos(a) * 74).toFixed(1)} ${(104 + Math.sin(a) * 74).toFixed(1)}`;
            return `<path d="M260 104 L ${p(a0)} A 74 74 0 0 1 ${p(a1)} Z" fill="${i % 2 ? accent : PAPER}" stroke="${INK}" stroke-width="2.2"/>`;
        });
        return `${wedges.join("")}<circle cx="260" cy="104" r="7" fill="${INK}"/>`;
    },
    /** An image, built up layer by layer. */
    layers(accent) {
        return [0, 1, 2, 3, 4].map((i) =>
            `<g transform="translate(0 ${168 - i * 30})">
                <path d="M180 0 l80 -26 l80 26 l-80 26 z" fill="${i === 4 ? accent : PAPER}" stroke="${INK}" stroke-width="2.4"/>
            </g>`,
        ).join("");
    },
    /** A wheel, and someone steering. */
    helm(accent) {
        const spokes = [0, 1, 2, 3, 4, 5].map((i) => {
            const a = (i / 6) * Math.PI * 2;
            return `<line x1="${260 + Math.cos(a) * 26}" y1="${104 + Math.sin(a) * 26}" x2="${260 + Math.cos(a) * 88}" y2="${104 + Math.sin(a) * 88}"/>`;
        }).join("");
        return `<circle cx="260" cy="104" r="64" fill="${accent}" stroke="${INK}" stroke-width="3"/>
            <circle cx="260" cy="104" r="26" fill="${PAPER}" stroke="${INK}" stroke-width="3"/>
            <g stroke="${INK}" stroke-width="5" stroke-linecap="round">${spokes}</g>`;
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

function cover(spec) {
    const { year, title, accent, seed } = spec;
    const rand = seeded(seed);
    const lines = wrap(title);
    return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" role="img" aria-label="${title}, ${year}">
    <rect width="${W}" height="${H}" fill="${PAPER}"/>
    <rect x="0" y="0" width="${W}" height="10" fill="${accent}"/>
    <g transform="translate(0, 12)">${motifs[spec.motif](accent, rand, spec)}</g>
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

const LAVENDER = "#d9cdfd";
const BLUE = "#b8d9ff";
const PEACH = "#ffcbb2";
const YELLOW = "#f9e293";
const MINT = "#bfe8cf";
const ACID = "#d9ff62";

/**
 * One entry per main-rail card, grouped by timeline. Sub-timeline entries use
 * glyph media instead — a descendant should read as a footnote to its parent,
 * not compete with it.
 *
 * Within a timeline no motif repeats, so a rail never looks like it is saying
 * the same thing twice.
 */
const SETS = {
    "cs-papers": [
        { id: "turing-1936", year: "1936", title: "On Computable Numbers", accent: LAVENDER, motif: "tape", seed: 11 },
        { id: "shannon-1948", year: "1948", title: "A Mathematical Theory of Communication", accent: BLUE, motif: "signal", seed: 22 },
        { id: "chomsky-1956", year: "1956", title: "Three Models for the Description of Language", accent: LAVENDER, motif: "tree", seed: 33 },
        { id: "codd-1970", year: "1970", title: "A Relational Model of Data", accent: MINT, motif: "table", seed: 44 },
        { id: "cook-1971", year: "1971", title: "The Complexity of Theorem-Proving Procedures", accent: LAVENDER, motif: "reduction", seed: 55 },
        { id: "cerf-kahn-1974", year: "1974", title: "A Protocol for Packet Network Intercommunication", accent: PEACH, motif: "packets", seed: 66 },
        { id: "diffie-hellman-1976", year: "1976", title: "New Directions in Cryptography", accent: YELLOW, motif: "keys", seed: 77 },
        { id: "berners-lee-1989", year: "1989", title: "Information Management: A Proposal", accent: PEACH, motif: "web", seed: 88 },
        { id: "page-brin-1998", year: "1998", title: "The Anatomy of a Search Engine", accent: PEACH, motif: "rank", seed: 99 },
        { id: "vaswani-2017", year: "2017", title: "Attention Is All You Need", accent: ACID, motif: "attention", seed: 110 },
    ],
    languages: [
        { id: "fortran-1957", year: "1957", title: "Fortran", accent: BLUE, motif: "table", seed: 201 },
        { id: "lisp-1958", year: "1958", title: "Lisp", accent: LAVENDER, motif: "spiral", seed: 202 },
        { id: "cobol-1959", year: "1959", title: "COBOL", accent: MINT, motif: "columns", seed: 203 },
        { id: "algol-1960", year: "1960", title: "ALGOL 60", accent: LAVENDER, motif: "tree", seed: 204 },
        { id: "c-1972", year: "1972", title: "C", accent: BLUE, motif: "braces", seed: 205 },
        { id: "smalltalk-1980", year: "1980", title: "Smalltalk-80", accent: PEACH, motif: "web", seed: 206 },
        { id: "python-1991", year: "1991", title: "Python", accent: MINT, motif: "pipeline", seed: 207 },
        { id: "java-1995", year: "1995", title: "Java", accent: PEACH, motif: "stack", seed: 208 },
        { id: "javascript-1995", year: "1995", title: "JavaScript", accent: YELLOW, motif: "reduction", motifLabel: "JS", seed: 209 },
        { id: "rust-2010", year: "2010", title: "Rust", accent: YELLOW, motif: "keys", seed: 210 },
    ],
    "data-storage": [
        { id: "ramac-1956", year: "1956", title: "IBM 350 RAMAC", accent: PEACH, motif: "disk", seed: 301 },
        { id: "ims-1968", year: "1968", title: "IMS", accent: PEACH, motif: "tree", seed: 302 },
        { id: "relational-1970", year: "1970", title: "The Relational Model", accent: MINT, motif: "table", seed: 303 },
        { id: "oracle-1979", year: "1979", title: "Oracle V2", accent: MINT, motif: "keys", seed: 304 },
        { id: "warehouse-1992", year: "1992", title: "The Data Warehouse", accent: LAVENDER, motif: "racks", seed: 305 },
        { id: "hadoop-2006", year: "2006", title: "Hadoop", accent: BLUE, motif: "stack", seed: 306 },
        { id: "dynamo-2007", year: "2007", title: "Dynamo", accent: BLUE, motif: "web", seed: 307 },
        { id: "parquet-2013", year: "2013", title: "Parquet", accent: ACID, motif: "columns", seed: 308 },
        { id: "snowflake-2014", year: "2014", title: "Separating Storage and Compute", accent: LAVENDER, motif: "cloudlet", seed: 309 },
        { id: "lakehouse-2017", year: "2017", title: "Open Table Formats", accent: ACID, motif: "pipeline", seed: 310 },
    ],
    "machine-learning": [
        { id: "mcculloch-pitts-1943", year: "1943", title: "A Logical Calculus of Nervous Activity", accent: ACID, motif: "neuron", seed: 401 },
        { id: "turing-test-1950", year: "1950", title: "Computing Machinery and Intelligence", accent: LAVENDER, motif: "web", seed: 402 },
        { id: "perceptron-1958", year: "1958", title: "The Perceptron", accent: ACID, motif: "signal", seed: 403 },
        { id: "perceptrons-1969", year: "1969", title: "Perceptrons", accent: LAVENDER, motif: "table", seed: 404 },
        { id: "backprop-1986", year: "1986", title: "Learning Representations by Back-Propagating Errors", accent: ACID, motif: "pipeline", seed: 405 },
        { id: "lenet-1998", year: "1998", title: "LeNet-5", accent: ACID, motif: "stack", seed: 406 },
        { id: "imagenet-2009", year: "2009", title: "ImageNet", accent: MINT, motif: "columns", seed: 407 },
        { id: "alexnet-2012", year: "2012", title: "AlexNet", accent: ACID, motif: "racks", seed: 408 },
        { id: "ml-transformer-2017", year: "2017", title: "The Transformer", accent: ACID, motif: "attention", seed: 409 },
        { id: "alphafold-2021", year: "2021", title: "AlphaFold 2", accent: BLUE, motif: "spiral", seed: 410 },
    ],
    infrastructure: [
        { id: "system360-1964", year: "1964", title: "IBM System/360", accent: PEACH, motif: "columns", seed: 501 },
        { id: "cp67-1968", year: "1968", title: "CP-67 and the Virtual Machine", accent: BLUE, motif: "clockface", seed: 502 },
        { id: "unix-1969", year: "1969", title: "UNIX", accent: LAVENDER, motif: "tree", seed: 503 },
        { id: "ethernet-1973", year: "1973", title: "Ethernet", accent: PEACH, motif: "packets", seed: 504 },
        { id: "linux-1991", year: "1991", title: "Linux", accent: LAVENDER, motif: "braces", seed: 505 },
        { id: "vmware-2001", year: "2001", title: "VMware ESX", accent: BLUE, motif: "stack", seed: 506 },
        { id: "aws-2006", year: "2006", title: "S3 and EC2", accent: MINT, motif: "cloudlet", seed: 507 },
        { id: "docker-2013", year: "2013", title: "Docker", accent: MINT, motif: "layers", seed: 508 },
        { id: "kubernetes-2014", year: "2014", title: "Kubernetes", accent: BLUE, motif: "helm", seed: 509 },
        { id: "lambda-2014", year: "2014", title: "AWS Lambda", accent: YELLOW, motif: "pipeline", seed: 510 },
    ],
};

let written = 0;
for (const [set, specs] of Object.entries(SETS)) {
    const dir = `${OUT}/${set}`;
    await mkdir(dir, { recursive: true });
    const seen = new Set();
    for (const spec of specs) {
        if (!motifs[spec.motif]) throw new Error(`${set}/${spec.id}: unknown motif "${spec.motif}"`);
        if (seen.has(spec.motif)) throw new Error(`${set}: motif "${spec.motif}" used twice`);
        seen.add(spec.motif);
        await writeFile(`${dir}/${spec.id}.svg`, cover(spec), "utf8");
        written += 1;
    }
}
console.log(`Wrote ${written} covers across ${Object.keys(SETS).length} timelines.`);
