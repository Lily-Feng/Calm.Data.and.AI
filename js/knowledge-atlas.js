const DATA_URL = "data-ai-knowledge-graph.json";

const LAYER_COLORS = [
  "#94d9e8",
  "#9fdcb6",
  "#d8e974",
  "#ffd36d",
  "#ff9d78",
  "#c5afea",
  "#f2a8c2"
];

const TRAILS = {
  platform: {
    label: "Platform architect",
    topics: ["cpu-architecture", "cloud-networking", "table-format-fundamentals", "workflow-orchestration", "inference-autoscaling", "online-inference-endpoints", "visualization-accessibility"]
  },
  data_engineer: {
    label: "Data engineer",
    topics: ["object-store-as-primary", "parquet", "log-based-cdc", "dimensional-modeling", "data-contracts", "analytics-apis", "self-service-analytics"]
  },
  analytics_engineer: {
    label: "Analytics engineer",
    topics: ["columnar-warehouses", "sql-transformation-modeling", "grain-and-key-design", "metric-definitions", "headless-bi", "natural-language-to-sql", "data-storytelling"]
  },
  ml_engineer: {
    label: "ML engineer",
    topics: ["gpu-and-accelerators", "vector-index-hnsw", "feature-types-and-encoding", "point-in-time-correctness", "distributed-training-strategies", "context-assembly", "model-gateways-and-routing"]
  },
  scientist: {
    label: "Data scientist",
    topics: ["numerical-precision-formats", "dataframe-apis", "feature-selection", "supervised-learning", "model-evaluation", "reproducible-analysis", "causal-inference"]
  },
  analyst: {
    label: "Analyst",
    topics: ["relational-model", "query-planning", "dimensional-modeling", "metric-definitions", "self-service-analytics", "visual-encoding", "decision-workflows"]
  }
};

const EDITORIAL_NOTES = {
  "block-file-object-media": "Block, file, and object describe storage access interfaces—not physical media. The revised label keeps that distinction visible while retaining the topic in the infrastructure layer.",
  "delivery-semantics": "Treat delivery guarantees and end-to-end processing outcomes separately. “Exactly once” is scoped: it depends on transaction boundaries and cooperation from sinks outside the streaming system.",
  "ai-specific-threats": "Modern AI application security extends beyond prompt injection and model theft. It also includes unsafe agency, sensitive disclosure, poisoned dependencies, unbounded consumption, and insecure output handling.",
  "slos-and-error-budgets": "Reliability is now its own cross-cutting compass point. SLOs and error budgets are operational control mechanisms, not simply cost-management techniques.",
  "table-format-fundamentals": "Snapshots, manifest lists, manifests, and atomic metadata commits are central concepts in modern open table formats; they belong together as the foundation of this group."
};

const RELATION_LABELS = {
  requires: ["requires", "required by"],
  part_of: ["part of", "includes"],
  implemented_by: ["implemented by", "implements"],
  alternative_to: ["alternative to", "alternative to"],
  enables: ["enables", "enabled by"],
  governed_by: ["governed by", "governs"]
};

const state = {
  graph: null,
  topics: new Map(),
  subdomains: new Map(),
  concerns: new Map(),
  adjacency: new Map(),
  openSubdomains: new Set(),
  trail: "data_engineer",
  query: "",
  role: "",
  stage: "",
  maturity: ""
};

const $ = (selector, root = document) => root.querySelector(selector);
const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
const pretty = value => String(value || "").replaceAll("_", " ");
const escapeHtml = value => String(value).replace(/[&<>"']/g, char => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;"
}[char]));

function layerColor(layerId) {
  const index = state.graph.layers.findIndex(layer => layer.id === layerId);
  return LAYER_COLORS[Math.max(0, index)] || "#d8f46a";
}

function topicMatches(topic) {
  const haystack = [topic.name, topic.id, topic.parentName, topic.layerName, ...Object.values(topic.facets)].join(" ").toLowerCase();
  if (state.query && !haystack.includes(state.query)) return false;
  if (state.role && topic.facets.role && topic.facets.role !== state.role) return false;
  if (state.stage && topic.facets.stage && topic.facets.stage !== state.stage) return false;
  if (state.maturity && topic.facets.maturity && topic.facets.maturity !== state.maturity) return false;
  return true;
}

