/**
 * Calm Data and AI knowledge atlas.
 * Static, dependency-free, and intentionally free of progress tracking.
 */

const { tracks, topics } = window.PATTERNBOOK;
const atlas = window.PATTERNBOOK_ATLAS;

const elements = {
    body: document.body,
    overviewView: document.getElementById("overview-view"),
    domainView: document.getElementById("domain-view"),
    domainNavigation: document.getElementById("domain-navigation"),
    homeSearch: document.getElementById("home-search"),
    homeFeature: document.getElementById("home-feature"),
    homeResults: document.getElementById("home-results"),
    homeResultsCount: document.getElementById("home-results-count"),
    homeResultsGrid: document.getElementById("home-results-grid"),
    homeEmptyState: document.getElementById("home-empty-state"),
    domainHeader: document.getElementById("domain-header"),
    principleStrip: document.getElementById("principle-strip"),
    domainGraph: document.getElementById("domain-graph"),
    conceptInspector: document.getElementById("concept-inspector"),
    clusterIndex: document.getElementById("cluster-index"),
    domainGuidesSection: document.getElementById("domain-guides-section"),
    domainGuides: document.getElementById("domain-guides"),
    topicDialog: document.getElementById("topic-dialog"),
    dialogContent: document.getElementById("dialog-content"),
    toast: document.getElementById("toast")
};

let activeView = "overview";
let activeDomain = tracks[0].id;
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
    if (elements.homeSearch.value.trim() && activeView === "overview") renderHomeSearch();
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
    const programmingIds = new Set(["python", "sql", "go", "rust"]);
    const trackLink = (track, isChild = false) => `
        <a class="nav-item${isChild ? " nav-subitem" : ""}" href="#domain=${encodeURIComponent(track.id)}&concept=root" data-domain="${escapeHtml(track.id)}">
            <span class="nav-symbol">${escapeHtml(track.mark)}</span>
            <span>${escapeHtml(track.shortName)}</span>
        </a>
    `;
    const primaryTracks = tracks.filter((track) => !programmingIds.has(track.id));
    const programmingTracks = tracks.filter((track) => programmingIds.has(track.id));

    elements.domainNavigation.innerHTML = `
        ${primaryTracks.map((track) => trackLink(track)).join("")}
        <div class="nav-group">
            <button class="nav-item nav-group-toggle" type="button" data-nav-toggle="programming" aria-expanded="false" aria-controls="programming-navigation">
                <span class="nav-symbol">PL</span>
                <span>Programming Languages</span>
                <i aria-hidden="true">⌄</i>
            </button>
            <div class="nav-submenu" id="programming-navigation" hidden>
                ${programmingTracks.map((track) => trackLink(track, true)).join("")}
            </div>
        </div>
        <a class="nav-item nav-feature-link" href="timeline.html">
            <span class="nav-symbol">⟜</span>
            <span>Taste of the Past</span>
        </a>
    `;
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

function setView(view, options = {}) {
    activeView = view;
    elements.body.dataset.view = view;
    elements.overviewView.classList.toggle("hidden", view !== "overview");
    elements.domainView.classList.toggle("hidden", view !== "domain");

    if (view === "domain") {
        activeDomain = options.domain || activeDomain;
        activeGraphNode = options.concept || "root";
        renderDomain();
        if (!options.fromHash) {
            const hash = new URLSearchParams({ domain: activeDomain, concept: activeGraphNode });
            history.replaceState(null, "", `#${hash.toString()}`);
        }
    } else {
        elements.homeSearch.value = "";
        renderHomeSearch();
        if (!options.fromHash && location.hash) history.replaceState(null, "", `${location.pathname}${location.search}`);
    }

    document.querySelectorAll(".nav-item").forEach((item) => {
        const activeDomainItem = view === "domain" && item.dataset.domain === activeDomain;
        item.classList.toggle("active", activeDomainItem);
    });

    if (["python", "sql", "go", "rust"].includes(activeDomain) && view === "domain") {
        const programmingToggle = document.querySelector('[data-nav-toggle="programming"]');
        const programmingMenu = document.getElementById("programming-navigation");
        programmingToggle?.setAttribute("aria-expanded", "true");
        if (programmingMenu) programmingMenu.hidden = false;
    }

    closeSidebar();
    if (!options.noScroll) window.scrollTo({ top: 0, behavior: "smooth" });
}

