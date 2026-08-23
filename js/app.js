/**
 * Patternbook knowledge atlas.
 * Static, dependency-free, and intentionally free of progress tracking.
 */

const { tracks, topics } = window.PATTERNBOOK;
const atlas = window.PATTERNBOOK_ATLAS;

const elements = {
    body: document.body,
    overviewView: document.getElementById("overview-view"),
    domainView: document.getElementById("domain-view"),
    guidesView: document.getElementById("guides-view"),
    domainNavigation: document.getElementById("domain-navigation"),
    overviewMap: document.getElementById("overview-map"),
    domainGrid: document.getElementById("domain-grid"),
    featuredGuides: document.getElementById("featured-guides"),
    search: document.getElementById("global-search"),
    domainHeader: document.getElementById("domain-header"),
    principleStrip: document.getElementById("principle-strip"),
    domainGraph: document.getElementById("domain-graph"),
    conceptInspector: document.getElementById("concept-inspector"),
    clusterIndex: document.getElementById("cluster-index"),
    domainGuides: document.getElementById("domain-guides"),
    domainFilters: document.getElementById("domain-filters"),
    guideLibrary: document.getElementById("guide-library"),
    libraryEyebrow: document.getElementById("library-eyebrow"),
    guideLibraryTitle: document.getElementById("guide-library-title"),
    libraryDescription: document.getElementById("library-description"),
    libraryCount: document.getElementById("library-count"),
    emptyState: document.getElementById("empty-state"),
    topicDialog: document.getElementById("topic-dialog"),
    dialogContent: document.getElementById("dialog-content"),
    toast: document.getElementById("toast")
};

let activeView = "overview";
let activeDomain = tracks[0].id;
let activeFilter = "all";
let activeGraphNode = "root";
let toastTimer;
let openGuideToken = 0;

const guideBodyCache = new Map();
const guideText = new Map();

function stripHtml(html) {
    const container = document.createElement("div");
    container.innerHTML = html;
    return container.textContent || "";
}

function fetchGuideBody(topic) {
    if (guideBodyCache.has(topic.id)) return Promise.resolve(guideBodyCache.get(topic.id));
    return fetch(topic.bodyUrl)
        .then((response) => {
            if (!response.ok) throw new Error(`${response.status} fetching ${topic.bodyUrl}`);
            return response.text();
        })
        .then((html) => {
            guideBodyCache.set(topic.id, html);
            return html;
        });
}

async function preloadGuideBodies() {
    const settled = await Promise.allSettled(topics.map((topic) => fetchGuideBody(topic)));
    settled.forEach((result, index) => {
        const topic = topics[index];
        guideText.set(topic.id, result.status === "fulfilled" ? stripHtml(result.value) : "");
    });
    if (elements.search.value.trim() && activeView === "guides") renderGuideLibrary();
}