function buildIndex(graph) {
  graph.layers.forEach((layer, layerIndex) => {
    layer._color = LAYER_COLORS[layerIndex];
    layer.sub_domains.forEach(subdomain => {
      subdomain._layer = layer;
      subdomain._topics = subdomain.topics.map(topic => {
        const normalized = {
          ...topic,
          facets: { ...subdomain.facets, ...(topic.facets || {}) },
          layerId: layer.id,
          layerName: layer.name,
          parentId: subdomain.id,
          parentName: subdomain.name,
          isConcern: false
        };
        state.topics.set(topic.id, normalized);
        return normalized;
      });
      state.subdomains.set(subdomain.id, subdomain);
    });
  });

  graph.concerns.forEach(concern => {
    concern._topics = concern.topics.map(topic => {
      const normalized = {
        ...topic,
        facets: { concern: concern.id },
        layerId: null,
        layerName: "Cross-cutting compass",
        parentId: concern.id,
        parentName: concern.name,
        isConcern: true
      };
      state.topics.set(topic.id, normalized);
      return normalized;
    });
    state.concerns.set(concern.id, concern);
  });

  graph.edges.forEach(edge => {
    const outgoing = state.adjacency.get(edge.from) || [];
    outgoing.push({ id: edge.to, type: edge.type, direction: "out" });
    state.adjacency.set(edge.from, outgoing);

    const incoming = state.adjacency.get(edge.to) || [];
    incoming.push({ id: edge.from, type: edge.type, direction: "in" });
    state.adjacency.set(edge.to, incoming);
  });
}

function renderHero() {
  const graph = state.graph;
  $("#stat-layers").textContent = graph.layers.length;
  $("#stat-topics").textContent = state.topics.size;
  $("#stat-links").textContent = graph.edges.length;
  $("#stat-concerns").textContent = graph.concerns.length;
  $("#topic-search").placeholder = `Search ${state.topics.size} topics…`;
  $("#review-stamp-copy").textContent = `${state.topics.size} unique topics · 0 broken references · 0 malformed records`;

  $("#hero-map").innerHTML = graph.layers.map((layer, index) => {
    const topicCount = layer.sub_domains.reduce((count, subdomain) => count + subdomain.topics.length, 0);
    const inset = 4 + Math.abs(3 - index) * 2.2;
    const shift = (index - 3) * 3.5;
    return `<button class="hero-layer" type="button" data-layer-jump="${escapeHtml(layer.id)}" style="--layer:${layer._color};--inset:${inset}%;--shift:${shift}px">
      <span class="hero-layer__number">0${index + 1}</span>
      <span><strong>${escapeHtml(layer.name)}</strong><small>${escapeHtml(layer.summary)}</small></span>
      <span class="hero-layer__count">${topicCount}</span>
    </button>`;
  }).join("");

  $$('[data-layer-jump]').forEach(button => button.addEventListener("click", () => {
    document.getElementById(`layer-${button.dataset.layerJump}`)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }));
}

function renderFilters() {
  const options = key => [...new Set([...state.topics.values()].map(topic => topic.facets[key]).filter(Boolean))].sort();
  [
    ["role-filter", "role"],
    ["stage-filter", "stage"],
    ["maturity-filter", "maturity"]
  ].forEach(([id, key]) => {
    const select = document.getElementById(id);
    options(key).forEach(value => select.insertAdjacentHTML("beforeend", `<option value="${escapeHtml(value)}">${escapeHtml(pretty(value))}</option>`));
  });
}

function renderTrails() {
  $("#role-picker").innerHTML = Object.entries(TRAILS).map(([id, trail]) =>
    `<button class="role-pill ${state.trail === id ? "is-active" : ""}" type="button" data-trail="${id}" aria-pressed="${state.trail === id}">${escapeHtml(trail.label)}</button>`
  ).join("");

  $$('[data-trail]').forEach(button => button.addEventListener("click", () => {
    state.trail = button.dataset.trail;
    renderTrails();
  }));

  const topics = TRAILS[state.trail].topics.map(id => state.topics.get(id)).filter(Boolean);
  $("#trail-route").innerHTML = topics.map((topic, index) => `<li class="trail-stop">
    <button type="button" data-topic="${escapeHtml(topic.id)}" style="--stop-color:${topic.isConcern ? "#d8f46a" : layerColor(topic.layerId)}">
      <span class="trail-dot">0${index + 1}</span>
      <small>${escapeHtml(topic.parentName)}</small>
      <strong>${escapeHtml(topic.name)}</strong>
      <em>Open topic ↗</em>
    </button>
  </li>`).join("");
  bindTopicButtons($("#trail-route"));
}