function renderDomain() {
    const track = getTrack(activeDomain);
    const domain = getDomain(activeDomain);
    const domainGuides = getDomainGuides(activeDomain);
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
            ${domainGuides.length ? `<strong>${domainGuides.length}</strong><span>detailed guides</span>` : ""}
        </div>
    `;
    elements.principleStrip.innerHTML = domain.principles.map((principle, index) => `<span><i>0${index + 1}</i>${escapeHtml(principle)}</span>`).join("");
    renderGraph();
    renderClusterIndex();
    elements.domainGuidesSection.classList.toggle("hidden", domainGuides.length === 0);
    elements.domainGuides.innerHTML = domainGuides.map(renderGuideCard).join("");
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

function searchKnowledge(query, filter = "all") {
    const term = query.trim().toLowerCase();
    const guideResults = topics.filter((topic) => {
        if (filter !== "all" && topic.track !== filter) return false;
        if (!term) return true;
        const location = findGuideLocation(topic.id);
        const haystack = [topic.title, topic.summary, topic.type, ...(topic.tags || []), location?.cluster.label, guideText.get(topic.id) || ""].join(" ").toLowerCase();
        return haystack.includes(term);
    });
    const conceptResults = [];
    if (term) {
        tracks.forEach((track) => {
            if (filter !== "all" && track.id !== filter) return;
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

function renderHomeSearch() {
    const query = elements.homeSearch.value.trim();
    if (!query) {
        elements.homeFeature.classList.remove("hidden");
        elements.homeResults.classList.add("hidden");
        elements.homeResultsGrid.innerHTML = "";
        return;
    }

    const { guideResults, conceptResults } = searchKnowledge(query, "all");
    const results = [
        ...conceptResults.map((result) => renderConceptResult(result)),
        ...guideResults.map((topic) => renderGuideCard(topic))
    ].slice(0, 12);
    const total = guideResults.length + conceptResults.length;

    elements.homeFeature.classList.add("hidden");
    elements.homeResults.classList.remove("hidden");
    elements.homeResultsCount.textContent = `${total} result${total === 1 ? "" : "s"}`;
    elements.homeResultsGrid.innerHTML = results.join("");
    elements.homeResultsGrid.classList.toggle("hidden", total === 0);
    elements.homeEmptyState.classList.toggle("hidden", total !== 0);
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
        const navToggle = event.target.closest("[data-nav-toggle]");
        const domainButton = event.target.closest("[data-domain]");
        const conceptButton = event.target.closest("[data-concept]");
        const guideButton = event.target.closest("[data-guide]");
        const copyButton = event.target.closest("[data-copy-code]");

        if (navToggle) {
            const menu = document.getElementById(`${navToggle.dataset.navToggle}-navigation`);
            const opening = navToggle.getAttribute("aria-expanded") !== "true";
            navToggle.setAttribute("aria-expanded", String(opening));
            if (menu) menu.hidden = !opening;
        }
        if (viewButton) setView("overview");
        if (domainButton) {
            event.preventDefault();
            if (elements.topicDialog.open) closeGuide();
            setView("domain", { domain: domainButton.dataset.domain, concept: conceptButton?.dataset.concept || "root" });
        } else if (conceptButton && activeView === "domain") {
            selectGraphNode(conceptButton.dataset.concept);
            document.querySelector(".graph-section")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }
        if (guideButton) openGuide(guideButton.dataset.guide);
        if (copyButton) copyCode(copyButton);
    });

    elements.homeSearch.addEventListener("input", renderHomeSearch);

    document.addEventListener("keydown", (event) => {
        const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
        if (event.key === "/" && activeView === "overview" && document.activeElement !== elements.homeSearch && !isTyping) {
            event.preventDefault();
            elements.homeSearch.focus();
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
    else if (domainId && getDomain(domainId)) setView("domain", { domain: domainId, concept: conceptId || "root", noScroll: true, fromHash: true });
}

function init() {
    renderNavigation();
    renderHomeSearch();
    setupEvents();
    initFromHash();
    preloadGuideBodies();
}

init();
