// Homepage atlas: data index, panels, routing, search, trails and the timeline.
//
// A classic script on purpose. Everything here works without WebGL or ES
// modules; js/atlas-scene.js adds the 3D stack when it can and is driven
// through `scene.update(view)`. Without it, a 2D layer stack fills the stage.

(() => {
  "use strict";

  const GRAPH = window.DATA_AI_KNOWLEDGE_GRAPH;
  const CONTENT = window.ATLAS_CONTENT || { trails: {}, questions: {}, milestones: [], editorialNotes: {} };
  const LAYER_COLORS = ["#4f8cff", "#3fc1c9", "#8b7cff", "#c77dff", "#ff8a5b", "#ffc857", "#5ee6a8"];
  const CONCERN_COLOR = "#d8f46a";
  const STEP_MS = 4200;
  const YEAR_MIN = 2004, YEAR_MAX = 2023;

  const RELATION_LABELS = {
    requires: ["requires", "required by"],
    part_of: ["part of", "includes"],
    implemented_by: ["implemented by", "implements"],
    alternative_to: ["alternative to", "alternative to"],
    enables: ["enables", "enabled by"],
    governed_by: ["governed by", "governs"]
  };
  const WHERE_LABEL = {
    inside: "inside the server",
    beside: "customer stack beside it",
    none: "no counterpart"
  };

  const $ = (selector, root = document) => root.querySelector(selector);
  const $$ = (selector, root = document) => [...root.querySelectorAll(selector)];
  const pretty = value => String(value || "").replaceAll("_", " ");
  const pad = i => String(i + 1).padStart(2, "0");
  const esc = value => String(value ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
  const compactQuery = matchMedia("(max-width: 820px)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  const state = {
    layers: [],
    groups: new Map(),
    concerns: new Map(),
    topics: new Map(),
    adjacency: new Map(),
    nodeEdges: [],
    milestonesByTopic: new Map(),
    lens: "modern",
    focus: null,
    view: { kind: "overview" },
    history: [],
    query: "",
    role: "",
    stage: "",
    maturity: "",
    trace: null,
    timeline: { on: false, year: YEAR_MAX, playing: null, flashToken: 0 },
    scene: null
  };
  let traceTimer = null;

  /* ================================================================ index */

  function buildIndex() {
    GRAPH.layers.forEach((layer, index) => {
      const L = { ...layer, index, color: LAYER_COLORS[index], groups: [] };
      layer.sub_domains.forEach(sub => {
        const group = { ...sub, kind: "group", layer: L, where: sub.mstr?.where || "none", topics: [] };
        group.topics = sub.topics.map(topic => {
          const t = {
            ...topic,
            facets: { ...sub.facets, ...(topic.facets || {}) },
            group, layer: L, isConcern: false,
            nodeId: sub.id, color: L.color
          };
          state.topics.set(t.id, t);
          return t;
        });
        L.groups.push(group);
        state.groups.set(group.id, group);
      });
      state.layers.push(L);
    });

    GRAPH.concerns.forEach(concern => {
      const c = { ...concern, kind: "concern", where: concern.mstr?.where || "none", topics: [] };
      c.topics = concern.topics.map(topic => {
        const t = { ...topic, facets: { concern: concern.id }, group: c, layer: null, isConcern: true, nodeId: concern.id, color: CONCERN_COLOR };
        state.topics.set(t.id, t);
        return t;
      });
      state.concerns.set(c.id, c);
    });

    const pairs = new Set();
    GRAPH.edges.forEach(edge => {
      const from = state.topics.get(edge.from), to = state.topics.get(edge.to);
      if (!from || !to) return;
      push(state.adjacency, edge.from, { id: edge.to, type: edge.type, direction: "out" });
      push(state.adjacency, edge.to, { id: edge.from, type: edge.type, direction: "in" });
      if (from.nodeId !== to.nodeId) {
        const key = [from.nodeId, to.nodeId].sort().join("|");
        if (!pairs.has(key)) { pairs.add(key); state.nodeEdges.push([from.nodeId, to.nodeId]); }
      }
    });

    CONTENT.milestones.forEach(m => m.topics.forEach(id => push(state.milestonesByTopic, id, m)));
    checkContent();
  }

  function push(map, key, value) {
    const list = map.get(key) || [];
    list.push(value);
    map.set(key, list);
  }

  function checkContent() {
    const missing = [];
    const check = id => { if (id && !state.topics.has(id)) missing.push(id); };
    Object.values(CONTENT.trails).forEach(t => t.topics.forEach(check));
    Object.values(CONTENT.questions).forEach(q => q.steps.forEach(s => {
      if (s.topic && typeof s.topic === "object") { check(s.topic.m); check(s.topic.n); } else check(s.topic);
    }));
    CONTENT.milestones.forEach(m => m.topics.forEach(check));
    if (missing.length) console.warn("Atlas content references unknown topics:", missing);
  }

  const node = id => state.groups.get(id) || state.concerns.get(id);
  const layerTopicCount = L => L.groups.reduce((n, g) => n + g.topics.length, 0);
  const mstrOn = () => state.lens === "mstr";

  /* ================================================================ filtering */

  function filtersActive() {
    return Boolean(state.query || state.role || state.stage || state.maturity);
  }

  function topicMatches(t) {
    if (state.query) {
      const hay = [t.name, t.id, t.mstr, t.group.name, t.group.mstr?.name, t.layer?.name, ...Object.values(t.facets)].join(" ").toLowerCase();
      if (!hay.includes(state.query)) return false;
    }
    if (state.role && t.facets.role && t.facets.role !== state.role) return false;
    if (state.stage && t.facets.stage && t.facets.stage !== state.stage) return false;
    if (state.maturity && t.facets.maturity && t.facets.maturity !== state.maturity) return false;
    return true;
  }

  function matchSet() {
    if (!filtersActive()) return null;
    const ids = new Set();
    state.topics.forEach(t => { if (topicMatches(t)) ids.add(t.nodeId); });
    return ids;
  }

  function highlight(text) {
    const safe = esc(text);
    if (!state.query) return safe;
    const q = esc(state.query).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    return safe.replace(new RegExp(`(${q})`, "ig"), "<mark>$1</mark>");
  }

  /* ================================================================ traces */

  function traceDef(tr = state.trace) {
    if (!tr) return null;
    if (tr.kind === "question") {
      const q = CONTENT.questions[tr.key];
      return { label: q.label, color: q.color, modernOnly: q.modernOnly, steps: q.steps };
    }
    const trail = CONTENT.trails[tr.key];
    return { label: `${trail.label} trail`, color: "#9fdcb6", steps: trail.topics.map(topic => ({ topic })) };
  }

  function stepTopicId(step, lens = state.lens) {
    if (!step || !step.topic) return null;
    if (typeof step.topic === "object") return lens === "mstr" ? step.topic.m : step.topic.n;
    return step.topic;
  }

  function sceneTrace() {
    const def = traceDef();
    if (!def) return null;
    const path = def.steps.slice(0, state.trace.i + 1).map(s => state.topics.get(stepTopicId(s))?.nodeId).filter(Boolean);
    const current = state.topics.get(stepTopicId(def.steps[state.trace.i]))?.nodeId || null;
    return { path, visited: new Set(path), current, color: def.color };
  }

  function startTrace(kind, key) {
    stopYearPlay();
    const def = traceDef({ kind, key });
    if (def.modernOnly && mstrOn()) setLens("modern", { silent: true });
    if (state.timeline.on) setTimeline(false);
    state.trace = { kind, key, i: 0, playing: !reduced };
    closePopovers();
    if (state.focus !== null) setFocus(null, { camera: true, render: false });
    goStep(0);
  }

  function stopTrace() {
    if (!state.trace) return;
    clearTimeout(traceTimer);
    state.trace = null;
    renderCaption();
    renderTrailMenu();
    syncScene();
  }

  function goStep(i) {
    const tr = state.trace;
    if (!tr) return;
    const def = traceDef();
    tr.i = Math.max(0, Math.min(def.steps.length - 1, i));
    clearTimeout(traceTimer);
    if (tr.playing && tr.i < def.steps.length - 1) traceTimer = setTimeout(() => goStep(tr.i + 1), STEP_MS);
    else if (tr.i === def.steps.length - 1) tr.playing = false;
    const topicId = stepTopicId(def.steps[tr.i]);
    if (topicId) setView({ kind: "topic", id: topicId }, { history: false, expand: false });
    else setView({ kind: "overview" }, { history: false, expand: false });
    renderCaption();
    renderTrailMenu();
  }

  /* ================================================================ lens, focus, view */

  function setLens(lens, { silent = false } = {}) {
    if (lens === state.lens) return;
    if (lens === "mstr" && state.trace && traceDef().modernOnly) stopTrace();
    if (lens === "mstr" && state.timeline.on) setTimeline(false);
    state.lens = lens;
    document.body.dataset.lens = lens;
    const seg = $("#lens-seg");
    seg.dataset.v = lens;
    $$("[data-lens]", seg).forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lens === lens)));
    writeUrl();
    if (silent) return;
    renderRail();
    renderInspector();
    renderCaption();
    renderFallback();
    syncScene();
  }

  function setFocus(index, { camera = true, render = true } = {}) {
    state.focus = index;
    if (camera) state.scene?.focusLayer(index);
    if (render) { renderRail(); renderFallback(); syncScene(); }
  }

  function setView(view, { history = true, expand = true } = {}) {
    const same = state.view.kind === view.kind && state.view.id === view.id;
    if (history && !same && state.view.kind !== "search") state.history.push(state.view);
    if (state.history.length > 40) state.history.shift();
    state.view = view;
    if (view.kind === "layer") setFocus(view.index, { render: false });
    else if (view.kind === "group" && state.focus !== null && state.focus !== node(view.id).layer.index) setFocus(node(view.id).layer.index, { render: false });
    if (expand && compactQuery.matches) setPanel("inspector", true);
    writeUrl();
    renderRail();
    renderInspector();
    renderFallback();
    syncScene();
  }

  function back() {
    const prev = state.history.pop();
    if (!prev) return false;
    state.view = prev;
    if (prev.kind === "layer") setFocus(prev.index, { render: false });
    writeUrl();
    renderRail();
    renderInspector();
    syncScene();
    return true;
  }

  function selectedNode() {
    const v = state.view;
    if (v.kind === "group" || v.kind === "concern") return v.id;
    if (v.kind === "topic") return state.topics.get(v.id)?.nodeId || null;
    return null;
  }

  function resetAll() {
    stopTrace();
    stopYearPlay();
    setTimeline(false);
    clearFilters({ render: false });
    state.history = [];
    state.view = { kind: "overview" };
    setFocus(null, { render: false });
    writeUrl();
    renderAll();
  }

  /* ================================================================ timeline */

  function setTimeline(on) {
    state.timeline.on = on;
    if (!on) stopYearPlay();
    if (on) {
      if (state.trace) stopTrace();
      if (mstrOn()) setLens("modern");
    }
    $("#timeline").hidden = !on;
    $("#timeline-btn").setAttribute("aria-pressed", String(on));
    renderTimeline();
    layoutScene();
    syncScene();
  }

  function setYear(year, { flash = true } = {}) {
    state.timeline.year = year;
    if (flash) state.timeline.flashToken += 1;
    renderTimeline();
    syncScene();
  }

  function stopYearPlay() {
    clearInterval(state.timeline.playing);
    state.timeline.playing = null;
    const play = $("#year-play");
    if (play) { play.textContent = "▶"; play.setAttribute("aria-label", "Play the timeline"); }
  }

  function timelineSets() {
    const tl = state.timeline;
    if (!tl.on) return null;
    const lit = new Set(), future = new Set(), flash = new Set();
    CONTENT.milestones.forEach(m => m.topics.forEach(id => {
      const nodeId = state.topics.get(id)?.nodeId;
      if (!nodeId) return;
      if (m.year <= tl.year) lit.add(nodeId); else future.add(nodeId);
      if (m.year === tl.year) flash.add(nodeId);
    }));
    const ghost = new Set([...future].filter(id => !lit.has(id)));
    return { lit, ghost, flash, flashToken: tl.flashToken };
  }

  /* ================================================================ scene bridge */

  function syncScene() {
    state.scene?.update({
      lens: state.lens,
      focusLayer: state.focus,
      selected: selectedNode(),
      match: matchSet(),
      trace: sceneTrace(),
      timeline: timelineSets()
    });
  }

  function sceneSpec() {
    return {
      layers: state.layers.map(L => ({
        name: L.name, color: L.color,
        groups: L.groups.map(g => ({ id: g.id, label: g.name, mstrLabel: g.mstr?.name || "", where: g.where }))
      })),
      concerns: [...state.concerns.values()].map(c => ({ id: c.id, label: c.name, mstrLabel: c.mstr?.name || "", where: c.where })),
      edges: state.nodeEdges
    };
  }

  function attachScene(factory) {
    if (state.scene) return;
    try {
      state.scene = factory($("#stage-3d"), sceneSpec(), {
        onSelect(kind, id) {
          if (kind === "layer") return openLayer(id);
          if (kind === "group" || kind === "concern") {
            if (state.trace) stopTrace();
            return setView({ kind, id });
          }
          if (!kind && state.view.kind !== "overview" && !state.trace && !compactQuery.matches) setView({ kind: "overview" });
        },
        onHover: showTooltip
      });
    } catch (error) {
      console.error(error);
      sceneUnavailable();
      return;
    }
    clearTimeout(sceneTimeout);
    document.body.classList.add("has-3d");
    document.body.classList.remove("no-3d");
    $("#stage-fallback").hidden = true;
    layoutScene();
    syncScene();
    if (state.focus !== null) state.scene.focusLayer(state.focus);
  }

  function sceneUnavailable() {
    if (state.scene) return;
    clearTimeout(sceneTimeout);
    document.body.classList.add("no-3d");
    $("#stage-fallback").hidden = false;
    renderFallback();
  }

  // Measure the floating panels and publish the free area to CSS (--free-*,
  // used by the 2D stage) and to the scene (which recentres its projection).
  function layoutScene() {
    const W = innerWidth, H = innerHeight, b = document.body.classList;
    const compact = compactQuery.matches;
    const rect = id => $(id).getBoundingClientRect();
    const dock = rect(b.contains("dock-collapsed") ? "#dock-tab" : "#dock");
    const root = document.documentElement.style;
    root.setProperty("--dock-h", `${Math.round(dock.height)}px`);
    let l = 0, r = 0, t = rect(".site-topbar").bottom, bottom = H - dock.top;
    if (compact) {
      t = b.contains("rail-collapsed") ? rect("#rail").bottom : t;
      bottom = b.contains("inspector-collapsed") ? H - rect("#inspector-tab").top : H - dock.top + 44;
    } else {
      l = rect("#rail").right;
      r = b.contains("inspector-collapsed") ? 0 : W - rect("#inspector").left;
    }
    const insets = { l: Math.max(0, l), r: Math.max(0, r), t: Math.max(0, t), b: Math.max(0, bottom) };
    Object.entries(insets).forEach(([k, v]) => root.setProperty(`--free-${k}`, `${Math.round(v)}px`));
    state.scene?.setInsets(insets);
    const cap = $("#caption");
    cap.style.left = `${insets.l + (W - insets.l - insets.r) / 2}px`;
    cap.style.top = `${insets.t + (compact ? 8 : 16)}px`;
  }

  /* ================================================================ tooltip */

  let pointer = { x: 0, y: 0 };
  addEventListener("pointermove", e => {
    pointer = { x: e.clientX, y: e.clientY };
    const tip = $("#tooltip");
    if (tip.classList.contains("on")) placeTooltip(tip);
  }, { passive: true });

  function placeTooltip(tip) {
    const x = Math.min(pointer.x + 16, innerWidth - tip.offsetWidth - 8);
    const y = Math.min(pointer.y + 18, innerHeight - tip.offsetHeight - 8);
    tip.style.transform = `translate(${x}px, ${y}px)`;
  }

  function showTooltip(target) {
    const tip = $("#tooltip");
    if (!target) { tip.classList.remove("on"); return; }
    const g = node(target.id);
    const count = g.topics.length, matched = filtersActive() ? g.topics.filter(topicMatches).length : null;
    tip.innerHTML = `<div class="t">${esc(g.name)}</div>
      <div class="r n"><em>${g.kind === "concern" ? "Compass" : esc(g.layer.name)}</em><span>${matched === null ? `${count} topics` : `${matched} of ${count} topics match`}</span></div>
      ${g.mstr ? `<div class="r m"><em>MSTR</em><span>${esc(g.mstr.name)}${g.where === "beside" ? " · customer stack" : ""}</span></div>` : ""}`;
    tip.classList.add("on");
    placeTooltip(tip);
  }

  /* ================================================================ rendering: rail */

  function renderRail() {
    const match = matchSet();
    $("#layer-list").innerHTML = state.layers.map(L => {
      const open = state.focus === L.index;
      const groups = L.groups.map(g => {
        const n = match ? g.topics.filter(topicMatches).length : g.topics.length;
        const sel = selectedNode() === g.id;
        return `<li><button type="button" class="group-btn${sel ? " sel" : ""}${match && !n ? " dim" : ""}" data-group="${esc(g.id)}" data-where="${g.where}">
          <span class="g-name">${esc(mstrOn() && g.mstr ? g.mstr.name : g.name)}</span><span class="g-count">${n}</span></button></li>`;
      }).join("");
      return `<li class="${open ? "open" : ""}" style="--c:${L.color}">
        <button type="button" class="layer-btn" data-layer="${L.index}" aria-expanded="${open}">
          <span class="num">${pad(L.index)}</span>
          <span class="nm"><span class="full">${esc(L.name)}</span><span class="short">${esc(L.name.split(" ")[0])}</span><span class="q">${esc(L.summary)}</span></span>
        </button>
        <ul class="groups">${groups}</ul></li>`;
    }).join("");

    $("#concern-list").innerHTML = [...state.concerns.values()].map(c => {
      const n = match ? c.topics.filter(topicMatches).length : c.topics.length;
      return `<li><button type="button" class="concern-btn${selectedNode() === c.id ? " sel" : ""}${match && !n ? " dim" : ""}" data-concern="${esc(c.id)}" data-where="${c.where}">
        <span class="g-name">${esc(mstrOn() && c.mstr ? c.mstr.name : c.name)}</span><span class="g-count">${n}</span></button></li>`;
    }).join("");

    $("#rail-mini").innerHTML = state.layers.map(L =>
      `<li><button type="button" class="mini-btn${state.focus === L.index ? " on" : ""}" data-layer="${L.index}" style="--c:${L.color}" title="${esc(L.name)}" aria-label="${esc(L.name)}">${pad(L.index)}</button></li>`
    ).join("") + `<li><button type="button" class="mini-btn compass" data-expand="rail" title="Cross-cutting compass" aria-label="Open layers and compass">✣</button></li>`;
  }

  /* ================================================================ rendering: inspector */

  function lensCard(mstr, { title = "", body = "", where } = {}) {
    if (!mstr && !mstrOn()) return "";
    const w = where || (mstr?.where) || "none";
    if (!mstr) {
      return `<div class="lens-card mstr none on"><div class="eyebrow">MicroStrategy lens</div><span>No counterpart in the MicroStrategy platform — this part of the field sits outside the BI boundary.</span></div>`;
    }
    return `<div class="lens-card mstr${mstrOn() ? " on" : ""}" data-where="${w}">
      <div class="eyebrow">MicroStrategy lens · ${esc(WHERE_LABEL[w])}</div>
      ${title ? `<b>${esc(title)}</b>` : ""}${body ? `<span>${esc(body)}</span>` : ""}</div>`;
  }

  function topicButtons(topics, { showGroup = false } = {}) {
    return `<div class="topic-list">${topics.map(t => `<button type="button" class="topic-row" data-topic="${esc(t.id)}" style="--c:${t.color}">
      <span class="tn">${highlight(t.name)}</span>
      ${showGroup ? `<span class="tg">${esc(t.group.name)}</span>` : ""}
      ${t.mstr ? `<span class="tm">${highlight(t.mstr)}</span>` : ""}
    </button>`).join("")}</div>`;
  }

  function milestoneList(list) {
    if (!list.length) return "";
    const seen = new Set();
    const unique = list.filter(m => (seen.has(m.name) ? false : seen.add(m.name))).sort((a, b) => a.year - b.year);
    return `<h4>When it took shape</h4>${unique.map(m => `<div class="ms"><span class="y">${m.year}</span><a href="${esc(m.url)}" target="_blank" rel="noopener">${esc(m.name)} ↗</a><span class="w">${esc(m.why)}</span></div>`).join("")}`;
  }

  function nodeChips(ids) {
    if (!ids.length) return "";
    return `<h4>Connected</h4><div class="chips">${ids.map(id => {
      const n = node(id);
      const color = n.kind === "concern" ? CONCERN_COLOR : n.layer.color;
      return `<button type="button" class="chip" data-${n.kind}="${esc(id)}" style="--c:${color}"><i></i>${esc(n.name)}</button>`;
    }).join("")}</div>`;
  }

  function linkedNodes(id) {
    const out = new Set();
    state.nodeEdges.forEach(([a, b]) => { if (a === id) out.add(b); if (b === id) out.add(a); });
    return [...out];
  }

  function crumb(t) {
    if (t.isConcern) return `<button type="button" class="eyebrow crumb" data-concern="${esc(t.group.id)}" style="--c:${CONCERN_COLOR}"><i></i>Compass · ${esc(t.group.name)}</button>`;
    return `<span class="crumbs"><button type="button" class="eyebrow crumb" data-layer="${t.layer.index}" style="--c:${t.layer.color}"><i></i>${pad(t.layer.index)} · ${esc(t.layer.name)}</button>
      <button type="button" class="eyebrow crumb plain" data-group="${esc(t.group.id)}">/ ${esc(t.group.name)}</button></span>`;
  }

  function relationLabel(c) {
    const labels = RELATION_LABELS[c.type] || [c.type, c.type];
    return labels[c.direction === "out" ? 0 : 1];
  }

  function viewOverview() {
    const topics = state.topics.size, groups = state.groups.size;
    const qs = Object.entries(CONTENT.questions).map(([key, q], i) => `<button type="button" class="q-btn" data-question="${key}" style="--t:${q.color}">
      <span class="n">${i + 1}</span><span><b>${esc(q.label)}</b><span>${q.modernOnly ? "Modern stack · " : ""}${q.steps.length} steps across the layers</span></span></button>`).join("");
    const trails = Object.entries(CONTENT.trails).map(([key, t]) => `<button type="button" class="pill" data-trail="${key}">${esc(t.label)}</button>`).join("");
    return {
      kicker: "A living map of the field",
      html: `<h2 class="hero">Data has layers.<br>AI has <em>depth.</em></h2>
      <p>Trace the terrain from silicon to story. Follow one idea across the stack, switch lenses, or wander until two concepts unexpectedly connect.</p>
      <dl class="stats"><div><dt>${state.layers.length}</dt><dd>layers</dd></div><div><dt>${groups}</dt><dd>groups</dd></div><div><dt>${topics}</dt><dd>topics</dd></div><div><dt>${GRAPH.edges.length}</dt><dd>cross-links</dd></div></dl>
      <div class="lens-card mstr${mstrOn() ? " on" : ""}"><div class="eyebrow">MicroStrategy lens</div><span>Flip the lens below to see which responsibilities sat inside one BI server and metadata repository, which lived in the customer stack beside it, and which have no counterpart. A map of capabilities and decisions — not a claim that each feature has a direct replacement.</span></div>
      <h4>Ask the map a question</h4><div class="qs">${qs}</div>
      <h4>Or follow a role's trail</h4><div class="pills">${trails}</div>
      <h4>Reading the map</h4>
      <ul class="notes">
        <li><b>The spine is singular.</b> Every topic has one home; other relationships are cross-links.</li>
        <li><b>Concerns travel.</b> The pillars behind the stack — security, quality, governance, cost and more — recur at every layer.</li>
        <li><b>The edges will grow.</b> Cross-links are a reviewed seed set, not a claim the field has only ${GRAPH.edges.length} relationships.</li>
      </ul>
      <h4>Controls</h4>
      <div class="keys">
        <kbd>drag</kbd><span>Orbit · right-drag pans · scroll zooms</span>
        <kbd>1–7</kbd><span>Focus a layer · <kbd>0</kbd> reset</span>
        <kbd>L</kbd><span>Switch lens · <kbd>T</kbd> timeline</span>
        <kbd>/</kbd><span>Search · <kbd>← →</kbd> step a trail</span>
        <kbd>[ ]</kbd><span>Hide or show the side panels</span>
        <kbd>Esc</kbd><span>Back out</span>
      </div>`
    };
  }

  function viewLayer(L) {
    const rows = L.groups.map(g => `<button type="button" class="cap-row" data-group="${esc(g.id)}" data-where="${g.where}">
      <span class="b">${esc(g.name)}</span><span class="cnt">${g.topics.length}</span>
      <span class="a">${g.mstr ? esc(g.mstr.name) : "—"}</span></button>`).join("");
    return {
      kicker: `Layer ${pad(L.index)}`,
      html: `<h2 style="--c:${L.color}">${esc(L.name)}</h2>
      <p class="q">${esc(L.summary)}</p>
      <p class="sub">${L.groups.length} groups · ${layerTopicCount(L)} topics</p>
      ${L.mstr ? `<div class="lens-card mstr${mstrOn() ? " on" : ""}"><div class="eyebrow">MicroStrategy lens</div><span>${esc(L.mstr.summary)}</span></div>` : ""}
      <h4>Groups <span class="h4-aside">modern · MicroStrategy</span></h4>
      <div class="cap-table">${rows}</div>`
    };
  }

  function viewGroup(g) {
    const isConcern = g.kind === "concern";
    const facets = isConcern ? "" : `<div class="facet-row">${["role", "stage", "maturity"].map(k => `<span>${k} <b>${esc(pretty(g.facets[k]))}</b></span>`).join("")}</div>`;
    const ms = g.topics.flatMap(t => state.milestonesByTopic.get(t.id) || []);
    return {
      kicker: isConcern ? "Cross-cutting compass" : `Layer ${pad(g.layer.index)} · group`,
      html: `${isConcern ? `<span class="eyebrow crumb" style="--c:${CONCERN_COLOR}"><i></i>Concern with no single home</span>` :
        `<button type="button" class="eyebrow crumb" data-layer="${g.layer.index}" style="--c:${g.layer.color}"><i></i>${pad(g.layer.index)} · ${esc(g.layer.name)}</button>`}
      <h2>${esc(g.name)}</h2>
      ${isConcern ? `<p>A concern that travels through the entire stack — it changes decisions at every layer rather than living in one.</p>` : ""}
      ${facets}
      ${lensCard(g.mstr, { title: g.mstr?.name, body: g.mstr?.note })}
      <h4>Topics · ${g.topics.length}</h4>
      ${topicButtons(g.topics)}
      ${nodeChips(linkedNodes(g.id))}
      ${milestoneList(ms)}`
    };
  }

  function topicIntroduction(t) {
    if (t.isConcern) return `${t.name} is a cross-cutting practice in ${t.group.name}. It belongs on the compass because it changes decisions across every layer rather than living in just one stratum.`;
    return `${t.name} sits in ${t.group.name}, within ${t.layer.name}. Its placement is a primary home for navigation—not a boundary around where the idea applies.`;
  }

  function viewTopic(t) {
    const connections = state.adjacency.get(t.id) || [];
    const siblings = t.group.topics.filter(s => s.id !== t.id);
    const note = CONTENT.editorialNotes[t.id];
    const groupLens = t.group.mstr;
    let card = "";
    if (t.mstr) card = lensCard(groupLens || { where: "inside" }, { title: t.mstr, body: groupLens?.note, where: groupLens?.where });
    else if (groupLens) card = lensCard(groupLens, { title: groupLens.name, body: "No closer MicroStrategy object is mapped for this topic; the group mapping applies." });
    else card = lensCard(null);
    return {
      kicker: t.isConcern ? "Compass topic" : "Topic",
      html: `${crumb(t)}
      <h2>${esc(t.name)}</h2>
      <p>${esc(topicIntroduction(t))}</p>
      <div class="facet-row">${Object.entries(t.facets).map(([k, v]) => `<span>${esc(pretty(k))} <b>${esc(pretty(v))}</b></span>`).join("")}</div>
      ${card}
      ${note ? `<div class="lesson"><span class="eyebrow">Editorial note</span>${esc(note)}</div>` : ""}
      <h4>Cross-links · ${connections.length}</h4>
      ${connections.length ? `<div class="connection-list">${connections.map(c => {
        const other = state.topics.get(c.id);
        return `<button type="button" class="connection" data-topic="${esc(other.id)}" style="--c:${other.color}"><em>${esc(relationLabel(c))}</em><b>${esc(other.name)}</b><small>${esc(other.group.name)}</small></button>`;
      }).join("")}</div>` : `<p class="sub">No authored cross-links yet. This topic is a candidate for the next relationship pass.</p>`}
      ${milestoneList(state.milestonesByTopic.get(t.id) || [])}
      <h4>Nearby in ${esc(t.group.name)}</h4>
      ${topicButtons(siblings)}`
    };
  }

  function viewSearch() {
    const matched = [...state.topics.values()].filter(topicMatches);
    const byGroup = new Map();
    matched.forEach(t => push(byGroup, t.group.id, t));
    const parts = [];
    [...state.layers.flatMap(L => L.groups), ...state.concerns.values()].forEach(g => {
      const list = byGroup.get(g.id);
      if (!list) return;
      parts.push(`<button type="button" class="eyebrow crumb" data-${g.kind}="${esc(g.id)}" style="--c:${g.kind === "concern" ? CONCERN_COLOR : g.layer.color}"><i></i>${esc(g.name)} · ${list.length}</button>${topicButtons(list)}`);
    });
    const desc = [state.query && `“${esc(state.query)}”`, state.role && pretty(state.role), state.stage && pretty(state.stage), state.maturity && pretty(state.maturity)].filter(Boolean).join(" · ");
    return {
      kicker: "Search",
      html: `<h2>${matched.length} of ${state.topics.size} topics</h2>
      <p class="sub">${desc}</p>
      ${matched.length ? parts.join("") : `<div class="empty"><span>∅</span><b>No trail starts there yet.</b><p>Try a broader phrase or clear one of the filters.</p><button type="button" class="pill" data-act="clear">Reset the search</button></div>`}`
    };
  }

  function renderInspector() {
    let v = state.view;
    if (filtersActive() && !state.trace && v.kind !== "topic") v = { kind: "search" };
    let out;
    if (v.kind === "layer") out = viewLayer(state.layers[v.index]);
    else if (v.kind === "group" || v.kind === "concern") out = viewGroup(node(v.id));
    else if (v.kind === "topic") out = viewTopic(state.topics.get(v.id));
    else if (v.kind === "search") out = viewSearch();
    else out = viewOverview();
    $("#inspector-kicker").textContent = out.kicker;
    const body = $("#inspector-body");
    body.innerHTML = out.html;
    body.scrollTop = 0;
    $("#inspector-back").hidden = !state.history.length || Boolean(state.trace);
    $("#inspector-tab-label").textContent = out.kicker === "A living map of the field" ? "Details" : (body.querySelector("h2")?.textContent || out.kicker);
  }

  /* ================================================================ rendering: caption, menus, timeline */

  function renderCaption() {
    const cap = $("#caption"), tr = state.trace;
    if (!tr) { cap.hidden = true; return; }
    const def = traceDef(), step = def.steps[tr.i];
    const t = state.topics.get(stepTopicId(step));
    cap.hidden = false;
    cap.style.setProperty("--t", def.color);
    $("#cap-title").textContent = `${def.label} · ${tr.i + 1} / ${def.steps.length}`;
    const name = t ? `${t.name}${mstrOn() && t.mstr ? ` — ${t.mstr}` : ""}` : "";
    const head = step.title ? (name ? `${step.title} · ${name}` : step.title) : name;
    $("#cap-step").innerHTML = `<i style="--c:${t ? t.color : def.color}"></i>${esc(head)}`;
    let text = tr.kind === "question" ? ((mstrOn() ? step.m : step.n) || step.n) : "";
    if (!text && t) text = t.isConcern ? `A compass point in ${t.group.name}.` : `${t.group.name}, in ${t.layer.name}.`;
    $("#cap-text").textContent = text;
    $("#cap-dots").innerHTML = def.steps.map((_, k) => `<span class="${k <= tr.i ? "on" : ""}"></span>`).join("");
    $("#cap-play").textContent = tr.playing ? "Pause" : (tr.i === def.steps.length - 1 ? "Replay" : "Play");
    $("#cap-prev").disabled = tr.i === 0;
    $("#cap-next").disabled = tr.i === def.steps.length - 1;
    layoutScene();
  }

  function renderTrailMenu() {
    const active = state.trace;
    $("#trail-menu").innerHTML = `<p class="eyebrow">Questions</p>${Object.entries(CONTENT.questions).map(([key, q]) =>
      `<button type="button" class="menu-item" data-question="${key}" style="--t:${q.color}" aria-pressed="${active?.kind === "question" && active.key === key}">${esc(q.label)}${q.modernOnly ? `<small>modern</small>` : ""}</button>`).join("")}
      <p class="eyebrow">Role trails</p>${Object.entries(CONTENT.trails).map(([key, t]) =>
      `<button type="button" class="menu-item" data-trail="${key}" style="--t:#9fdcb6" aria-pressed="${active?.kind === "trail" && active.key === key}">${esc(t.label)}</button>`).join("")}`;
    const def = traceDef();
    $("#trail-btn-label").textContent = def ? def.label : "Trails";
    $("#trail-btn").classList.toggle("active", Boolean(def));
  }

  function renderTimeline() {
    const tl = state.timeline;
    const input = $("#year");
    input.value = tl.year;
    input.style.setProperty("--p", `${((tl.year - YEAR_MIN) / (YEAR_MAX - YEAR_MIN)) * 100}%`);
    $$(".tick").forEach(t => {
      const y = Number(t.dataset.year);
      t.classList.toggle("past", y < tl.year);
      t.classList.toggle("now", y === tl.year);
    });
    const now = CONTENT.milestones.filter(m => m.year === tl.year);
    const landed = CONTENT.milestones.filter(m => m.year <= tl.year).length;
    $("#year-cap").innerHTML = `<span class="yr">${tl.year}</span><span class="tx">${now.length
      ? now.map(m => `<a href="${esc(m.url)}" target="_blank" rel="noopener"><b>${esc(m.name)}</b></a> — ${esc(m.why)}`).join(" ")
      : `${landed} of ${CONTENT.milestones.length} shifts have landed. Wireframe groups are still to come.`}</span>`;
  }

  /* ================================================================ 2D fallback stage */

  function renderFallback() {
    const host = $("#stage-fallback");
    if (host.hidden) return;
    const match = matchSet();
    host.innerHTML = `<div class="flat-stack">${[...state.layers].reverse().map(L => `
      <section class="flat-layer${state.focus === L.index ? " on" : ""}" style="--c:${L.color}">
        <button type="button" class="flat-head" data-layer="${L.index}"><b>${pad(L.index)}</b>${esc(L.name)}<small>${esc(L.summary)}</small></button>
        <div class="flat-groups">${L.groups.map(g => {
          const dim = (match && !match.has(g.id)) || (mstrOn() && g.where === "none");
          return `<button type="button" class="flat-group${dim ? " dim" : ""}${selectedNode() === g.id ? " sel" : ""}" data-group="${esc(g.id)}" data-where="${g.where}">${esc(mstrOn() && g.mstr ? g.mstr.name : g.name)}</button>`;
        }).join("")}</div>
      </section>`).join("")}
      <section class="flat-layer compass" style="--c:${CONCERN_COLOR}"><div class="flat-head"><b>✣</b>Cross-cutting compass<small>Concerns with no single home.</small></div>
        <div class="flat-groups">${[...state.concerns.values()].map(c => `<button type="button" class="flat-group${match && !match.has(c.id) ? " dim" : ""}" data-concern="${esc(c.id)}" data-where="${c.where}">${esc(mstrOn() && c.mstr ? c.mstr.name : c.name)}</button>`).join("")}</div></section>
    </div>`;
  }

  function renderAll() {
    renderRail();
    renderInspector();
    renderCaption();
    renderTrailMenu();
    renderTimeline();
    renderFallback();
    syncScene();
  }

  /* ================================================================ actions */

  function openLayer(index) {
    if (state.trace) stopTrace();
    if (state.focus === index && state.view.kind === "layer") {
      setFocus(null);
      return setView({ kind: "overview" });
    }
    setFocus(index, { render: false });
    setView({ kind: "layer", index });
  }

  function clearFilters({ render = true } = {}) {
    Object.assign(state, { query: "", role: "", stage: "", maturity: "" });
    $("#topic-search").value = "";
    ["role", "stage", "maturity"].forEach(k => { $(`#${k}-filter`).value = ""; });
    $("#filter-count").textContent = "0";
    $("#filter-btn").classList.remove("active");
    if (render) { renderRail(); renderInspector(); renderFallback(); syncScene(); }
  }

  function filtersChanged() {
    const n = [state.role, state.stage, state.maturity].filter(Boolean).length;
    $("#filter-count").textContent = String(n);
    $("#filter-btn").classList.toggle("active", n > 0);
    if (filtersActive() && state.trace) stopTrace();
    if (filtersActive() && state.view.kind === "topic") state.view = { kind: "overview" };
    if (filtersActive() && compactQuery.matches) setPanel("inspector", true);
    renderRail();
    renderInspector();
    renderFallback();
    syncScene();
  }

  function randomTopic() {
    const pool = [...state.topics.values()].filter(topicMatches);
    if (!pool.length) return;
    if (state.trace) stopTrace();
    setView({ kind: "topic", id: pool[Math.floor(Math.random() * pool.length)].id });
  }

  function closePopovers(except) {
    $$(".popover").forEach(p => { if (p.id !== except) p.hidden = true; });
    $$("[aria-controls]").forEach(b => {
      const target = document.getElementById(b.getAttribute("aria-controls"));
      if (target?.classList.contains("popover")) b.setAttribute("aria-expanded", String(!target.hidden));
    });
  }

  function togglePopover(id) {
    const p = document.getElementById(id);
    const open = p.hidden;
    closePopovers(id);
    p.hidden = !open;
    $(`[aria-controls="${id}"]`)?.setAttribute("aria-expanded", String(open));
  }

  /* ---------------- panels: rail, inspector and dock can each be minimized */

  function setPanel(name, open) {
    const cls = `${name}-collapsed`;
    const was = !document.body.classList.contains(cls);
    if (open === undefined) open = !was;
    document.body.classList.toggle(cls, !open);
    $$(`[data-toggle="${name}"]`).forEach(b => b.setAttribute("aria-expanded", String(open)));
    if (name === "dock") { $("#dock-tab").hidden = open; if (!open) closePopovers(); }
    if (name === "inspector") $("#inspector-tab").hidden = open;
    if (compactQuery.matches && open && name === "rail") setPanel("inspector", false);
    layoutScene();
    setTimeout(layoutScene, 360);
  }

  /* ================================================================ URL */

  function writeUrl() {
    const v = state.view;
    let hash = "";
    if (v.kind === "topic") hash = `#topic=${encodeURIComponent(v.id)}`;
    else if (v.kind === "group") hash = `#group=${encodeURIComponent(v.id)}`;
    else if (v.kind === "concern") hash = `#concern=${encodeURIComponent(v.id)}`;
    else if (v.kind === "layer") hash = `#layer=${encodeURIComponent(state.layers[v.index].id)}`;
    const params = new URLSearchParams(location.search);
    if (mstrOn()) params.set("lens", "mstr"); else params.delete("lens");
    const query = params.toString();
    history.replaceState(null, "", `${location.pathname}${query ? `?${query}` : ""}${hash}`);
  }

  function readUrl() {
    // Read the hash first: applying the lens rewrites the URL.
    const m = location.hash.match(/^#(topic|group|concern|layer)=(.+)$/);
    if (m) readHash(m);
    if (new URLSearchParams(location.search).get("lens") === "mstr") setLens("mstr", { silent: true });
  }

  function readHash(m) {
    const id = decodeURIComponent(m[2]);
    if (m[1] === "topic" && state.topics.has(id)) state.view = { kind: "topic", id };
    else if (m[1] === "group" && state.groups.has(id)) state.view = { kind: "group", id };
    else if (m[1] === "concern" && state.concerns.has(id)) state.view = { kind: "concern", id };
    else if (m[1] === "layer") {
      const L = state.layers.find(l => l.id === id);
      if (L) { state.view = { kind: "layer", index: L.index }; state.focus = L.index; }
    }
  }

  /* ================================================================ wiring */

  function wire() {
    // One delegated handler for every data-* action, wherever it is rendered.
    document.addEventListener("click", e => {
      const el = e.target.closest("[data-topic],[data-group],[data-concern],[data-layer],[data-question],[data-trail],[data-lens],[data-toggle],[data-expand],[data-act],[data-year]");
      if (!el || el.closest(".label-layer")) return;
      const d = el.dataset;
      if (d.topic) { if (state.trace) stopTrace(); setView({ kind: "topic", id: d.topic }); }
      else if (d.group) { if (state.trace) stopTrace(); setView({ kind: "group", id: d.group }); }
      else if (d.concern) { if (state.trace) stopTrace(); setView({ kind: "concern", id: d.concern }); }
      else if (d.layer !== undefined) openLayer(Number(d.layer));
      else if (d.question) { if (state.trace?.key === d.question) stopTrace(); else startTrace("question", d.question); }
      else if (d.trail) { if (state.trace?.key === d.trail) stopTrace(); else startTrace("trail", d.trail); }
      else if (d.lens) setLens(d.lens);
      else if (d.toggle) setPanel(d.toggle);
      else if (d.expand) setPanel(d.expand, true);
      else if (d.year) { stopYearPlay(); setYear(Number(d.year)); }
      else if (d.act === "clear") clearFilters();
      else if (d.act === "back") back();
      else if (d.act === "reset") resetAll();
    });

    $("#trail-btn").addEventListener("click", () => togglePopover("trail-menu"));
    $("#filter-btn").addEventListener("click", () => togglePopover("filter-menu"));
    $("#timeline-btn").addEventListener("click", () => setTimeline(!state.timeline.on));
    $("#random-btn").addEventListener("click", randomTopic);
    $("#inspector-tab").addEventListener("click", () => setPanel("inspector", true));
    $("#dock-tab").addEventListener("click", () => setPanel("dock", true));
    document.addEventListener("pointerdown", e => {
      if (!e.target.closest(".popover, [aria-controls]")) closePopovers();
    });

    $("#topic-search").addEventListener("input", e => {
      state.query = e.target.value.trim().toLowerCase();
      if (state.query && state.trace) stopTrace();
      if (state.query && state.view.kind === "topic") state.view = { kind: "overview" };
      if (state.query && compactQuery.matches) setPanel("inspector", true);
      renderRail();
      renderInspector();
      renderFallback();
      syncScene();
    });
    ["role", "stage", "maturity"].forEach(key => {
      const select = $(`#${key}-filter`);
      const values = [...new Set([...state.topics.values()].map(t => t.facets[key]).filter(Boolean))].sort();
      values.forEach(v => select.insertAdjacentHTML("beforeend", `<option value="${esc(v)}">${esc(pretty(v))}</option>`));
      select.addEventListener("change", () => { state[key] = select.value; filtersChanged(); });
    });

    $("#cap-prev").addEventListener("click", () => { if (state.trace) { state.trace.playing = false; goStep(state.trace.i - 1); } });
    $("#cap-next").addEventListener("click", () => { if (state.trace) { state.trace.playing = false; goStep(state.trace.i + 1); } });
    $("#cap-close").addEventListener("click", stopTrace);
    $("#cap-play").addEventListener("click", () => {
      const tr = state.trace;
      if (!tr) return;
      const last = traceDef().steps.length - 1;
      if (tr.i === last) { tr.playing = true; goStep(0); return; }
      tr.playing = !tr.playing;
      if (tr.playing) goStep(tr.i + 1); else { clearTimeout(traceTimer); renderCaption(); }
    });

    const years = [...new Set(CONTENT.milestones.map(m => m.year))];
    $("#ticks").innerHTML = years.map(y => {
      const p = (y - YEAR_MIN) / (YEAR_MAX - YEAR_MIN);
      return `<button type="button" class="tick" data-year="${y}" style="left: calc(7px + (100% - 14px) * ${p})" aria-label="${y}">${String(y).slice(2)}</button>`;
    }).join("");
    $("#year").addEventListener("input", e => { stopYearPlay(); setYear(Number(e.target.value)); });
    $("#year-play").addEventListener("click", () => {
      const tl = state.timeline;
      if (tl.playing) { stopYearPlay(); return; }
      let y = tl.year >= YEAR_MAX ? YEAR_MIN : tl.year;
      setYear(y);
      $("#year-play").textContent = "❚❚";
      $("#year-play").setAttribute("aria-label", "Pause the timeline");
      tl.playing = setInterval(() => {
        y += 1;
        setYear(y);
        if (y >= YEAR_MAX) stopYearPlay();
      }, 750);
    });

    const about = $("#about-dialog");
    $("#close-about")?.addEventListener("click", () => about.close());
    about.addEventListener("click", e => { if (e.target === about) about.close(); });

    document.addEventListener("keydown", e => {
      const typing = e.target instanceof HTMLInputElement || e.target instanceof HTMLSelectElement || e.target instanceof HTMLTextAreaElement;
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        if (document.body.classList.contains("dock-collapsed")) setPanel("dock", true);
        $("#topic-search").focus();
        return;
      }
      if (about.open || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "Escape") {
        if ($$(".popover").some(p => !p.hidden)) closePopovers();
        else if (typing) { e.target.blur(); }
        else if (state.trace) stopTrace();
        else if (filtersActive()) clearFilters();
        else if (back()) { /* stepped back */ }
        else if (state.view.kind !== "overview") setView({ kind: "overview" }, { history: false });
        else if (state.focus !== null) setFocus(null);
        return;
      }
      if (typing) return;
      if (e.key >= "1" && e.key <= String(state.layers.length)) openLayer(Number(e.key) - 1);
      else if (e.key === "0") resetAll();
      else if (e.key === "l" || e.key === "L") setLens(mstrOn() ? "modern" : "mstr");
      else if (e.key === "t" || e.key === "T") setTimeline(!state.timeline.on);
      else if (e.key === "[") setPanel("rail");
      else if (e.key === "]") setPanel("inspector");
      else if (e.key === "/") {
        e.preventDefault();
        if (document.body.classList.contains("dock-collapsed")) setPanel("dock", true);
        $("#topic-search").focus();
      } else if (e.key === "ArrowRight" || e.key === "ArrowLeft") {
        const d = e.key === "ArrowRight" ? 1 : -1;
        if (state.trace) { state.trace.playing = false; goStep(state.trace.i + d); e.preventDefault(); }
        else if (state.timeline.on) { stopYearPlay(); setYear(Math.max(YEAR_MIN, Math.min(YEAR_MAX, state.timeline.year + d))); e.preventDefault(); }
      }
    });

    // "No scaling": the page is one fixed viewport; gestures move the scene, never the document.
    ["gesturestart", "gesturechange"].forEach(ev => document.addEventListener(ev, e => e.preventDefault()));
    addEventListener("wheel", e => { if (e.ctrlKey) e.preventDefault(); }, { passive: false });
    addEventListener("resize", layoutScene);
    new ResizeObserver(layoutScene).observe($("#dock"));
    compactQuery.addEventListener("change", () => { applyDefaultPanels(); layoutScene(); });
  }

  function applyDefaultPanels() {
    const compact = compactQuery.matches;
    setPanel("rail", !compact);
    setPanel("inspector", !compact || state.view.kind !== "overview");
  }

  /* ================================================================ boot */

  let sceneTimeout = 0;

  function init() {
    if (!GRAPH) {
      $("#inspector-body").innerHTML = `<div class="empty"><span>!</span><b>The map data is unavailable.</b><p>js/data-ai-knowledge-graph.js did not load.</p></div>`;
      return;
    }
    buildIndex();
    $("#topic-search").placeholder = `Search ${state.topics.size} topics…`;
    $("#review-stamp-copy").textContent = `${state.topics.size} unique topics · ${state.groups.size} groups · ${GRAPH.edges.length} cross-links · 0 broken references`;
    readUrl();
    document.body.dataset.lens = state.lens;
    $("#lens-seg").dataset.v = state.lens;
    $$("#lens-seg [data-lens]").forEach(b => b.setAttribute("aria-pressed", String(b.dataset.lens === state.lens)));
    wire();
    applyDefaultPanels();
    renderAll();

    window.atlasPage = { attachScene, sceneUnavailable };
    window.dispatchEvent(new Event("atlas:ready"));
    // Modules do not load from file://, and some devices lack WebGL: the 2D
    // stack takes over if the 3D scene has not attached in time.
    if (location.protocol === "file:") sceneUnavailable();
    else sceneTimeout = setTimeout(sceneUnavailable, 6000);
  }

  init();
})();
