// Three.js layer stack for the homepage atlas.
//
// A component, not a page: it renders from a spec and reports back through
// callbacks. It does not read the graph, the URL or the DOM panels. The page
// (js/knowledge-atlas.js) owns data, routing and every piece of text.
//
//   const scene = createAtlasScene(container, spec, { onSelect, onHover });
//   scene.update(view);          // lens, focus, selection, search matches, trace, timeline
//   scene.setInsets({ l, r, t, b });
//   scene.focusLayer(index | null);
//
// spec = {
//   layers:   [{ name, color, groups: [{ id, label, mstrLabel, where }] }],
//   concerns: [{ id, label, mstrLabel, where }],
//   edges:    [[nodeId, nodeId], …],          // group or concern ids
// }
// `where` is the MicroStrategy lens placement: "inside" | "beside" | "none".

import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";
import { CSS2DRenderer, CSS2DObject } from "three/addons/renderers/CSS2DRenderer.js";
import { EffectComposer } from "three/addons/postprocessing/EffectComposer.js";
import { RenderPass } from "three/addons/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/addons/postprocessing/UnrealBloomPass.js";
import { OutputPass } from "three/addons/postprocessing/OutputPass.js";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { RoomEnvironment } from "three/addons/environments/RoomEnvironment.js";

const GAP = 1.7, SLAB_W = 20, SLAB_D = 6.4, N_SEG = 28;
const MONO_W = 5.9, MONO_D = 2.7, MSTR_RED = "#ff5470", CONCERN = "#d8f46a";
const PILLAR_Z = -SLAB_D / 2 - 0.9;
const layerY = (i) => i * GAP;

const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const lerp = (a, b, t) => a + (b - a) * t;
const ease = (t) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);
const smooth = (t) => { t = clamp(t); return t * t * (3 - 2 * t); };

export function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") || canvas.getContext("webgl"));
  } catch {
    return false;
  }
}

