/* ==========================================================================
   Icyblast Bistro — procedural 3D burger (Three.js r149, no external assets)
   Every layer is modelled in code. Scroll progress through #burgerHero drives
   the explode / assemble animation; scrolling back up separates it again.
   Fallbacks: no WebGL -> static photo; reduced motion -> assembled, no scroll runway.
   NOTE: this is an illustrative stack. Confirm the real Icyblast recipe with the owner.
   ========================================================================== */
(function () {
  'use strict';

  const root = document.getElementById('burgerHero');
  const canvas = document.getElementById('burgerCanvas');
  if (!root || !canvas) return;

  const reduceMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const debug = /[?&]debug=1/.test(location.search);
  const dbg = (m) => {
    try { console.error('[burger]', m); if (!debug) return; let b = document.getElementById('burgerDebug'); if (!b) { b = document.createElement('pre'); b.id = 'burgerDebug'; b.style.cssText = 'position:fixed;left:0;right:0;bottom:0;max-height:40vh;overflow:auto;margin:0;padding:8px;background:#000;color:#0f0;font:11px/1.3 monospace;z-index:9999;white-space:pre-wrap'; document.body.appendChild(b); } b.textContent += m + '\n'; } catch (e) { /* ignore */ }
  };
  if (debug) addEventListener('error', (e) => dbg('JS error: ' + e.message + ' @' + (e.filename || '').split('/').pop() + ':' + e.lineno));
  const fallback = () => { root.classList.add('no-webgl', 'is-static'); };
  if (!window.THREE) return fallback();

  const T = THREE;
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, alpha: true, powerPreference: 'high-performance' });
    if (!renderer.getContext()) throw new Error('no context');
  } catch (e) { return fallback(); }

  /* ---------- helpers ---------- */
  const clamp = (v, a = 0, b = 1) => Math.min(b, Math.max(a, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => t * t * (3 - 2 * t);
  const easeOutBack = (t) => { const c1 = 0.9, c3 = c1 + 1; return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2); };
  const easeOutCubic = (t) => 1 - Math.pow(1 - t, 3);
  const rng = (seed) => () => { seed |= 0; seed = (seed + 0x6D2B79F5) | 0; let t = Math.imul(seed ^ (seed >>> 15), 1 | seed); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };

  if (T.ColorManagement) { if ('legacyMode' in T.ColorManagement) T.ColorManagement.legacyMode = false; else T.ColorManagement.enabled = true; }
  renderer.setClearColor(0x000000, 0);
  renderer.outputEncoding = T.sRGBEncoding;
  renderer.toneMapping = T.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;

  const scene = new T.Scene();
  const camera = new T.PerspectiveCamera(32, 1, 0.1, 80);

  /* ---------- studio environment (reflections only) ---------- */
  try { (function buildEnv() {
    const pm = new T.PMREMGenerator(renderer);
    const env = new T.Scene();
    env.background = new T.Color(0x0b0908);
    const panel = (w, h, color, k, x, y, z) => {
      const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshBasicMaterial({ color: new T.Color(color).multiplyScalar(k), side: T.DoubleSide }));
      m.position.set(x, y, z); m.lookAt(0, 0, 0); env.add(m);
    };
    panel(14, 8, 0xffe2b0, 5.5, 8, 9, 7);    // warm key
    panel(10, 14, 0x8fd8ff, 3.2, -11, 3, -4); // cold rim
    panel(16, 3, 0xffffff, 3.5, 0, 14, 0);    // top strip
    panel(18, 6, 0xff9a40, 0.9, 0, -8, 6);    // warm bounce
    env.add(new T.Mesh(new T.SphereGeometry(40, 16, 12), new T.MeshBasicMaterial({ color: 0x14100d, side: T.BackSide })));
    scene.environment = pm.fromScene(env, 0.035).texture;
    pm.dispose();
  })(); } catch (e) { dbg('env map skipped: ' + e.message); }

  /* ---------- lights ---------- */
  const key = new T.DirectionalLight(0xffdca8, 1.5); key.position.set(5, 9, 7); scene.add(key);
  const rim = new T.DirectionalLight(0x86d2ff, 2.2); rim.position.set(-7, 4, -6); scene.add(rim);
  const glow = new T.PointLight(0xffb02e, 0, 14, 2); glow.position.set(0, 2, 5); scene.add(glow);
  scene.add(new T.HemisphereLight(0xffeedd, 0x1a1008, 0.35));

  /* ---------- textures ---------- */
  function bumpTex(size, count, rmin, rmax, seed, rep) {
    const c = document.createElement('canvas'); c.width = c.height = size;
    const g = c.getContext('2d'); g.fillStyle = '#808080'; g.fillRect(0, 0, size, size);
    const r = rng(seed);
    for (let i = 0; i < count; i++) {
      const v = Math.floor(r() * 255);
      g.fillStyle = 'rgba(' + v + ',' + v + ',' + v + ',' + (0.25 + r() * 0.35) + ')';
      g.beginPath(); g.arc(r() * size, r() * size, rmin + r() * (rmax - rmin), 0, 6.2832); g.fill();
    }
    const t = new T.CanvasTexture(c); t.wrapS = t.wrapT = T.RepeatWrapping; t.repeat.set(rep, rep); return t;
  }
  const bunBump = bumpTex(256, 900, 1, 4, 11, 1); bunBump.repeat.set(9, 2);
  const pattyBump = bumpTex(256, 1800, 1, 5, 23, 1); pattyBump.repeat.set(10, 2.5);

  /* ---------- materials ---------- */
  const M = {
    bun: new T.MeshPhysicalMaterial({ color: 0xd98427, roughness: 0.4, clearcoat: 0.55, clearcoatRoughness: 0.38, bumpMap: bunBump, bumpScale: 0.12, envMapIntensity: 0.8 }),
    bunUnder: new T.MeshPhysicalMaterial({ color: 0xe6b366, roughness: 0.7, bumpMap: bunBump, bumpScale: 0.08 }),
    patty: new T.MeshPhysicalMaterial({ color: 0x4b2414, roughness: 0.74, clearcoat: 0.2, clearcoatRoughness: 0.55, envMapIntensity: 0.7 }),
    cheese: new T.MeshPhysicalMaterial({ color: 0xff9d10, roughness: 0.36, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    lettuce: new T.MeshStandardMaterial({ vertexColors: true, roughness: 0.5, side: T.DoubleSide }),
    tomato: new T.MeshPhysicalMaterial({ color: 0xd2281a, roughness: 0.26, clearcoat: 0.7, clearcoatRoughness: 0.2 }),
    tomatoIn: new T.MeshPhysicalMaterial({ color: 0xff5f3d, roughness: 0.3, clearcoat: 0.5 }),
    sauce: new T.MeshPhysicalMaterial({ color: 0xff7fa3, roughness: 0.22, clearcoat: 1, clearcoatRoughness: 0.1 }),
    seed: new T.MeshStandardMaterial({ color: 0xf3e2b3, roughness: 0.5 })
  };

  /* ---------- geometry builders (origin = bottom centre of each layer) ---------- */
  const lathe = (pts, seg) => new T.LatheGeometry(pts.map((p) => new T.Vector2(p[0], p[1])), seg || 72);

  function wobble(geo, seed, amt) {
    const r = rng(seed), p1 = r() * 6, p2 = r() * 6, pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), th = Math.atan2(z, x), k = 1 + amt * Math.sin(5 * th + p1) + amt * 0.7 * Math.sin(9 * th + p2);
      pos.setX(i, x * k); pos.setZ(i, z * k);
    }
    geo.computeVertexNormals(); return geo;
  }

  function topBun() {
    const g = new T.Group(), R = 1.74, H = 1.04, pts = [[0, 0], [R * 0.9, 0], [R, 0.03]];
    for (let i = 1; i <= 26; i++) { const a = (i / 26) * Math.PI / 2; pts.push([R * Math.pow(Math.cos(a), 0.9) * (1 + 0.035 * Math.sin(2 * a)), 0.03 + (H - 0.03) * Math.pow(Math.sin(a), 0.72)]); }
    pts[pts.length - 1][0] = 0;
    g.add(new T.Mesh(lathe(pts, 80), M.bun));
    // sesame seeds, laid on the dome surface
    const N = 90, inst = new T.InstancedMesh(new T.SphereGeometry(1, 8, 6), M.seed, N), r = rng(7), m = new T.Matrix4(), q = new T.Quaternion(), s = new T.Vector3(), p = new T.Vector3(), up = new T.Vector3(0, 1, 0);
    for (let i = 0; i < N; i++) {
      const a = 0.12 + r() * 1.25, th = r() * 6.2832, rr = R * Math.pow(Math.cos(a), 0.9) * (1 + 0.035 * Math.sin(2 * a)), y = 0.03 + (H - 0.03) * Math.pow(Math.sin(a), 0.72);
      const n = new T.Vector3(Math.cos(th) * Math.cos(a), Math.sin(a) * 1.15, Math.sin(th) * Math.cos(a)).normalize();
      p.set(Math.cos(th) * rr, y, Math.sin(th) * rr).addScaledVector(n, 0.005);
      q.setFromUnitVectors(up, n); q.multiply(new T.Quaternion().setFromAxisAngle(up, r() * 6.28));
      s.set(0.1, 0.042, 0.05); m.compose(p, q, s); inst.setMatrixAt(i, m);
    }
    g.add(inst); return { group: g, h: H };
  }

  function bottomBun() {
    const R = 1.7, H = 0.6;
    const ctrl = [[0.0, 0.0], [R * 0.7, 0.0], [R * 0.93, 0.06], [R, 0.22], [R * 0.99, 0.4], [R * 0.93, 0.54], [R * 0.8, H], [R * 0.4, H * 0.99]];
    const sp = new T.SplineCurve(ctrl.map((c) => new T.Vector2(c[0], c[1]))).getPoints(34).map((v) => [Math.max(0, v.x), v.y]);
    sp.push([0, H * 0.98]);
    const g = new T.Group(); g.add(new T.Mesh(lathe(sp, 80), M.bun));
    return { group: g, h: H };
  }

  function patty(seed) {
    const R = 1.66, H = 0.34, rim = [[R - 0.14, 0], [R - 0.04, 0.04], [R, 0.12], [R + 0.01, 0.22], [R - 0.05, 0.3], [R - 0.16, H]];
    const sp = new T.SplineCurve(rim.map((c) => new T.Vector2(c[0], c[1]))).getPoints(14).map((v) => [v.x, v.y]);
    const prof = [[0, 0], [R * 0.5, 0]].concat(sp);
    for (let k = 1; k <= 9; k++) { const r = (R - 0.16) * (1 - k / 9); prof.push([r, H + 0.012 + 0.035 * (1 - Math.pow(r / R, 2))]); }
    const geo = wobble(lathe(prof, 128), seed, 0.022), pos = geo.attributes.position, ph = seed * 1.7;
    geo.computeVertexNormals(); const nor = geo.attributes.normal;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), y = pos.getY(i), z = pos.getZ(i);
      const n = 0.028 * Math.sin(x * 9.1 + ph) * Math.sin(z * 8.3 + ph * 2) * Math.sin(y * 7 + 1) + 0.016 * Math.sin(x * 23 + z * 17 + ph) + 0.01 * Math.sin(x * 41 - z * 37);
      pos.setXYZ(i, x + nor.getX(i) * n, y + nor.getY(i) * n, z + nor.getZ(i) * n);
    }
    geo.computeVertexNormals();
    const g = new T.Group(); g.add(new T.Mesh(geo, M.patty)); return { group: g, h: H };
  }

  function cheese(rot) {
    const S = 3.2, geo = new T.BoxGeometry(S, 0.055, S, 40, 1, 40), pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const x = pos.getX(i), z = pos.getZ(i), r = Math.hypot(x, z), d = Math.max(0, r - 1.45);
      pos.setY(i, pos.getY(i) + 0.03 - d * d * 0.5 - Math.max(0, d - 0.7) * 0.2 * Math.sin(x * 3.1 + z * 2.3));
    }
    geo.computeVertexNormals();
    const mesh = new T.Mesh(geo, M.cheese); mesh.rotation.y = rot;
    const g = new T.Group(); g.add(mesh); return { group: g, h: 0.06 };
  }

  function polarGrid(R, rings, segs, fn) {
    const pos = [], col = [], idx = [], c0 = fn(0, 0);
    pos.push(0, c0.y, 0); col.push(c0.c[0], c0.c[1], c0.c[2]);
    for (let k = 1; k <= rings; k++) for (let s = 0; s < segs; s++) {
      const r = R * k / rings, th = s / segs * 6.2832, o = fn(r, th);
      pos.push(Math.cos(th) * r, o.y, Math.sin(th) * r); col.push(o.c[0], o.c[1], o.c[2]);
    }
    for (let s = 0; s < segs; s++) idx.push(0, 1 + s, 1 + (s + 1) % segs);
    for (let k = 1; k < rings; k++) for (let s = 0; s < segs; s++) {
      const a = 1 + (k - 1) * segs + s, b = 1 + (k - 1) * segs + (s + 1) % segs, c = 1 + k * segs + s, d = 1 + k * segs + (s + 1) % segs;
      idx.push(a, c, b, b, c, d);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.Float32BufferAttribute(pos, 3)); geo.setAttribute('color', new T.Float32BufferAttribute(col, 3)); geo.setIndex(idx);
    geo.computeVertexNormals(); return geo;
  }

  function lettuce() {
    const g = new T.Group(), leaf = (R, ph, y0) => {
      const geo = polarGrid(R, 18, 128, (r, th) => {
        const w = r / R, ruff = 0.15 * Math.pow(w, 2.2) * Math.sin(7 * th + 2 * Math.sin(3 * th + ph) + r * 1.5 + ph) + 0.05 * Math.pow(w, 3) * Math.sin(15 * th + r * 4 + ph) + 0.03 * w * Math.sin(r * 9 + th * 2);
        const t = clamp(w * 1.05), vein = 0.5 + 0.5 * Math.sin(th * 11 + ph) * (1 - w);
        const c = [lerp(0.62, 0.2, t) - 0.04 * vein, lerp(0.86, 0.58, t) - 0.05 * vein, lerp(0.3, 0.12, t)];
        return { y: y0 + ruff, c: c.map((v) => Math.pow(Math.max(0, v), 2.2)) };
      });
      return new T.Mesh(geo, M.lettuce);
    };
    g.add(leaf(2.0, 0, 0.09)); const l2 = leaf(1.78, 2.1, 0.17); l2.rotation.y = 0.9; g.add(l2);
    return { group: g, h: 0.2 };
  }

  function tomato() {
    const g = new T.Group();
    for (let i = 0; i < 3; i++) {
      const a = i / 3 * 6.2832 + 0.5, s = new T.Group();
      s.add(new T.Mesh(new T.CylinderGeometry(0.72, 0.72, 0.1, 40), M.tomato));
      const inn = new T.Mesh(new T.CylinderGeometry(0.54, 0.54, 0.104, 40), M.tomatoIn); s.add(inn);
      s.position.set(Math.cos(a) * 0.82, 0.07 + i * 0.012, Math.sin(a) * 0.82); s.rotation.y = a; g.add(s);
    }
    return { group: g, h: 0.14 };
  }

  function sauce() {
    const g = new T.Group(), pts = [], r = rng(5);
    for (let i = 0; i < 16; i++) { const a = i / 16 * 6.2832; pts.push(new T.Vector3(Math.cos(a) * (1.15 + 0.3 * Math.sin(a * 3 + 1) + r() * 0.08), 0.1 + 0.03 * Math.sin(a * 5), Math.sin(a) * (1.15 + 0.3 * Math.sin(a * 3 + 1)))); }
    g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts, true), 120, 0.11, 12, true), M.sauce));
    const blob = new T.Mesh(new T.SphereGeometry(0.62, 24, 16), M.sauce); blob.scale.set(1, 0.28, 1); blob.position.y = 0.09; g.add(blob);
    return { group: g, h: 0.17 };
  }

  /* ---------- assemble the stack ---------- */
  const LAYERS = [
    { name: 'Toasted bun', b: bottomBun() },
    { name: 'Beef patty', b: patty(3) },
    { name: 'Melted cheese', b: cheese(0.785) },
    { name: 'Beef patty', b: patty(9) },
    { name: 'Melted cheese', b: cheese(0.35) },
    { name: 'Crisp lettuce', b: lettuce() },
    { name: 'Tomato', b: tomato() },
    { name: 'Pink sauce', b: sauce() },
    { name: 'Sesame top bun', b: topBun() }
  ];
  const burger = new T.Group(); scene.add(burger);
  const tr = rng(41); let acc = 0;
  LAYERS.forEach((L, i) => {
    L.stackY = acc; acc += L.b.h - (i === 1 || i === 3 ? 0.02 : 0.0);
    L.tilt = { x: (tr() - 0.5) * 0.7, z: (tr() - 0.5) * 0.7, y: (tr() - 0.5) * 2.4 };
    L.b.group.position.y = L.stackY; burger.add(L.b.group);
  });
  const GAP = 0.66, N = LAYERS.length;

  /* contact shadow */
  const shadow = (function () {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d');
    const gr = g.createRadialGradient(64, 64, 4, 64, 64, 62); gr.addColorStop(0, 'rgba(0,0,0,.85)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
    const m = new T.Mesh(new T.PlaneGeometry(7.4, 7.4), new T.MeshBasicMaterial({ map: new T.CanvasTexture(c), transparent: true, depthWrite: false, opacity: 0.0 }));
    m.rotation.x = -Math.PI / 2; m.position.y = -0.04; scene.add(m); return m;
  })();

  /* floating ice / gold dust */
  const dust = (function () {
    const n = 150, pos = new Float32Array(n * 3), r = rng(77);
    for (let i = 0; i < n; i++) { pos[i * 3] = (r() - 0.5) * 11; pos[i * 3 + 1] = r() * 11 - 1; pos[i * 3 + 2] = (r() - 0.5) * 6 - 1; }
    const geo = new T.BufferGeometry(); geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const p = new T.Points(geo, new T.PointsMaterial({ color: 0xffd98a, size: 0.07, transparent: true, opacity: 0.55, depthWrite: false, blending: T.AdditiveBlending, sizeAttenuation: true }));
    scene.add(p); return p;
  })();

  /* ---------- DOM bindings ---------- */
  const stage = root.querySelector('.bhero__sticky') || root;
  const copy = [1, 2, 3].map((n) => root.querySelector('.bh-copy--' + n));
  const layerName = document.getElementById('layerName'), layerNum = document.getElementById('layerNum'), meter = document.getElementById('bhMeter');
  const dots = [...root.querySelectorAll('.bh-dots li')];
  let lastLayer = -1, w = 1, h = 1;

  function resize() {
    w = Math.max(1, stage.clientWidth); h = Math.max(1, stage.clientHeight);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    renderer.setPixelRatio(dpr); renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.clearViewOffset();
    if (w / h >= 0.95) camera.setViewOffset(w, h, -w * 0.17, 0, w, h);       // desktop: burger on the right
    else camera.setViewOffset(w, h, 0, h * 0.2, w, h);                        // portrait: burger up, copy below
    camera.updateProjectionMatrix();
  }
  new ResizeObserver(resize).observe(stage); resize();

  /* scroll progress through the runway */
  let target = 0, sp = 0;
  function readScroll() {
    const rect = root.getBoundingClientRect(), run = Math.max(1, root.offsetHeight - stage.clientHeight);
    target = root.classList.contains('is-static') ? 1 : clamp(-rect.top / run);
  }
  if (reduceMotion) root.classList.add('is-static');
  addEventListener('scroll', readScroll, { passive: true }); addEventListener('resize', readScroll); readScroll(); sp = target;

  /* ---------- frame ---------- */
  const win = (p, a, b, f) => clamp(Math.min((p - a) / f, (b - p) / f, 1));
  let visible = true, introT0 = null, last = performance.now() / 1000; const bootT = last;
  new IntersectionObserver((e) => { visible = e[0].isIntersecting; if (visible) tick(); }, { threshold: 0 }).observe(root);

  function frame(now) {
    const dt = Math.min(0.05, now - last); last = now;
    if (introT0 === null && (reduceMotion || !document.documentElement.classList.contains('is-loading') || now - bootT > 2.2)) introT0 = now;
    const it = introT0 === null ? 0 : now - introT0;
    sp += (target - sp) * (1 - Math.exp(-dt * (reduceMotion ? 60 : 6.5)));
    const p = sp;

    let A = 0;                                  // 0 exploded .. 1 assembled (average)
    LAYERS.forEach((L, i) => {
      const t0 = 0.035 + i * 0.07, t = clamp((p - t0) / 0.24), e = easeOutBack(t);
      const introK = reduceMotion ? 1 : easeOutCubic(clamp((it - 0.1 * (N - i)) / 1.5));
      const fall = (1 - introK) * (7 + i * 0.8);
      const gone = (1 - Math.min(1, e));
      const bob = reduceMotion ? 0 : Math.sin(now * 1.15 + i * 1.7) * 0.09 * gone * introK;
      const g = L.b.group;
      g.position.y = L.stackY + i * GAP * (1 - e) + fall + bob;
      g.rotation.x = L.tilt.x * (1 - Math.min(1, e)) * introK;
      g.rotation.z = L.tilt.z * (1 - Math.min(1, e)) * introK;
      g.rotation.y = L.tilt.y * (1 - Math.min(1, e)) * introK;
      g.visible = introK > 0.001 || i === 0;
      A += clamp(e, 0, 1) / N;
    });
    const asm = smooth(clamp((A - 0.02) / 0.96));
    burger.rotation.y = 0.55 + p * 2.6 + (reduceMotion ? 0 : now * 0.16);
    burger.rotation.x = lerp(0.1, 0.2, asm);
    shadow.material.opacity = 0.55 * asm; shadow.scale.setScalar(lerp(0.7, 1, asm));
    glow.intensity = 3 * Math.pow(win(p, 0.7, 1.2, 0.18), 1.5) + 0.6 * asm;
    key.position.x = 5 + Math.sin(now * 0.35) * 1.8; rim.position.z = -6 + Math.cos(now * 0.28) * 1.5;

    let top = 0;
    LAYERS.forEach((L, i) => { top = Math.max(top, L.stackY + L.b.h + i * GAP * (1 - clamp(easeOutBack(clamp((p - (0.035 + i * 0.07)) / 0.24)), 0, 1))); });
    const tanH = Math.tan(T.MathUtils.degToRad(camera.fov / 2)), asp = camera.aspect;
    const spanH = top + 2.2, spanW = lerp(6.4, 7.2, asm);
    const portrait = asp < 0.95, dist = Math.max(spanH * (portrait ? 1.6 : 1.08) / (2 * tanH), spanW / (2 * tanH * asp));
    const ly = top * 0.5 + 0.1;
    camera.position.set(0, ly + lerp(2.0, 1.7, asm) + top * 0.08, dist); camera.lookAt(0, ly, 0);

    dust.rotation.y = now * 0.03; dust.position.y = (now * 0.12) % 3 - 1.5; dust.material.opacity = 0.35 + 0.25 * (1 - asm);

    // copy overlays
    const c1 = 1 - smooth(clamp((p - 0.1) / 0.14)), c2 = win(p, 0.2, 0.78, 0.1), c3 = smooth(clamp((p - 0.82) / 0.1));
    [c1, c2, c3].forEach((v, i) => { const el = copy[i]; if (!el) return; el.style.opacity = v.toFixed(3); el.style.transform = 'translateY(' + ((1 - v) * 24).toFixed(1) + 'px)'; el.style.pointerEvents = v > 0.6 ? 'auto' : 'none'; el.style.visibility = v < 0.01 ? 'hidden' : 'visible'; });
    const li = clamp(Math.floor((p - 0.035) / 0.07 + 0.35), 0, N - 1);
    if (li !== lastLayer) {
      lastLayer = li;
      if (layerName) layerName.textContent = LAYERS[li].name;
      if (layerNum) layerNum.textContent = String(li + 1).padStart(2, '0') + ' / ' + String(N).padStart(2, '0');
      dots.forEach((d, i) => d.classList.toggle('is-on', i <= li));
    }
    if (meter) meter.style.transform = 'scaleX(' + p.toFixed(3) + ')';
    root.style.setProperty('--asm', asm.toFixed(3));

    renderer.render(scene, camera);
  }

  let raf = 0;
  let failed = false;
  function bail(e) { if (failed) return; failed = true; dbg('render failed: ' + (e && e.message || e)); cancelAnimationFrame(raf); root.classList.add('no-webgl', 'is-static'); }
  canvas.addEventListener('webglcontextlost', (e) => { e.preventDefault(); bail('context lost'); });
  function tick() { cancelAnimationFrame(raf); if (failed || !visible || document.hidden) return; raf = requestAnimationFrame((ms) => { try { frame(ms / 1000); } catch (e) { return bail(e); } tick(); }); }
  document.addEventListener('visibilitychange', tick);
  root.classList.add('is-ready');
  try { frame(performance.now() / 1000); } catch (e) { bail(e); } tick();
  window.__burger = { layers: LAYERS.length, setProgress: (v) => { target = clamp(v); sp = target; } };
})();