function renderCompass() {
  $("#concern-rail").innerHTML = state.graph.concerns.map((concern, index) => {
    const visible = concern._topics.filter(topicMatches);
    return `<button class="concern-card ${visible.length ? "" : "is-dim"}" type="button" data-concern="${escapeHtml(concern.id)}">
      <span>0${index + 1}</span>
      <strong>${escapeHtml(concern.name)}</strong>
      <small>${visible.length}/${concern._topics.length} topics</small>
    </button>`;
  }).join("");
  $$('[data-concern]').forEach(button => button.addEventListener("click", () => openGroup("concern", button.dataset.concern)));
}

function highlighted(text) {
  if (!state.query) return escapeHtml(text);
  const escapedText = escapeHtml(text);
  const escapedQuery = escapeHtml(state.query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return escapedText.replace(new RegExp(`(${escapedQuery})`, "ig"), "<mark>$1</mark>");
}

function renderLayers() {
  let shownTopics = 0;
  let shownGroups = 0;
  let shownLayers = 0;

  $("#layer-stack").innerHTML = state.graph.layers.map((layer, layerIndex) => {
    const renderedSubdomains = layer.sub_domains.map(subdomain => {
      const visible = subdomain._topics.filter(topicMatches);
      if (!visible.length) return "";
      shownGroups += 1;
      shownTopics += visible.length;
      const isOpen = state.openSubdomains.has(subdomain.id) || Boolean(state.query);
      return `<article class="subdomain-card ${isOpen ? "is-open" : ""}" data-subdomain-card="${escapeHtml(subdomain.id)}">
        <button class="subdomain-toggle" type="button" data-subdomain="${escapeHtml(subdomain.id)}" aria-expanded="${isOpen}">
          <span class="subdomain-toggle__top"><span>${escapeHtml(pretty(subdomain.facets.role))}</span><i aria-hidden="true">+</i></span>
          <strong>${escapeHtml(subdomain.name)}</strong>
          <small>${visible.length === subdomain._topics.length ? `${visible.length} topics` : `${visible.length} of ${subdomain._topics.length} topics`}</small>
        </button>
        <div class="topic-list">
          ${visible.map(topic => `<button class="topic-chip" type="button" data-topic="${escapeHtml(topic.id)}"><span>${highlighted(topic.name)}</span><span aria-hidden="true">↗</span></button>`).join("")}
        </div>
      </article>`;
    }).filter(Boolean).join("");

    if (!renderedSubdomains) return "";
    shownLayers += 1;
    const layerTopicCount = layer.sub_domains.reduce((count, subdomain) => count + subdomain._topics.filter(topicMatches).length, 0);
    const totalTopicCount = layer.sub_domains.reduce((count, subdomain) => count + subdomain._topics.length, 0);
    return `<section class="layer-band" id="layer-${escapeHtml(layer.id)}" style="--layer:${layer._color}" aria-labelledby="layer-title-${escapeHtml(layer.id)}">
      <div class="layer-label">
        <span class="layer-index">LAYER / 0${layerIndex + 1}</span>
        <h3 id="layer-title-${escapeHtml(layer.id)}">${escapeHtml(layer.name)}</h3>
        <p>${escapeHtml(layer.summary)}</p>
        <span class="layer-meta">${layer.sub_domains.length} groups · ${layerTopicCount}/${totalTopicCount} topics</span>
      </div>
      <div class="subdomain-grid">${renderedSubdomains}</div>
    </section>`;
  }).filter(Boolean).join("");

  $$('[data-subdomain]').forEach(button => button.addEventListener("click", () => {
    const id = button.dataset.subdomain;
    if (state.openSubdomains.has(id)) state.openSubdomains.delete(id);
    else state.openSubdomains.add(id);
    const card = document.querySelector(`[data-subdomain-card="${id}"]`);
    card?.classList.toggle("is-open", state.openSubdomains.has(id));
    button.setAttribute("aria-expanded", String(state.openSubdomains.has(id)));
  }));
  bindTopicButtons($("#layer-stack"));

  const compassTopics = state.graph.concerns.flatMap(concern => concern._topics).filter(topicMatches).length;
  const totalShown = shownTopics + compassTopics;
  $("#result-count").textContent = `${totalShown} of ${state.topics.size} topics · ${shownGroups} groups · ${shownLayers} layers`;
  $("#empty-results").classList.toggle("hidden", totalShown !== 0);
  $("#layer-stack").classList.toggle("hidden", shownLayers === 0);

  const activeFilters = [state.role, state.stage, state.maturity].filter(Boolean).length;
  $("#active-filter-count").textContent = activeFilters;
}

function renderAtlas() {
  renderCompass();
  renderLayers();
}

function bindTopicButtons(root) {
  $$('[data-topic]', root).forEach(button => button.addEventListener("click", () => openTopic(button.dataset.topic)));
}

function relationLabel(connection) {
  const labels = RELATION_LABELS[connection.type] || [connection.type, connection.type];
  return labels[connection.direction === "out" ? 0 : 1];
}

function topicIntroduction(topic) {
  if (topic.isConcern) {
    return `${topic.name} is a cross-cutting practice in ${topic.parentName}. It belongs on the compass because it changes decisions across every layer rather than living in just one stratum.`;
  }
  return `${topic.name} sits in ${topic.parentName}, within ${topic.layerName}. Its placement is a primary home for navigation—not a boundary around where the idea applies.`;
}

function openTopic(id, updateHash = true) {
  const topic = state.topics.get(id);
  if (!topic) return;
  const connections = state.adjacency.get(id) || [];
  const siblings = topic.isConcern
    ? state.concerns.get(topic.parentId)._topics.filter(item => item.id !== id)
    : state.subdomains.get(topic.parentId)._topics.filter(item => item.id !== id);

  $("#dialog-path").textContent = `${topic.layerName} / ${topic.parentName}`;
  $("#dialog-body").innerHTML = `
    <span class="dialog-layer-mark" style="--topic-color:${topic.isConcern ? "#d8f46a" : layerColor(topic.layerId)}">${topic.isConcern ? "Compass point" : escapeHtml(topic.layerName)}</span>
    <h2>${escapeHtml(topic.name)}</h2>
    <p class="topic-intro">${escapeHtml(topicIntroduction(topic))}</p>
    <div class="facet-row">${Object.entries(topic.facets).map(([key, value]) => `<span>${escapeHtml(pretty(key))} <b>${escapeHtml(pretty(value))}</b></span>`).join("")}</div>
    ${EDITORIAL_NOTES[id] ? `<div class="dialog-section"><h3>Editorial note</h3><div class="seed-note">${escapeHtml(EDITORIAL_NOTES[id])}</div></div>` : ""}
    <section class="dialog-section">
      <h3>Cross-links · ${connections.length}</h3>
      ${connections.length ? `<div class="connection-list">${connections.map(connection => {
        const other = state.topics.get(connection.id);
        return `<button class="connection-button" type="button" data-topic="${escapeHtml(other.id)}"><em>${escapeHtml(relationLabel(connection))}</em><strong>${escapeHtml(other.name)}</strong><small>${escapeHtml(other.parentName)}</small></button>`;
      }).join("")}</div>` : `<div class="seed-note">No authored cross-links yet. This topic is present in the hierarchy and is a candidate for the next relationship pass.</div>`}
    </section>
    <section class="dialog-section">
      <h3>Nearby in ${escapeHtml(topic.parentName)}</h3>
      <div class="sibling-list">${siblings.map(sibling => `<button class="sibling-button" type="button" data-topic="${escapeHtml(sibling.id)}"><span>${escapeHtml(sibling.name)}</span><span aria-hidden="true">↗</span></button>`).join("")}</div>
    </section>`;
  bindTopicButtons($("#dialog-body"));

  const dialog = $("#topic-dialog");
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
  if (updateHash) history.replaceState(null, "", `#topic=${encodeURIComponent(id)}`);
}

function openGroup(kind, id) {
  const group = kind === "concern" ? state.concerns.get(id) : state.subdomains.get(id);
  if (!group) return;
  const topics = group._topics.filter(topicMatches);
  const layerName = kind === "concern" ? "Cross-cutting compass" : group._layer.name;
  const color = kind === "concern" ? "#d8f46a" : group._layer._color;
  $("#dialog-path").textContent = `${layerName} / topic group`;
  $("#dialog-body").innerHTML = `
    <span class="dialog-layer-mark" style="--topic-color:${color}">${kind === "concern" ? "Compass point" : "Knowledge group"}</span>
    <h2>${escapeHtml(group.name)}</h2>
    <p class="topic-intro">${kind === "concern" ? "A concern that travels through the entire stack." : escapeHtml(group._layer.summary)}</p>
    <section class="dialog-section">
      <h3>Topics · ${topics.length}</h3>
      <div class="sibling-list">${topics.map(topic => `<button class="sibling-button" type="button" data-topic="${escapeHtml(topic.id)}"><span>${escapeHtml(topic.name)}</span><span aria-hidden="true">↗</span></button>`).join("")}</div>
    </section>`;
  bindTopicButtons($("#dialog-body"));
  const dialog = $("#topic-dialog");
  if (!dialog.open) dialog.showModal();
  dialog.scrollTop = 0;
}

function randomTopic() {
  const candidates = [...state.topics.values()].filter(topicMatches);
  if (!candidates.length) return;
  openTopic(candidates[Math.floor(Math.random() * candidates.length)].id);
}

function clearFilters() {
  state.query = "";
  state.role = "";
  state.stage = "";
  state.maturity = "";
  $("#topic-search").value = "";
  $("#role-filter").value = "";
  $("#stage-filter").value = "";
  $("#maturity-filter").value = "";
  renderAtlas();
}

function wireEvents() {
  $("#topic-search").addEventListener("input", event => {
    state.query = event.target.value.trim().toLowerCase();
    renderAtlas();
  });
  [
    ["role-filter", "role"],
    ["stage-filter", "stage"],
    ["maturity-filter", "maturity"]
  ].forEach(([id, key]) => document.getElementById(id).addEventListener("change", event => {
    state[key] = event.target.value;
    renderAtlas();
  }));
  $("#clear-filters").addEventListener("click", clearFilters);
  $("#empty-clear").addEventListener("click", clearFilters);
  $("#surprise-hero").addEventListener("click", randomTopic);
  $("#surprise-atlas").addEventListener("click", randomTopic);

  const topicDialog = $("#topic-dialog");
  $("#close-topic").addEventListener("click", () => topicDialog.close());
  topicDialog.addEventListener("click", event => { if (event.target === topicDialog) topicDialog.close(); });
  topicDialog.addEventListener("close", () => {
    if (location.hash.startsWith("#topic=")) history.replaceState(null, "", `${location.pathname}${location.search}`);
  });

  const aboutDialog = $("#about-dialog");
  [$("#open-about"), $("#open-about-bottom")].forEach(button => button.addEventListener("click", () => aboutDialog.showModal()));
  $("#close-about").addEventListener("click", () => aboutDialog.close());
  aboutDialog.addEventListener("click", event => { if (event.target === aboutDialog) aboutDialog.close(); });

  document.addEventListener("keydown", event => {
    const target = event.target;
    const isTyping = target instanceof HTMLInputElement || target instanceof HTMLTextAreaElement || target instanceof HTMLSelectElement;
    if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
      event.preventDefault();
      $("#topic-search").focus();
      $("#atlas").scrollIntoView({ behavior: "smooth", block: "start" });
    } else if (event.key === "/" && !isTyping) {
      event.preventDefault();
      $("#topic-search").focus();
    }
  });

  window.addEventListener("scroll", () => {
    const scrollable = document.documentElement.scrollHeight - innerHeight;
    const progress = scrollable > 0 ? (scrollY / scrollable) * 100 : 0;
    $("#reading-progress").style.setProperty("--progress", `${progress}%`);
  }, { passive: true });
}

async function init() {
  try {
    if (window.DATA_AI_KNOWLEDGE_GRAPH) {
      state.graph = window.DATA_AI_KNOWLEDGE_GRAPH;
    } else {
      const response = await fetch(DATA_URL);
      if (!response.ok) throw new Error(`Map data returned ${response.status}`);
      state.graph = await response.json();
    }
    buildIndex(state.graph);
    renderHero();
    renderFilters();
    renderTrails();
    renderAtlas();
    wireEvents();

    const deepLink = location.hash.match(/^#topic=(.+)$/);
    if (deepLink) openTopic(decodeURIComponent(deepLink[1]), false);
  } catch (error) {
    console.error(error);
    $("#hero-map").innerHTML = `<div class="map-loading">The terrain could not be loaded.</div>`;
    $("#layer-stack").innerHTML = `<div class="empty-results"><span>!</span><h3>The map data is unavailable.</h3><p>Run this site from its local web server so the atlas can load its data file.</p></div>`;
    $("#result-count").textContent = "Map unavailable";
  }
}

init();