export function createAtlasScene(container, spec, { onSelect = () => {}, onHover = () => {} } = {}) {
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const nLayers = spec.layers.length;
  const top = layerY(nLayers - 1);

  /* ------------------------------------------------------------------ renderer */
  const renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: "high-performance" });
  renderer.setPixelRatio(Math.min(devicePixelRatio, 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.05;
  renderer.domElement.setAttribute("aria-hidden", "true");
  container.appendChild(renderer.domElement);

  const labelRenderer = new CSS2DRenderer();
  labelRenderer.domElement.className = "label-layer";
  container.appendChild(labelRenderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x060a14);
  scene.fog = new THREE.FogExp2(0x060a14, 0.0135);
  scene.environment = new THREE.PMREMGenerator(renderer).fromScene(new RoomEnvironment(renderer), 0.04).texture;
  scene.add(new THREE.HemisphereLight(0x9bb7ff, 0x0a0f1e, 0.7));
  const keyLight = new THREE.DirectionalLight(0xffffff, 1.4);
  keyLight.position.set(8, 22, 12);
  scene.add(keyLight);

  const camera = new THREE.PerspectiveCamera(38, 1, 0.1, 400);
  const HOME_TARGET = new THREE.Vector3(0, top / 2 - 0.2, 0);
  const HOME_DIR = new THREE.Vector3(15.5, 7.4, 17.5).normalize();
  const homeDistance = () => (innerWidth <= 820 ? 52 : 43);
  camera.position.copy(HOME_DIR).multiplyScalar(homeDistance()).add(HOME_TARGET);

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.target.copy(HOME_TARGET);
  Object.assign(controls, { enableDamping: true, dampingFactor: 0.08, minDistance: 6, maxDistance: 70, maxPolarAngle: Math.PI * 0.49, screenSpacePanning: true, rotateSpeed: 0.7 });

  const composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));
  const bloom = new UnrealBloomPass(new THREE.Vector2(256, 256), 0.7, 0.55, 0.24);
  composer.addPass(bloom);
  composer.addPass(new OutputPass());

  /* ------------------------------------------------------------------ textures */
  const DOT = (() => {
    const c = document.createElement("canvas"); c.width = c.height = 64;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, "rgba(255,255,255,1)"); grd.addColorStop(0.22, "rgba(255,255,255,0.85)"); grd.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 64, 64);
    return new THREE.CanvasTexture(c);
  })();
  const GRID = (() => {
    const w = 1024, h = Math.round((1024 * SLAB_D) / SLAB_W);
    const c = document.createElement("canvas"); c.width = w; c.height = h;
    const g = c.getContext("2d"), step = w / (SLAB_W * 2);
    g.strokeStyle = "rgba(255,255,255,0.22)"; g.lineWidth = 1;
    for (let x = step; x < w; x += step) { g.beginPath(); g.moveTo(x + 0.5, 0); g.lineTo(x + 0.5, h); g.stroke(); }
    for (let y = step; y < h; y += step) { g.beginPath(); g.moveTo(0, y + 0.5); g.lineTo(w, y + 0.5); g.stroke(); }
    g.fillStyle = "rgba(255,255,255,0.55)";
    for (let x = step * 4; x < w; x += step * 4) for (let y = step * 4; y < h; y += step * 4) g.fillRect(x - 1.5, y - 1.5, 3, 3);
    const t = new THREE.CanvasTexture(c); t.anisotropy = 4; return t;
  })();

  /* ------------------------------------------------------------------ ground */
  const grid = new THREE.GridHelper(140, 90, 0x1b2a4a, 0x111a30);
  grid.position.y = -1.4; grid.material.transparent = true; grid.material.opacity = 0.55;
  scene.add(grid);
  {
    const c = document.createElement("canvas"); c.width = c.height = 256;
    const g = c.getContext("2d");
    const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
    grd.addColorStop(0, "rgba(90,140,255,0.45)"); grd.addColorStop(0.5, "rgba(60,90,200,0.12)"); grd.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = grd; g.fillRect(0, 0, 256, 256);
    const glow = new THREE.Mesh(new THREE.PlaneGeometry(40, 26), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(c), transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    glow.rotation.x = -Math.PI / 2; glow.position.y = -1.35; scene.add(glow);
  }
  const dust = (() => {
    const n = 700, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) pos.set([(Math.random() - 0.5) * 100, Math.random() * 44 - 6, (Math.random() - 0.5) * 100], i * 3);
    const geo = new THREE.BufferGeometry(); geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    const p = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.09, map: DOT, color: 0x6f8fd8, transparent: true, opacity: 0.5, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(p); return p;
  })();

  /* ------------------------------------------------------------------ labels */
  function cssLabel(className, html) {
    const wrap = document.createElement("div");
    wrap.className = `${className}-wrap`;
    wrap.innerHTML = html;
    const obj = new CSS2DObject(wrap);
    scene.add(obj);
    return { wrap, el: wrap.firstElementChild, obj };
  }

  /* ------------------------------------------------------------------ slabs */
  const slabGeo = new THREE.BoxGeometry(SLAB_W, 0.05, SLAB_D);
  const slabEdgeGeo = new THREE.EdgesGeometry(slabGeo);
  const slabs = spec.layers.map((layer, i) => {
    const color = new THREE.Color(layer.color);
    const g = new THREE.Group();
    g.position.y = layerY(i) - 0.19;
    const body = new THREE.Mesh(slabGeo, new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: 0.12, transparent: true, opacity: 0.07, roughness: 0.25, metalness: 0.1, depthWrite: false }));
    const edges = new THREE.LineSegments(slabEdgeGeo, new THREE.LineBasicMaterial({ color, transparent: true, opacity: 0.6 }));
    const gridMesh = new THREE.Mesh(new THREE.PlaneGeometry(SLAB_W, SLAB_D), new THREE.MeshBasicMaterial({ map: GRID, color, transparent: true, opacity: 0.22, depthWrite: false, blending: THREE.AdditiveBlending }));
    gridMesh.rotation.x = -Math.PI / 2; gridMesh.position.y = 0.03;
    body.renderOrder = 1; gridMesh.renderOrder = 2;
    g.add(body, edges, gridMesh);
    scene.add(g);
    const label = cssLabel("ll", `<button type="button" class="ll" style="--c:${layer.color}" tabindex="-1"><b>${String(i + 1).padStart(2, "0")}</b>${escapeHtml(layer.name)}</button>`);
    label.obj.position.set(-SLAB_W / 2 - 0.35, layerY(i) - 0.19, SLAB_D / 2);
    label.el.addEventListener("click", () => onSelect("layer", i));
    return { g, body, edges, gridMesh, label, alpha: 1 };
  });

  /* ------------------------------------------------------------------ nodes */
  const bodyGeo = new RoundedBoxGeometry(0.82, 0.3, 0.82, 4, 0.08);
  const topGeo = new THREE.PlaneGeometry(0.56, 0.56);
  const ringGeo = new THREE.RingGeometry(0.64, 0.71, 56);
  const nodes = [];
  const byId = new Map();
  const pickables = [];

  spec.layers.forEach((layer, li) => {
    const groups = layer.groups;
    const k = groups.length, span = Math.min(17.6, 2.3 * (k - 1));
    const inside = groups.filter((g) => g.where === "inside");
    const outside = groups.filter((g) => g.where !== "inside");
    groups.forEach((group, i) => {
      const x = k === 1 ? 0 : -span / 2 + (span * i) / (k - 1);
      const posModern = new THREE.Vector3(x, layerY(li), (i % 2 === 0 ? -1 : 1) * (k > 4 ? 1.4 : 0.85));
      let posMstr;
      if (!inside.length) posMstr = posModern.clone();
      else if (group.where === "inside") {
        const j = inside.indexOf(group), n = inside.length, sp = 1.4;
        posMstr = new THREE.Vector3(-((n - 1) * sp) / 2 + j * sp, layerY(li), n > 2 ? (j % 2 === 0 ? -0.5 : 0.5) : 0);
      } else {
        const j = outside.indexOf(group), half = Math.ceil(outside.length / 2);
        const left = j < half, side = left ? outside.slice(0, half) : outside.slice(half);
        const idx = left ? j : j - half, n = side.length;
        const lo = left ? -9.4 : 4.2, hi = left ? -4.2 : 9.4;
        const xx = n === 1 ? (lo + hi) / 2 : lo + ((hi - lo) * idx) / (n - 1);
        posMstr = new THREE.Vector3(xx, layerY(li), (idx % 2 === 0 ? -1 : 1) * 1.55);
      }
      addNode({ ...group, kind: "group", layer: li, color: layer.color, posModern, posMstr });
    });
  });

  function addNode(def) {
    const color = new THREE.Color(def.color);
    const g = new THREE.Group();
    const body = new THREE.Mesh(bodyGeo, new THREE.MeshStandardMaterial({ color: 0x0f1930, metalness: 0.55, roughness: 0.3, emissive: color, emissiveIntensity: 0.2, transparent: true }));
    const topPlate = new THREE.Mesh(topGeo, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.9 }));
    topPlate.rotation.x = -Math.PI / 2; topPlate.position.y = 0.156;
    const ring = new THREE.Mesh(ringGeo, new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    ring.rotation.x = -Math.PI / 2; ring.position.y = -0.13;
    g.add(body, topPlate, ring);
    body.userData.id = def.id;
    scene.add(g);
    pickables.push(body);
    const label = cssLabel("nl", `<div class="nl" style="--c:${def.color}"><i></i><span></span></div>`);
    wireLabel(label.el, def.id);
    const node = { ...def, text: def.label, colorObj: color, cur: def.posModern.clone(), g, body, topPlate, ring, label, textEl: label.el.lastElementChild,
      alpha: 1, labelA: 0, hoverK: 0, flashUntil: 0, shownLens: null, w: 0, h: 0, clutter: false };
    nodes.push(node);
    byId.set(def.id, node);
  }

  function wireLabel(el, id) {
    el.addEventListener("pointerenter", () => setHover(id));
    el.addEventListener("pointerleave", () => setHover(null));
    el.addEventListener("click", () => { const n = byId.get(id); onSelect(n.kind, id); });
  }

  /* ------------------------------------------------------------------ concern pillars */
  const pillarH = top + 1.6, pillarY = -0.9 + pillarH / 2;
  const pillarGeo = new THREE.CylinderGeometry(0.045, 0.045, pillarH, 8);
  const pillarHitGeo = new THREE.CylinderGeometry(0.45, 0.45, pillarH, 8);
  const concernColor = new THREE.Color(CONCERN);
  const pillars = spec.concerns.map((concern, i) => {
    const n = spec.concerns.length;
    const x = -8.6 + (17.2 * i) / Math.max(1, n - 1);
    const g = new THREE.Group();
    g.position.set(x, pillarY, PILLAR_Z);
    const beam = new THREE.Mesh(pillarGeo, new THREE.MeshBasicMaterial({ color: concernColor, transparent: true, opacity: 0.55, depthWrite: false, blending: THREE.AdditiveBlending }));
    const hit = new THREE.Mesh(pillarHitGeo, new THREE.MeshBasicMaterial({ visible: false }));
    hit.userData.id = concern.id;
    g.add(beam, hit);
    scene.add(g);
    pickables.push(hit);
    const beads = new THREE.Points(new THREE.BufferGeometry().setAttribute("position", new THREE.BufferAttribute(new Float32Array(spec.layers.flatMap((_, li) => [x, layerY(li) - 0.15, PILLAR_Z])), 3)),
      new THREE.PointsMaterial({ size: 0.34, map: DOT, color: concernColor, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    scene.add(beads);
    const label = cssLabel("cl", `<div class="cl"><span></span></div>`);
    label.obj.position.set(x, -0.9 + pillarH + (i % 2 ? 0.5 : 0.05), PILLAR_Z);
    wireLabel(label.el, concern.id);
    const node = { ...concern, text: concern.label, kind: "concern", layer: null, colorObj: concernColor, g, beam, beads, label, textEl: label.el.firstElementChild,
      posModern: new THREE.Vector3(x, pillarY, PILLAR_Z), cur: new THREE.Vector3(x, pillarY, PILLAR_Z),
      alpha: 1, labelA: 0, hoverK: 0, flashUntil: 0, shownLens: null, w: 0, h: 0, clutter: false };
    node.posMstr = node.posModern;
    nodes.push(node);
    byId.set(concern.id, node);
    return node;
  });

  /* ------------------------------------------------------------------ MicroStrategy monolith */
  const insideLayers = spec.layers.map((l, i) => (l.groups.some((g) => g.where === "inside") ? i : -1)).filter((i) => i >= 0);
  const mono = (() => {
    const lo = insideLayers.length ? Math.min(...insideLayers) : 1, hi = insideLayers.length ? Math.max(...insideLayers) : nLayers - 1;
    const y0 = layerY(lo) - 0.7, y1 = layerY(hi) + 0.6, h = y1 - y0;
    const g = new THREE.Group(); g.position.y = y0 + h / 2;
    const geo = new THREE.BoxGeometry(MONO_W, h, MONO_D);
    const red = new THREE.Color(MSTR_RED);
    const body = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: red, emissive: red, emissiveIntensity: 0.12, transparent: true, opacity: 0.08, depthWrite: false, roughness: 0.15 }));
    body.renderOrder = 3;
    const edges = new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xff6b85, transparent: true, opacity: 0.9 }));
    const scan = new THREE.Mesh(new THREE.PlaneGeometry(MONO_W - 0.1, MONO_D - 0.1), new THREE.MeshBasicMaterial({ color: red, transparent: true, opacity: 0.18, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide }));
    scan.rotation.x = -Math.PI / 2;
    g.add(body, edges, scan);
    scene.add(g);
    const title = cssLabel("ml", `<div class="ml"><div class="k">MicroStrategy</div><div class="s">one server · one metadata repository</div></div>`);
    title.obj.position.set(0, top + 2.6, 0);
    const note = cssLabel("ml", `<div class="note"><b>Inside</b> the box: MicroStrategy itself · <span class="dash">dashed</span>: the customer stack it sat on · faded: no counterpart</div>`);
    note.obj.position.set(0, -1.05, SLAB_D / 2 + 0.6);
    return { g, body, edges, scan, h, title, note };
  })();
  const fieldTitle = cssLabel("ml", `<div class="ml field"><div class="k">The modern field</div><div class="s">silicon to story · seven layers</div></div>`);
  fieldTitle.obj.position.set(0, top + 2.6, 0);

  /* ------------------------------------------------------------------ edges & flow */
  const tmpA = new THREE.Vector3(), tmpB = new THREE.Vector3(), c1 = new THREE.Vector3(), c2 = new THREE.Vector3();
  function endpoint(node, other, out) {
    if (node.kind === "concern") return out.set(node.cur.x, other.kind === "concern" ? layerY(nLayers - 1) : other.cur.y, node.cur.z);
    return out.copy(node.cur);
  }
  function curveBetween(a, b, out) {
    const p0 = endpoint(a, b, tmpA), p3 = endpoint(b, a, tmpB);
    const dy = p3.y - p0.y;
    if (Math.abs(dy) < 0.01) {
      const lift = 0.45 + p0.distanceTo(p3) * 0.08;
      if (a.kind !== "concern") p0.y += 0.15;
      if (b.kind !== "concern") p3.y += 0.15;
      c1.set(p0.x, p0.y + lift, p0.z); c2.set(p3.x, p3.y + lift, p3.z);
    } else {
      const s = Math.sign(dy);
      p0.y += 0.15 * s; p3.y -= 0.15 * s;
      const k = (p3.y - p0.y) * 0.55;
      c1.set(p0.x, p0.y + k, p0.z); c2.set(p3.x, p3.y - k, p3.z);
    }
    for (let i = 0; i < out.length; i++) {
      const t = i / (out.length - 1), u = 1 - t;
      out[i].set(
        u * u * u * p0.x + 3 * u * u * t * c1.x + 3 * u * t * t * c2.x + t * t * t * p3.x,
        u * u * u * p0.y + 3 * u * u * t * c1.y + 3 * u * t * t * c2.y + t * t * t * p3.y,
        u * u * u * p0.z + 3 * u * u * t * c1.z + 3 * u * t * t * c2.z + t * t * t * p3.z,
      );
    }
  }
  function sample(pts, u, out) {
    const f = clamp(u) * (pts.length - 1), i = Math.min(pts.length - 2, Math.floor(f));
    return out.lerpVectors(pts[i], pts[i + 1], f - i);
  }

  const neighbors = new Map(nodes.map((n) => [n.id, new Set()]));
  const edges = spec.edges.filter(([a, b]) => byId.has(a) && byId.has(b) && a !== b).map(([a, b]) => {
    neighbors.get(a).add(b); neighbors.get(b).add(a);
    const A = byId.get(a), B = byId.get(b);
    const pts = Array.from({ length: N_SEG }, () => new THREE.Vector3());
    const pos = new Float32Array(N_SEG * 3), col = new Float32Array(N_SEG * 3);
    for (let i = 0; i < N_SEG; i++) { const c = A.colorObj.clone().lerp(B.colorObj, i / (N_SEG - 1)); col.set([c.r, c.g, c.b], i * 3); }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.4, depthWrite: false, blending: THREE.AdditiveBlending }));
    line.frustumCulled = false;
    scene.add(line);
    return { A, B, pts, pos, line, alpha: 0.4, phase: Math.random() };
  });

  const PER_EDGE = 2;
  const flow = (() => {
    const n = Math.max(1, edges.length * PER_EDGE);
    const geo = new THREE.BufferGeometry();
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    geo.setAttribute("position", new THREE.BufferAttribute(pos, 3));
    geo.setAttribute("color", new THREE.BufferAttribute(col, 3));
    const pts = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.22, map: DOT, vertexColors: true, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pts.frustumCulled = false;
    scene.add(pts);
    return { geo, pos, col };
  })();

  const TRAIL_MAX = 24 * N_SEG;
  const trail = (() => {
    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(new Float32Array(TRAIL_MAX * 3), 3));
    geo.setDrawRange(0, 0);
    const line = new THREE.Line(geo, new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95, depthWrite: false, blending: THREE.AdditiveBlending }));
    const beads = new THREE.Points(geo, new THREE.PointsMaterial({ size: 0.13, map: DOT, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    line.frustumCulled = beads.frustumCulled = false;
    const pulse = new THREE.Sprite(new THREE.SpriteMaterial({ map: DOT, color: 0xffffff, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
    pulse.scale.setScalar(1.1); pulse.visible = false;
    scene.add(line, beads, pulse);
    return { geo, line, beads, pulse, seg: Array.from({ length: N_SEG }, () => new THREE.Vector3()), anim: null, key: "" };
  })();

  /* ------------------------------------------------------------------ view state */
  let view = { lens: "modern", focusLayer: null, selected: null, match: null, trace: null, timeline: null };
  let lensT = 0, lensTween = null, camTween = null, hover = null, flashToken = null;
  let insets = { l: 0, r: 0, t: 0, b: 0 }, W = 1, H = 1;

  function update(next) {
    const prev = view;
    view = { ...view, ...next };
    if (prev.lens !== view.lens) {
      const to = view.lens === "mstr" ? 1 : 0;
      lensTween = reduced ? null : { from: lensT, to, start: performance.now(), dur: 1700 };
      if (!lensTween) lensT = to;
    }
    const tl = view.timeline;
    if (tl && tl.flashToken !== flashToken) {
      flashToken = tl.flashToken;
      const until = performance.now() / 1000 + 2.6;
      tl.flash?.forEach((id) => { const n = byId.get(id); if (n) n.flashUntil = until; });
    }
    const tr = view.trace;
    const key = tr ? `${tr.path.join(">")}|${tr.color}|${view.lens}` : "";
    if (key !== trail.key) {
      const prevPath = trail.key ? trail.key.split("|")[0].split(">") : [];
      const grew = tr && tr.path.length === prevPath.length + 1 && prevPath.every((id, i) => tr.path[i] === id);
      trail.key = key;
      const last = tr?.path.at(-1), before = tr?.path.at(-2);
      trail.anim = grew && last && before && last !== before ? { from: before, to: last, start: performance.now(), dur: reduced ? 1 : 900 } : null;
      if (tr) { trail.line.material.color.set(tr.color); trail.beads.material.color.set(tr.color); trail.pulse.material.color.set(tr.color); }
      buildTrail();
    }
  }

  function buildTrail() {
    const tr = view.trace;
    if (!tr) { trail.geo.setDrawRange(0, 0); trail.pulse.visible = false; return; }
    const ids = tr.path.filter((id) => byId.has(id));
    const upto = trail.anim ? ids.length - 1 : ids.length;
    const pos = trail.geo.attributes.position.array;
    let k = 0;
    for (let j = 1; j < upto; j++) {
      if (ids[j] === ids[j - 1]) continue;
      curveBetween(byId.get(ids[j - 1]), byId.get(ids[j]), trail.seg);
      for (const p of trail.seg) { if (k >= TRAIL_MAX) break; pos.set([p.x, p.y, p.z], k * 3); k++; }
    }
    trail.geo.attributes.position.needsUpdate = true;
    trail.geo.setDrawRange(0, k);
  }

  function setHover(id) {
    if (id === hover) return;
    hover = id;
    renderer.domElement.style.cursor = id ? "pointer" : "";
    const n = id && byId.get(id);
    onHover(n ? { kind: n.kind, id } : null);
  }

  /* ------------------------------------------------------------------ camera */
  function tweenCamera(pos, target, dur = 1100) {
    if (reduced) { camera.position.copy(pos); controls.target.copy(target); return; }
    camTween = { p0: camera.position.clone(), t0: controls.target.clone(), p1: pos.clone(), t1: target.clone(), start: performance.now(), dur };
  }
  function focusLayer(i) {
    if (i === null || i === undefined) {
      tweenCamera(HOME_DIR.clone().multiplyScalar(homeDistance()).add(HOME_TARGET), HOME_TARGET);
      return;
    }
    const target = new THREE.Vector3(0, layerY(i), 0);
    const dir = camera.position.clone().sub(controls.target); dir.y = 0;
    if (dir.lengthSq() < 0.01) dir.set(1, 0, 1);
    dir.normalize();
    const dist = innerWidth <= 820 ? 36 : 28;
    tweenCamera(target.clone().add(dir.multiplyScalar(dist * Math.cos(0.6))).add(new THREE.Vector3(0, dist * Math.sin(0.6), 0)), target);
  }

  /* ------------------------------------------------------------------ picking */
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  let down = null;
  function pick(e) {
    const r = renderer.domElement.getBoundingClientRect();
    ndc.set(((e.clientX - r.left) / r.width) * 2 - 1, -((e.clientY - r.top) / r.height) * 2 + 1);
    raycaster.setFromCamera(ndc, camera);
    const hits = raycaster.intersectObjects(pickables.filter((p) => byId.get(p.userData.id).alpha > 0.15), false);
    // Prefer a node box over a pillar it happens to sit in front of.
    const hit = hits.find((h) => byId.get(h.object.userData.id).kind === "group") || hits[0];
    return hit ? hit.object.userData.id : null;
  }
  const canvas = renderer.domElement;
  canvas.addEventListener("pointerdown", (e) => { down = { x: e.clientX, y: e.clientY }; });
  canvas.addEventListener("pointermove", (e) => { if (!e.buttons) setHover(pick(e)); });
  canvas.addEventListener("pointerleave", () => setHover(null));
  canvas.addEventListener("pointerup", (e) => {
    if (!down || Math.hypot(e.clientX - down.x, e.clientY - down.y) > 5) return;
    const id = pick(e);
    if (id) onSelect(byId.get(id).kind, id);
    else onSelect(null, null);
  });
  controls.addEventListener("start", () => { camTween = null; });

  /* ------------------------------------------------------------------ layout */
  function resize() {
    W = container.clientWidth || innerWidth; H = container.clientHeight || innerHeight;
    renderer.setSize(W, H);
    composer.setSize(W, H);
    bloom.setSize(W, H);
    labelRenderer.setSize(W, H);
    camera.aspect = W / H;
    camera.fov = W <= 980 ? 46 : 38;
    const sx = (insets.l - insets.r) / 2, sy = (insets.t - insets.b) / 2;
    camera.setViewOffset(W, H, -sx, -sy, W, H);
    camera.updateProjectionMatrix();
  }
  function setInsets(next) { insets = { ...insets, ...next }; resize(); }
  const ro = new ResizeObserver(resize);
  ro.observe(container);

  /* ------------------------------------------------------------------ frame */
  const v3 = new THREE.Vector3(), v3b = new THREE.Vector3();
  let last = performance.now(), frameNo = 0, lastT = -1;

  function nodeAlpha(n) {
    const v = view;
    let a = 1;
    if (lensT > 0.5 && n.where !== "inside" && n.where !== "beside") a = n.kind === "concern" ? 0.3 : 0.16;
    if (v.timeline) {
      if (v.timeline.ghost.has(n.id)) a *= 0.12;
      else if (!v.timeline.lit.has(n.id)) a *= 0.35;
    }
    if (v.match && !v.match.has(n.id)) a *= 0.1;
    if (v.focusLayer !== null && n.layer !== v.focusLayer) a *= n.kind === "concern" ? 0.5 : 0.2;
    if (v.trace) a = v.trace.visited.has(n.id) ? Math.max(a, 1) : a * 0.22;
    else if (v.selected && v.selected !== n.id && !neighbors.get(v.selected)?.has(n.id)) a *= 0.35;
    return a;
  }

  function declutter() {
    const placed = [];
    for (const s of slabs) {
      if (s.label.wrap.style.display === "none") continue;
      const r = s.label.el.getBoundingClientRect();
      if (r.width) placed.push({ x0: r.left, x1: r.right, y0: r.top, y1: r.bottom });
    }
    const box = container.getBoundingClientRect();
    const current = view.trace?.current;
    const cand = [];
    for (const n of nodes) {
      if (n.alpha < 0.3 && n.id !== hover && n.id !== view.selected && n.id !== current) { n.clutter = true; continue; }
      if (!n.w) { n.w = n.label.el.offsetWidth; n.h = n.label.el.offsetHeight; }
      v3.copy(n.label.obj.position).project(camera);
      const x = box.left + ((v3.x + 1) / 2) * W, y = box.top + ((1 - v3.y) / 2) * H - (n.kind === "concern" ? 0 : 22);
      const pri = (n.id === view.selected ? 1000 : 0) + (n.id === hover ? 900 : 0) + (n.id === current ? 800 : 0)
        + (view.trace?.visited.has(n.id) ? 400 : 0) + (view.match?.has(n.id) ? 350 : 0) + (view.focusLayer === n.layer ? 300 : 0)
        + (view.selected && neighbors.get(view.selected)?.has(n.id) ? 250 : 0) + (n.kind === "concern" ? 60 : 0) + n.alpha * 100 - v3.z * 50;
      cand.push({ n, pri, x0: x - n.w / 2 - 2, x1: x + n.w / 2 + 2, y0: y - n.h / 2 - 1, y1: y + n.h / 2 + 1 });
    }
    cand.sort((a, b) => b.pri - a.pri);
    for (const c of cand) {
      const hit = placed.some((p) => c.x0 < p.x1 && c.x1 > p.x0 && c.y0 < p.y1 && c.y1 > p.y0);
      c.n.clutter = hit && c.pri < 800;
      if (!c.n.clutter) placed.push(c);
    }
  }

  let raf = 0;
  function frame(now) {
    raf = requestAnimationFrame(frame);
    const dt = Math.min(0.05, (now - last) / 1000); last = now;
    const time = now / 1000;
    frameNo++;

    if (lensTween) {
      const k = clamp((now - lensTween.start) / lensTween.dur);
      lensT = lerp(lensTween.from, lensTween.to, k);
      if (k >= 1) lensTween = null;
    }
    const e = ease(lensT);
    const mstrShown = lensT >= 0.5;

    if (camTween) {
      const k = ease(clamp((now - camTween.start) / camTween.dur));
      camera.position.lerpVectors(camTween.p0, camTween.p1, k);
      controls.target.lerpVectors(camTween.t0, camTween.t1, k);
      if (k >= 1) camTween = null;
    }
    controls.update();

    slabs.forEach((s, i) => {
      const target = view.focusLayer === null || view.focusLayer === i ? 1 : 0.25;
      s.alpha += (target - s.alpha) * Math.min(1, dt * 7);
      s.edges.material.opacity = 0.5 * s.alpha;
      s.gridMesh.material.opacity = 0.2 * s.alpha;
      s.body.material.opacity = 0.06 * s.alpha;
      s.label.el.style.opacity = view.focusLayer === null || view.focusLayer === i ? 1 : 0.45;
      s.label.el.classList.toggle("on", view.focusLayer === i);
    });

    const mA = smooth(e * 1.4 - 0.2);
    mono.g.visible = mA > 0.01;
    mono.body.material.opacity = 0.08 * mA;
    mono.edges.material.opacity = 0.9 * mA;
    mono.scan.material.opacity = 0.2 * mA;
    mono.scan.position.y = Math.sin(time * 0.7) * (mono.h / 2 - 0.2);
    mono.g.scale.set(lerp(1.5, 1, e), lerp(1.04, 1, e), lerp(1.5, 1, e));
    mono.title.obj.visible = mono.note.obj.visible = mA > 0.05;
    mono.title.wrap.style.opacity = mono.note.wrap.style.opacity = mA.toFixed(2);
    const fA = 1 - smooth(e * 2);
    fieldTitle.obj.visible = fA > 0.05;
    fieldTitle.wrap.style.opacity = fA.toFixed(2);

    const visited = view.trace?.visited, current = view.trace?.current;
    for (const n of nodes) {
      const target = nodeAlpha(n);
      n.alpha += (target - n.alpha) * Math.min(1, dt * 7);
      const hot = n.id === hover || n.id === view.selected || n.id === current;
      n.hoverK += ((hot ? 1 : 0) - n.hoverK) * Math.min(1, dt * 10);
      const flashing = n.flashUntil > time;

      if (n.kind === "group") {
        n.cur.lerpVectors(n.posModern, n.posMstr, e);
        n.g.position.copy(n.cur);
        n.g.position.y += Math.sin(time * 1.1 + n.cur.x * 0.7 + n.layer) * 0.022;
        const none = n.where !== "inside" && n.where !== "beside";
        const k = (none ? lerp(1, 0.62, e) : 1) * (1 + 0.15 * n.hoverK);
        n.g.scale.setScalar(k);
        n.body.material.opacity = n.alpha;
        n.body.material.depthWrite = n.alpha > 0.9;
        n.body.material.wireframe = Boolean(view.timeline?.ghost.has(n.id));
        n.body.material.emissiveIntensity = 0.16 + 0.55 * n.hoverK + (visited?.has(n.id) ? 0.25 : 0);
        n.topPlate.material.opacity = 0.9 * n.alpha;
        const ringOn = n.id === view.selected || n.id === current || flashing;
        n.ring.material.opacity = ringOn ? (0.55 + 0.4 * Math.sin(time * 5)) * Math.max(n.alpha, 0.6) : 0;
        n.ring.material.color.set(n.id === current && view.trace ? view.trace.color : flashing ? "#5ee6c8" : "#ffffff");
        n.ring.scale.setScalar(1 + (flashing ? 0.25 * Math.sin(time * 6) ** 2 : 0));
        n.label.obj.position.set(n.g.position.x, n.g.position.y + 0.2, n.g.position.z);
      } else {
        const glow = n.alpha * (0.45 + 0.5 * n.hoverK) + (flashing ? 0.4 * Math.sin(time * 6) ** 2 : 0);
        n.beam.material.opacity = glow;
        n.beads.material.opacity = Math.min(1, glow * 1.4);
        const red = mstrShown && (n.where === "inside" || n.where === "beside");
        n.beam.material.color.set(red ? MSTR_RED : CONCERN);
        n.beads.material.color.set(red ? MSTR_RED : CONCERN);
      }

      const showMstr = mstrShown && (n.where === "inside" || n.where === "beside") && n.mstrLabel;
      const lensKey = showMstr ? "mstr" : "modern";
      if (n.shownLens !== lensKey) {
        n.textEl.textContent = showMstr ? n.mstrLabel : n.text;
        n.label.el.classList.toggle("in", Boolean(showMstr) && n.where === "inside");
        n.label.el.classList.toggle("beside", Boolean(showMstr) && n.where === "beside");
        n.shownLens = lensKey; n.w = 0;
      }
      const la = n.clutter ? 0 : clamp(n.alpha * 1.15);
      n.labelA += (la - n.labelA) * Math.min(1, dt * 12);
      n.label.obj.visible = n.labelA > 0.03;
      const op = n.labelA.toFixed(2);
      if (n.label.el.style.opacity !== op) n.label.el.style.opacity = op;
      n.label.el.classList.toggle("cur", n.id === current || n.id === view.selected);
      n.label.el.classList.toggle("hot", n.id === hover);
    }

    const moved = Math.abs(lensT - lastT) > 1e-4;
    for (const ed of edges) {
      if (moved) {
        curveBetween(ed.A, ed.B, ed.pts);
        for (let i = 0; i < N_SEG; i++) ed.pos.set([ed.pts[i].x, ed.pts[i].y, ed.pts[i].z], i * 3);
        ed.line.geometry.attributes.position.needsUpdate = true;
      }
      let a = Math.min(ed.A.alpha, ed.B.alpha);
      if (visited) a *= visited.has(ed.A.id) && visited.has(ed.B.id) ? 0.9 : 0.4;
      if (view.selected && (ed.A.id === view.selected || ed.B.id === view.selected)) a = Math.max(a, 1.4);
      ed.alpha += (a - ed.alpha) * Math.min(1, dt * 7);
      ed.line.material.opacity = 0.42 * ed.alpha;
      ed.line.visible = ed.alpha > 0.01;
    }
    if (moved) { lastT = lensT; if (view.trace && !trail.anim) buildTrail(); }

    const speed = reduced ? 0 : 0.2;
    edges.forEach((ed, i) => {
      for (let j = 0; j < PER_EDGE; j++) {
        const idx = i * PER_EDGE + j, u = (time * speed + ed.phase + j / PER_EDGE) % 1;
        sample(ed.pts, u, v3b);
        flow.pos.set([v3b.x, v3b.y, v3b.z], idx * 3);
        const c = ed.A.colorObj, b = ed.alpha * 1.25 * Math.sin(u * Math.PI);
        flow.col.set([c.r * b, c.g * b, c.b * b], idx * 3);
      }
    });
    flow.geo.attributes.position.needsUpdate = true;
    flow.geo.attributes.color.needsUpdate = true;

    if (view.trace) {
      if (trail.anim) {
        const k = clamp((now - trail.anim.start) / trail.anim.dur);
        curveBetween(byId.get(trail.anim.from), byId.get(trail.anim.to), trail.seg);
        sample(trail.seg, ease(k), v3b);
        trail.pulse.position.copy(v3b);
        if (k >= 1) { trail.anim = null; buildTrail(); }
      } else if (current && byId.has(current)) {
        const n = byId.get(current);
        if (n.kind === "concern") trail.pulse.position.set(n.cur.x, n.cur.y, n.cur.z);
        else trail.pulse.position.copy(n.g.position).add(v3b.set(0, 0.3, 0));
      }
      trail.pulse.visible = Boolean((current && byId.has(current)) || trail.anim);
      trail.pulse.scale.setScalar(1 + 0.15 * Math.sin(time * 4));
      trail.line.material.opacity = 0.75 + 0.2 * Math.sin(time * 3);
    } else trail.pulse.visible = false;

    dust.rotation.y += dt * 0.006;
    if (frameNo % 3 === 0) declutter();
    composer.render();
    labelRenderer.render(scene, camera);
  }

  resize();
  raf = requestAnimationFrame(frame);

  return {
    update,
    setInsets,
    focusLayer,
    neighbors: (id) => [...(neighbors.get(id) || [])],
    dispose() { cancelAnimationFrame(raf); ro.disconnect(); renderer.dispose(); container.replaceChildren(); },
  };
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#039;" }[c]));
}

// Hand the component to the page once both are ready (the page is a classic
// script so the atlas still works, in 2D, wherever modules or WebGL do not).
function boot() {
  const page = window.atlasPage;
  if (!page || !supportsWebGL()) { page?.sceneUnavailable(); return; }
  try {
    page.attachScene((container, spec, callbacks) => createAtlasScene(container, spec, callbacks));
  } catch (error) {
    console.error(error);
    page.sceneUnavailable();
  }
}
if (window.atlasPage) boot();
else window.addEventListener("atlas:ready", boot, { once: true });