function escapeHtml(value = "") {
    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

function getTrack(trackId) {
    return tracks.find((track) => track.id === trackId);
}

function getDomain(trackId) {
    return atlas.domains[trackId];
}

function getGuide(guideId) {
    return topics.find((topic) => topic.id === guideId);
}

function getDomainGuides(trackId) {
    return topics.filter((topic) => topic.track === trackId);
}

function flattenDomain(trackId) {
    const domain = getDomain(trackId);
    const flat = [];
    domain.clusters.forEach((cluster) => {
        flat.push({ ...cluster, kind: "cluster", clusterId: cluster.id });
        cluster.nodes.forEach((node) => flat.push({ ...node, kind: node.guide ? "guide" : "concept", clusterId: cluster.id, clusterLabel: cluster.label }));
    });
    return flat;
}

function findGraphNode(trackId, nodeId) {
    if (nodeId === "root") return { id: "root", kind: "root", label: getTrack(trackId).name, summary: getDomain(trackId).thesis };
    return flattenDomain(trackId).find((node) => node.id === nodeId);
}

function findGuideLocation(guideId) {
    for (const track of tracks) {
        for (const cluster of getDomain(track.id).clusters) {
            const node = cluster.nodes.find((candidate) => candidate.guide === guideId);
            if (node) return { track, cluster, node };
        }
    }
    return null;
}

function renderNavigation() {
    elements.domainNavigation.innerHTML = tracks.map((track) => `
        <button class="nav-item" type="button" data-domain="${escapeHtml(track.id)}">
            <span class="nav-symbol">${escapeHtml(track.mark)}</span>
            <span>${escapeHtml(track.shortName)}</span>
        </button>
    `).join("");
}

function renderOverviewMap() {
    const positions = [
        { x: 50, y: 12 },
        { x: 84, y: 38 },
        { x: 71, y: 80 },
        { x: 29, y: 80 },
        { x: 16, y: 38 }
    ];
    const center = { x: 50, y: 50 };
    const crossLinks = [[0, 1], [0, 4], [1, 3], [2, 3], [2, 4]];
    const line = (from, to, className = "") => `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}" class="${className}" />`;

    elements.overviewMap.innerHTML = `
        <div class="overview-map__canvas">
            <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
                ${positions.map((position) => line(center, position)).join("")}
                ${crossLinks.map(([a, b]) => line(positions[a], positions[b], "bridge-line")).join("")}
            </svg>
            <div class="overview-root" style="--x: 50%; --y: 50%">
                <span>Root domain</span>
                <strong>${escapeHtml(atlas.root.title)}</strong>
            </div>
            ${tracks.map((track, index) => {
                const domain = getDomain(track.id);
                const conceptCount = domain.clusters.reduce((total, cluster) => total + cluster.nodes.length, 0);
                return `
                    <button class="overview-node" type="button" data-domain="${escapeHtml(track.id)}" style="--x: ${positions[index].x}%; --y: ${positions[index].y}%; --node-color: ${track.color}">
                        <span>${escapeHtml(track.mark)}</span>
                        <strong>${escapeHtml(track.shortName)}</strong>
                        <small>${domain.clusters.length} clusters · ${conceptCount} concepts</small>
                    </button>
                `;
            }).join("")}
            <div class="bridge-label bridge-label--one">platforms</div>
            <div class="bridge-label bridge-label--two">problem solving</div>
            <div class="bridge-label bridge-label--three">distributed systems</div>
        </div>
    `;
}

function renderDomainGrid() {
    elements.domainGrid.innerHTML = tracks.map((track) => {
        const domain = getDomain(track.id);
        const conceptCount = domain.clusters.reduce((total, cluster) => total + cluster.nodes.length, 0);
        return `
            <button class="domain-card" type="button" data-domain="${escapeHtml(track.id)}" style="--domain-color: ${track.color}">
                <span class="domain-card__top"><i>${escapeHtml(track.mark)}</i><b>↗</b></span>
                <h3>${escapeHtml(track.name)}</h3>
                <p>${escapeHtml(domain.thesis)}</p>
                <span class="domain-card__meta">${domain.clusters.length} clusters · ${conceptCount} connected concepts</span>
            </button>
        `;
    }).join("");
}

function renderGuideCard(topic) {
    const track = getTrack(topic.track);
    const location = findGuideLocation(topic.id);
    return `
        <button class="guide-card" type="button" data-guide="${escapeHtml(topic.id)}" style="--guide-color: ${track.color}">
            <span class="guide-card__meta">
                <i>${escapeHtml(track.mark)}</i>
                <span>${escapeHtml(location?.cluster.label || topic.type)}</span>
            </span>
            <h3>${escapeHtml(topic.title)}</h3>
            <p>${escapeHtml(topic.summary)}</p>
            <span class="guide-card__footer"><span>${escapeHtml(topic.type)}</span><b>Read guide →</b></span>
        </button>
    `;
}

function renderFeaturedGuides() {
    // One row, no dangling gap: the guide-grid is 3 columns, so cap at 3
    // rather than one-per-track (5), which left an unfinished-looking
    // partial second row. "View every guide" covers the rest.
    const featured = tracks.slice(0, 3).flatMap((track) => getDomainGuides(track.id).slice(0, 1));
    elements.featuredGuides.innerHTML = featured.map(renderGuideCard).join("");
}

function setView(view, options = {}) {
    activeView = view;
    elements.overviewView.classList.toggle("hidden", view !== "overview");
    elements.domainView.classList.toggle("hidden", view !== "domain");
    elements.guidesView.classList.toggle("hidden", view !== "guides");

    if (view === "domain") {
        activeDomain = options.domain || activeDomain;
        activeGraphNode = options.concept || "root";
        elements.search.value = "";
        renderDomain();
    } else if (view === "guides") {
        if (options.filter) activeFilter = options.filter;
        renderGuideLibrary();
    } else {
        elements.search.value = "";
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
        const activeOverview = view === "overview" && item.dataset.view === "overview";
        const activeGuides = view === "guides" && item.dataset.view === "guides";
        const activeDomainItem = view === "domain" && item.dataset.domain === activeDomain;
        item.classList.toggle("active", activeOverview || activeGuides || activeDomainItem);
    });

    closeSidebar();
    if (!options.noScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDomain() {
    const track = getTrack(activeDomain);
    const domain = getDomain(activeDomain);
    const conceptCount = domain.clusters.reduce((total, cluster) => total + cluster.nodes.length, 0);

    elements.domainHeader.innerHTML = `
        <div>
            <p class="eyebrow">Domain map · ${escapeHtml(track.mark)}</p>
            <h1 id="domain-title">${escapeHtml(track.name)}</h1>
            <p>${escapeHtml(domain.thesis)}</p>
        </div>
        <div class="domain-summary" style="--domain-color: ${track.color}">
            <strong>${domain.clusters.length}</strong><span>concept clusters</span>
            <strong>${conceptCount}</strong><span>key concepts</span>
            <strong>${getDomainGuides(activeDomain).length}</strong><span>detailed guides</span>
        </div>
    `;
    elements.principleStrip.innerHTML = domain.principles.map((principle, index) => `<span><i>0${index + 1}</i>${escapeHtml(principle)}</span>`).join("");
    renderGraph();
    renderClusterIndex();
    elements.domainGuides.innerHTML = getDomainGuides(activeDomain).map(renderGuideCard).join("");
}

function graphGeometry() {
    const domain = getDomain(activeDomain);
    const center = { x: 480, y: 350 };
    const clusters = [];
    const concepts = [];
    const links = [];

    domain.clusters.forEach((cluster, clusterIndex) => {
        const angle = -Math.PI / 2 + (clusterIndex / domain.clusters.length) * Math.PI * 2;
        const clusterNode = {
            id: cluster.id,
            kind: "cluster",
            x: center.x + Math.cos(angle) * 175,
            y: center.y + Math.sin(angle) * 175,
            data: cluster
        };
        clusters.push(clusterNode);
        links.push({ source: "root", target: cluster.id, kind: "branch" });

        cluster.nodes.forEach((concept, conceptIndex) => {
            const spread = (conceptIndex - (cluster.nodes.length - 1) / 2) * 0.24;
            const conceptAngle = angle + spread;
            const conceptNode = {
                id: concept.id,
                kind: concept.guide ? "guide" : "concept",
                x: center.x + Math.cos(conceptAngle) * 310,
                y: center.y + Math.sin(conceptAngle) * 310,
                data: concept,
                clusterId: cluster.id
            };
            concepts.push(conceptNode);
            links.push({ source: cluster.id, target: concept.id, kind: "detail" });
        });
    });

    return {
        nodes: [{ id: "root", kind: "root", x: center.x, y: center.y, data: { label: getTrack(activeDomain).name } }, ...clusters, ...concepts],
        links,
        center
    };
}

function shortLabel(label, limit = 22) {
    return label.length > limit ? `${label.slice(0, limit - 1)}…` : label;
}

// Concept/cluster labels are plain horizontal <text>, so a node sitting near
// the vertical axis of the circle (top or bottom of the layout) has almost no
// horizontal separation from its neighbors no matter how far apart they are
// angularly — that's what caused label collisions. Flowing the label away
// from the node (left/right beside it off-axis, above/below on-axis) instead
// of centering it fixes that without a full radial-label rewrite.
function labelPlacement(node, center, bodyRadius) {
    if (node.kind === "root") return { anchor: "middle", x: 0, y: 5 };
    const dx = node.x - center.x;
    const onAxis = Math.abs(dx) < bodyRadius + 34;
    if (onAxis) {
        const dy = node.y - center.y;
        const y = dy >= 0 ? bodyRadius + 21 : -(bodyRadius + 13);
        return { anchor: "middle", x: 0, y };
    }
    const anchor = dx > 0 ? "start" : "end";
    return { anchor, x: dx > 0 ? bodyRadius + 9 : -(bodyRadius + 9), y: 4 };
}

function renderGraph() {
    const track = getTrack(activeDomain);
    const graph = graphGeometry();
    const selected = graph.nodes.find((node) => node.id === activeGraphNode) || graph.nodes[0];
    const connected = new Set([selected.id]);
    graph.links.forEach((link) => {
        if (link.source === selected.id) connected.add(link.target);
        if (link.target === selected.id) connected.add(link.source);
    });
    if (selected.kind === "root") graph.nodes.filter((node) => node.kind === "cluster").forEach((node) => connected.add(node.id));

    const lineMarkup = graph.links.map((link) => {
        const source = graph.nodes.find((node) => node.id === link.source);
        const target = graph.nodes.find((node) => node.id === link.target);
        const isActive = connected.has(source.id) && connected.has(target.id);
        return `<line x1="${source.x}" y1="${source.y}" x2="${target.x}" y2="${target.y}" class="graph-link graph-link--${link.kind} ${isActive ? "is-active" : "is-muted"}" />`;
    }).join("");

    const nodeMarkup = graph.nodes.map((node) => {
        const isSelected = node.id === selected.id;
        const isMuted = selected.kind !== "root" && !connected.has(node.id);
        const label = node.data.label;
        const bodyRadius = node.kind === "root" ? 56 : node.kind === "cluster" ? 28 : 12;
        const charLimit = node.kind === "root" ? 24 : node.kind === "cluster" ? 19 : 16;
        const placement = labelPlacement(node, graph.center, bodyRadius);
        const body = node.kind === "root"
            ? `<circle r="56" class="graph-node__body" /><circle r="64" class="graph-node__orbit" />`
            : node.kind === "cluster"
                ? `<circle r="28" class="graph-node__body" />`
                : node.kind === "guide"
                    ? `<rect x="-12" y="-12" width="24" height="24" rx="5" class="graph-node__body" />`
                    : `<circle r="11" class="graph-node__body" />`;
        return `
            <g class="graph-node graph-node--${node.kind} ${isSelected ? "is-selected" : ""} ${isMuted ? "is-muted" : ""}"
               transform="translate(${node.x} ${node.y})" data-graph-node="${escapeHtml(node.id)}" role="button" tabindex="0" aria-label="Explore ${escapeHtml(label)}">
                <circle r="${bodyRadius + 15}" class="graph-node__hit-area" />
                ${body}
                <text text-anchor="${placement.anchor}" x="${placement.x}" y="${placement.y}" class="graph-node__label">${escapeHtml(shortLabel(label, charLimit))}</text>
            </g>
        `;
    }).join("");

    elements.domainGraph.style.setProperty("--graph-color", track.color);
    elements.domainGraph.innerHTML = `<g class="graph-links">${lineMarkup}</g><g class="graph-nodes">${nodeMarkup}</g>`;
    elements.domainGraph.setAttribute("aria-label", `${track.name} knowledge graph`);

    elements.domainGraph.querySelectorAll("[data-graph-node]").forEach((node) => {
        const select = () => selectGraphNode(node.dataset.graphNode);
        node.addEventListener("click", select);
        node.addEventListener("keydown", (event) => {
            if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                select();
            }
        });
    });

    renderConceptInspector(selected.id);
}

function selectGraphNode(nodeId) {
    activeGraphNode = nodeId;
    renderGraph();
    const hash = new URLSearchParams({ domain: activeDomain, concept: activeGraphNode });
    history.replaceState(null, "", `#${hash.toString()}`);
}

function renderConceptInspector(nodeId) {
    const track = getTrack(activeDomain);
    const domain = getDomain(activeDomain);
    const node = findGraphNode(activeDomain, nodeId) || findGraphNode(activeDomain, "root");

    if (node.kind === "root") {
        elements.conceptInspector.innerHTML = `
            <span class="inspector-type">Domain</span>
            <h3>${escapeHtml(track.name)}</h3>
            <p>${escapeHtml(domain.thesis)}</p>
            <div class="inspector-connections"><span>Direct branches</span>${domain.clusters.map((cluster) => `<button type="button" data-concept="${escapeHtml(cluster.id)}">${escapeHtml(cluster.label)}</button>`).join("")}</div>
        `;
        return;
    }

    if (node.kind === "cluster") {
        const cluster = domain.clusters.find((candidate) => candidate.id === node.id);
        elements.conceptInspector.innerHTML = `
            <span class="inspector-type">Concept cluster</span>
            <h3>${escapeHtml(cluster.label)}</h3>
            <p>${escapeHtml(cluster.summary)}</p>
            <div class="inspector-connections"><span>Connected concepts</span>${cluster.nodes.map((concept) => `<button type="button" data-concept="${escapeHtml(concept.id)}">${escapeHtml(concept.label)}</button>`).join("")}</div>
        `;
        return;
    }

    elements.conceptInspector.innerHTML = `
        <span class="inspector-type">${node.guide ? "Concept + detailed guide" : "Key concept"}</span>
        <h3>${escapeHtml(node.label)}</h3>
        <p>${escapeHtml(node.summary)}</p>
        <div class="concept-path"><span>${escapeHtml(track.shortName)}</span><i>→</i><span>${escapeHtml(node.clusterLabel)}</span><i>→</i><strong>${escapeHtml(node.label)}</strong></div>
        ${node.guide ? `<button class="primary-button inspector-guide" type="button" data-guide="${escapeHtml(node.guide)}">Open detailed guide <span>→</span></button>` : `<p class="inspector-note">This node is part of the approved graph structure; a dedicated guide can be added without changing its place in the atlas.</p>`}
    `;
}

function renderClusterIndex() {
    const domain = getDomain(activeDomain);
    elements.clusterIndex.innerHTML = domain.clusters.map((cluster, index) => `
        <article class="cluster-card">
            <button type="button" data-concept="${escapeHtml(cluster.id)}">
                <span>0${index + 1}</span>
                <h3>${escapeHtml(cluster.label)}</h3>
                <p>${escapeHtml(cluster.summary)}</p>
            </button>
            <ul>${cluster.nodes.map((node) => `<li><button type="button" data-concept="${escapeHtml(node.id)}"><i class="${node.guide ? "has-guide" : ""}"></i>${escapeHtml(node.label)}${node.guide ? "<span>guide</span>" : ""}</button></li>`).join("")}</ul>
        </article>
    `).join("");
}

function renderDomainFilters() {
    elements.domainFilters.innerHTML = `
        <button class="domain-filter ${activeFilter === "all" ? "active" : ""}" type="button" data-filter="all">All domains</button>
        ${tracks.map((track) => `<button class="domain-filter ${activeFilter === track.id ? "active" : ""}" type="button" data-filter="${escapeHtml(track.id)}">${escapeHtml(track.shortName)}</button>`).join("")}
    `;
}

function searchKnowledge(query) {
    const term = query.trim().toLowerCase();
    const guideResults = topics.filter((topic) => {
        if (activeFilter !== "all" && topic.track !== activeFilter) return false;
        if (!term) return true;
        const location = findGuideLocation(topic.id);
        const haystack = [topic.title, topic.summary, topic.type, ...(topic.tags || []), location?.cluster.label, guideText.get(topic.id) || ""].join(" ").toLowerCase();
        return haystack.includes(term);
    });
    const conceptResults = [];
    if (term) {
        tracks.forEach((track) => {
            if (activeFilter !== "all" && track.id !== activeFilter) return;
            flattenDomain(track.id)
                .filter((node) => node.kind !== "cluster" && [node.label, node.summary, node.clusterLabel, track.name].join(" ").toLowerCase().includes(term))
                .forEach((node) => conceptResults.push({ ...node, track }));
        });
    }
    return { guideResults, conceptResults };
}

function renderConceptResult(result) {
    return `
        <button class="guide-card concept-result" type="button" data-domain="${escapeHtml(result.track.id)}" data-concept="${escapeHtml(result.id)}" style="--guide-color: ${result.track.color}">
            <span class="guide-card__meta"><i>${escapeHtml(result.track.mark)}</i><span>Concept · ${escapeHtml(result.clusterLabel)}</span></span>
            <h3>${escapeHtml(result.label)}</h3>
            <p>${escapeHtml(result.summary)}</p>
            <span class="guide-card__footer"><span>Knowledge graph node</span><b>View in map →</b></span>
        </button>
    `;
}

function renderGuideLibrary() {
    const query = elements.search.value.trim();
    const { guideResults, conceptResults } = searchKnowledge(query);
    const total = guideResults.length + conceptResults.length;
    const track = activeFilter === "all" ? null : getTrack(activeFilter);

    elements.libraryEyebrow.textContent = query ? "Search across the atlas" : "Detailed knowledge base";
    elements.guideLibraryTitle.textContent = query ? `“${query}”` : track ? `${track.shortName} guides` : "All guides";
    elements.libraryDescription.textContent = query
        ? "Results include both graph concepts and detailed applied guides."
        : track
            ? getDomain(track.id).thesis
            : "Applied explanations that connect concepts to representative problems and implementation patterns.";
    elements.libraryCount.textContent = `${total} result${total === 1 ? "" : "s"}`;
    renderDomainFilters();
    elements.guideLibrary.innerHTML = `${conceptResults.map(renderConceptResult).join("")}${guideResults.map(renderGuideCard).join("")}`;
    elements.guideLibrary.classList.toggle("hidden", total === 0);
    elements.emptyState.classList.toggle("hidden", total !== 0);
}

function relatedGuides(topic) {
    return topics
        .filter((candidate) => candidate.id !== topic.id)
        .map((candidate) => {
            const sharedTags = (candidate.tags || []).filter((tag) => (topic.tags || []).includes(tag)).length;
            return { candidate, score: sharedTags * 2 + (candidate.track === topic.track ? 1 : 0) };
        })
        .filter(({ score }) => score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, 3)
        .map(({ candidate }) => candidate);
}

async function openGuide(guideId, options = {}) {
    const topic = getGuide(guideId);
    if (!topic) return;
    const token = ++openGuideToken;
    const track = getTrack(topic.track);
    const location = findGuideLocation(topic.id);
    const related = relatedGuides(topic);

    elements.dialogContent.innerHTML = `
        <div class="dialog-hero" style="--topic-color: ${track.color}">
            <p class="eyebrow">${escapeHtml(track.name)} · ${escapeHtml(location?.cluster.label || topic.type)}</p>
            <h1>${escapeHtml(topic.title)}</h1>
            <p>${escapeHtml(topic.summary)}</p>
            <div class="dialog-meta">${(topic.tags || []).slice(0, 5).map((tag) => `<span>${escapeHtml(tag)}</span>`).join("")}</div>
        </div>
        <div class="dialog-body">
            ${location ? `<button class="graph-location" type="button" data-domain="${escapeHtml(track.id)}" data-concept="${escapeHtml(location.node.id)}"><span>Graph location</span><strong>${escapeHtml(track.shortName)} → ${escapeHtml(location.cluster.label)} → ${escapeHtml(location.node.label)}</strong><i>View in map ↗</i></button>` : ""}
            <div class="guide-content-slot" data-state="loading">
                <p class="guide-loading">Loading guide…</p>
            </div>
            ${related.length ? `<div class="related-guides"><span>Connected guides</span><div>${related.map((guide) => `<button type="button" data-guide="${escapeHtml(guide.id)}">${escapeHtml(guide.title)} <i>→</i></button>`).join("")}</div></div>` : ""}
        </div>
    `;

    if (!elements.topicDialog.open) elements.topicDialog.showModal();
    if (!options.fromHash) history.replaceState(null, "", `#guide=${encodeURIComponent(topic.id)}`);

    const slot = elements.dialogContent.querySelector(".guide-content-slot");
    try {
        const html = await fetchGuideBody(topic);
        if (token !== openGuideToken) return;
        slot.dataset.state = "ready";
        slot.innerHTML = html;
    } catch (error) {
        if (token !== openGuideToken) return;
        slot.dataset.state = "error";
        slot.innerHTML = `<p class="guide-error">This guide could not be loaded right now. Try again shortly.</p>`;
    }
}

function closeGuide() {
    if (elements.topicDialog.open) elements.topicDialog.close();
    if (location.hash.startsWith("#guide=")) history.replaceState(null, "", `${location.pathname}${location.search}`);
}

async function copyCode(button) {
    const codeElement = button.closest(".code-panel")?.querySelector("pre code");
    if (!codeElement) return;
    try {
        await navigator.clipboard.writeText(codeElement.textContent);
        showToast("Code copied.");
    } catch (error) {
        showToast("Copy was blocked by the browser.");
    }
}

function showToast(message) {
    clearTimeout(toastTimer);
    elements.toast.textContent = message;
    elements.toast.classList.add("visible");
    toastTimer = setTimeout(() => elements.toast.classList.remove("visible"), 1800);
}

function openSidebar() {
    elements.body.classList.add("sidebar-open");
}

function closeSidebar() {
    elements.body.classList.remove("sidebar-open");
}

function setupEvents() {
    document.addEventListener("click", (event) => {
        const viewButton = event.target.closest("[data-view]");
        const domainButton = event.target.closest("[data-domain]");
        const conceptButton = event.target.closest("[data-concept]");
        const guideButton = event.target.closest("[data-guide]");
        const filterButton = event.target.closest("[data-filter]");
        const copyButton = event.target.closest("[data-copy-code]");

        if (viewButton) setView(viewButton.dataset.view === "guides" ? "guides" : "overview");
        if (domainButton) {
            if (elements.topicDialog.open) closeGuide();
            setView("domain", { domain: domainButton.dataset.domain, concept: conceptButton?.dataset.concept || "root" });
        } else if (conceptButton && activeView === "domain") {
            selectGraphNode(conceptButton.dataset.concept);
            document.querySelector(".graph-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (guideButton) openGuide(guideButton.dataset.guide);
        if (filterButton) {
            activeFilter = filterButton.dataset.filter;
            renderGuideLibrary();
        }
        if (copyButton) copyCode(copyButton);
    });

    elements.search.addEventListener("input", () => {
        if (activeView !== "guides") setView("guides", { noScroll: true });
        else renderGuideLibrary();
    });

    document.addEventListener("keydown", (event) => {
        if (event.key === "/" && document.activeElement !== elements.search) {
            event.preventDefault();
            elements.search.focus();
        }
    });

    document.getElementById("menu-button").addEventListener("click", openSidebar);
    document.getElementById("sidebar-close").addEventListener("click", closeSidebar);
    document.getElementById("sidebar-scrim").addEventListener("click", closeSidebar);
    document.getElementById("dialog-close").addEventListener("click", closeGuide);
    elements.topicDialog.addEventListener("click", (event) => {
        if (event.target === elements.topicDialog) closeGuide();
    });
    elements.topicDialog.addEventListener("cancel", (event) => {
        event.preventDefault();
        closeGuide();
    });
}

function initFromHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const guideId = params.get("guide");
    const domainId = params.get("domain");
    const conceptId = params.get("concept");
    if (guideId && getGuide(guideId)) openGuide(guideId, { fromHash: true });
    else if (domainId && getDomain(domainId)) setView("domain", { domain: domainId, concept: conceptId || "root", noScroll: true });
}

function init() {
    renderNavigation();
    renderOverviewMap();
    renderDomainGrid();
    renderFeaturedGuides();
    renderGuideLibrary();
    setupEvents();
    initFromHash();
    preloadGuideBodies();
}

init();
