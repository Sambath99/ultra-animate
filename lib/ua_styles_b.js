/* ===== ink-wash : layered misty mountains in ink on paper, red sun, caption + seal (calm, premium) ===== */
STYLES['ink-wash'] = { name: 'ink-wash', desc: 'Ink-wash landscape with parallax depth, red sun and a caption (quotes, culture, calm/premium brand moments).', make(P, th, W, H) {
  const s = new T.Scene(); s.background = col(th.bg); const cam = new T.PerspectiveCamera(30, W / H, .1, 100); s.add(cam);
  const ink = new T.Color(th.fg), N = P.layers || 5, camZ0 = 12, visH = d => 2 * Math.tan(T.MathUtils.degToRad(15)) * d;
  const R = rng(P.seed ?? 21), layers = [];
  // paper backdrop with fibres
  const pt = cvTex(1024, 1536); pt.x.fillStyle = th.bg; pt.x.fillRect(0, 0, 1024, 1536); const r2 = rng(8); for (let i = 0; i < 2600; i++) { pt.x.strokeStyle = `rgba(${lum(th.bg) > .5 ? '80,70,50' : '200,200,210'},${r2() * .07})`; pt.x.lineWidth = 1; pt.x.beginPath(); const x = r2() * 1024, y = r2() * 1536; pt.x.moveTo(x, y); pt.x.lineTo(x + (r2() - .5) * 40, y + (r2() - .5) * 40); pt.x.stroke(); } const gg = pt.x.createRadialGradient(512, 560, 80, 512, 760, 1100); gg.addColorStop(0, 'rgba(255,255,255,.18)'); gg.addColorStop(1, 'rgba(0,0,0,.10)'); pt.x.fillStyle = gg; pt.x.fillRect(0, 0, 1024, 1536); pt.upd();
  const bgD = camZ0 + 9, bg = new T.Mesh(new T.PlaneGeometry(visH(bgD) * W / H * 1.1, visH(bgD) * 1.1), new T.MeshBasicMaterial({ map: pt.t })); bg.position.z = -9; s.add(bg);
  // sun
  const sunTex = cvTex(512, 512); const sg = sunTex.x.createRadialGradient(256, 256, 20, 256, 256, 250); sg.addColorStop(0, th.accent); sg.addColorStop(.62, th.accent); sg.addColorStop(.66, th.accent + '00'); sunTex.x.fillStyle = sg; sunTex.x.fillRect(0, 0, 512, 512); sunTex.upd();
  const sunM = new T.Mesh(new T.PlaneGeometry(2.4, 2.4), new T.MeshBasicMaterial({ map: sunTex.t, transparent: true, depthWrite: false })); sunM.position.set(.6, 3.6, -5.2); s.add(sunM);
  for (let L = 0; L < N; L++) {
    const f = L / (N - 1), z = -6 + f * 8.3, d = camZ0 - z, h = visH(d) * 1.3, w = h * W / H * 1.35;           // far -> near
    const tx = cvTex(1024, 1536), x = tx.x, n1 = vnoise(100 + L * 7 + (P.seed ?? 21)), n2 = vnoise(300 + L * 3);
    const base = 1536 * (.5 - f * .08) + f * 60, amp = 360 * (1 - f * .45) + 80, freq = .0042 + f * .0032;
    x.beginPath(); x.moveTo(0, 1536); for (let i = 0; i <= 1024; i += 4) { const y = base - amp * (Math.pow(n1(i * freq), 1.7) * .9 + n2(i * freq * 2.7) * .22); x.lineTo(i, y); } x.lineTo(1024, 1536); x.closePath();
    const g = x.createLinearGradient(0, base - amp, 0, 1536); const a0 = .55 + f * .4; g.addColorStop(0, `rgba(${ink.r * 255 | 0},${ink.g * 255 | 0},${ink.b * 255 | 0},${a0})`); g.addColorStop(.45, `rgba(${ink.r * 255 | 0},${ink.g * 255 | 0},${ink.b * 255 | 0},${a0 * .45})`); g.addColorStop(1, 'rgba(0,0,0,0)'); x.fillStyle = g; x.fill();
    if (f > .45) { for (let k = 0; k < 140; k++) { const px = R() * 1024, py = base - amp * .4 + R() * amp * .5; x.fillStyle = `rgba(${ink.r * 255 | 0},${ink.g * 255 | 0},${ink.b * 255 | 0},${.05 + R() * .08})`; x.fillRect(px, py, 2 + R() * 6, 8 + R() * 30); } }     // dry-brush texture
    tx.upd(); const geo = new T.PlaneGeometry(w, h); geo.translate(0, h / 2, 0); const m = new T.Mesh(geo, new T.MeshBasicMaterial({ map: tx.t, transparent: true, depthWrite: false })); m.position.set(0, -h * .62 + visH(d) * -.0, z); m.renderOrder = L; s.add(m); layers.push({ m, f, y0: -h * .62, w, h });
    if (L === 1 || L === 3) { const mt = cvTex(512, 256); const mg = mt.x.createRadialGradient(256, 128, 10, 256, 128, 250); mg.addColorStop(0, 'rgba(255,255,255,.55)'); mg.addColorStop(1, 'rgba(255,255,255,0)'); mt.x.fillStyle = mg; mt.x.fillRect(0, 0, 512, 256); mt.upd(); const mist = new T.Mesh(new T.PlaneGeometry(w * .9, h * .22), new T.MeshBasicMaterial({ map: mt.t, transparent: true, depthWrite: false, opacity: lum(th.bg) > .5 ? .9 : .25 })); mist.position.set(0, -h * .62 + h * .42, z + .3); mist.renderOrder = L + .5; s.add(mist); layers.push({ mist, z }); }
  }
  // birds
  const birds = []; for (let i = 0; i < 5; i++) { const gm = new T.BufferGeometry().setFromPoints([new T.Vector3(-.16, .05, 0), new T.Vector3(0, 0, 0), new T.Vector3(.16, .05, 0)]); const b = new T.Line(gm, new T.LineBasicMaterial({ color: ink })); b.position.z = -3; s.add(b); birds.push(b); }
  // caption + seal fixed to camera
  const cap = label(P.text || 'The river keeps no name', { size: 76, color: th.fg, font: FONT.serif, weight: 700, h: .46, padX: 10 }); cap.s.position.set(-.05, -2.05, -9); cam.add(cap.s);
  const seal = label(P.seal || '道', { size: 64, color: '#fff', bg: th.accent, h: .34, font: FONT.serif, align: 'center', radius: 6, padX: 22, padY: 14 }); seal.s.position.set(1.35, -2.0, -9); cam.add(seal.s);
  const sub = P.sub ? label(P.sub, { size: 44, color: th.mute, font: FONT.sans, weight: 500, h: .2, padX: 6 }) : null; if (sub) { sub.s.position.set(0, -2.45, -9); cam.add(sub.s); }
  return { scene: s, cam, frame(t, d) {
    layers.forEach((l, i) => { if (l.m) { const k = o3(pr(t, .25 + l.f * 1.6, 1.4 + l.f * 1.6)); l.m.scale.y = Math.max(.001, k); l.m.material.opacity = cl(k * 1.5); l.m.position.y = l.y0 + (1 - k) * -1.5; l.m.position.x = Math.sin(t * .15 + i) * .12 * (1 - l.f); } else if (l.mist) l.mist.position.x = Math.sin(t * .22 + l.z) * .9; });
    sunM.position.y = 3.6 + (1 - o3(pr(t, .3, 2.2))) * -2.4; sunM.material.opacity = o3(pr(t, .5, 2));
    birds.forEach((b, i) => { const u = pr(t, 1.6 + i * .25, d); b.position.set(lerp(-3.6, 3.4, u) + i * .2, 2.8 + Math.sin(u * 6 + i) * .25 + i * .18, -3 - i * .12); b.scale.set(1 + Math.sin(t * 9 + i) * .35, 1 + Math.sin(t * 9 + i) * .6, 1); b.visible = u > 0 && u < 1; });
    cap.set(o3(pr(t, 1.8, 2.6))); seal.set(o3(pr(t, 2.3, 3))); if (sub) sub.set(o3(pr(t, 2.6, 3.3)));
    const k = io3(pr(t, 0, d)); cam.position.set(Math.sin(t * .2) * .25, lerp(.2, .9, k), lerp(camZ0, camZ0 - 2.6, k)); cam.lookAt(0, 1.4, -6);
  } };
} };

/* ===== teardown : exploded 3D product / stack with labelled parts ===== */
STYLES['teardown'] = { name: 'teardown', desc: 'Exploded 3D view with labelled parts. kind "keyboard" (default demo) or "stack" (your own layers: tools, steps, modules).', make(P, th, W, H) {
  const s = envScene(th, 16, 40), cam = new T.PerspectiveCamera(32, W / H, .1, 100), dark = lum(th.bg) < .45; const grp = new T.Group(); s.add(grp); const kind = P.kind || 'keyboard';
  const parts = P.parts || (kind === 'keyboard' ? [{ name: 'Keycaps', spec: 'PBT · 1u' }, { name: 'Switches', spec: 'linear · hot-swap' }, { name: 'Plate', spec: 'aluminium' }, { name: 'PCB', spec: 'RP2040' }, { name: 'Case', spec: 'ABS shell' }] : [{ name: 'Layer 1' }, { name: 'Layer 2' }, { name: 'Layer 3' }]);
  const layers = [];                                   // bottom -> top, each {g, base}
  const std = (c, o = {}) => new T.MeshStandardMaterial(Object.assign({ color: c, roughness: .55, metalness: .1 }, o));
  const COLS = 5, ROWS = 4, KS = .56;
  if (kind === 'keyboard') {
    const key = new T.BoxGeometry(KS * .9, .26, KS * .9); key.translate(0, .13, 0);
    const mk = (fn) => { const g = new T.Group(); for (let i = 0; i < COLS; i++) for (let j = 0; j < ROWS; j++) g.add(fn(i, j, (i - (COLS - 1) / 2) * KS, (j - (ROWS - 1) / 2) * KS)); return g; };
    const caseG = new T.Group(); const cb = new T.Mesh(new T.BoxGeometry(3.3, .22, 2.8), std(dark ? '#2a2d36' : '#444850')); caseG.add(cb); [[0, 1.4, 3.3, .3, .14], [0, -1.4, 3.3, .3, .14], [1.65, 0, .14, .3, 2.8], [-1.65, 0, .14, .3, 2.8]].forEach(([x, z, w, h, dd]) => { const m = new T.Mesh(new T.BoxGeometry(w, h, dd), std(dark ? '#353944' : '#555a64')); m.position.set(x, .22, z); caseG.add(m); });
    const pcb = new T.Group(); pcb.add(new T.Mesh(new T.BoxGeometry(3.0, .06, 2.4), std('#1f8a55', { roughness: .4 }))); for (let i = 0; i < 6; i++) { const c = new T.Mesh(new T.BoxGeometry(.28, .05, .22), std('#111')); c.position.set(-1.1 + i * .42, .05, 1.0); pcb.add(c); } for (let i = 0; i < 28; i++) { const p = new T.Mesh(new T.CylinderGeometry(.04, .04, .02, 8), std('#d8b24a', { metalness: .9, roughness: .3 })); p.position.set((i % 7 - 3) * .4, .04, -.9 + Math.floor(i / 7) * .2); pcb.add(p); }
    const plate = new T.Mesh(new T.BoxGeometry(3.05, .06, 2.45), std('#b9bec7', { metalness: .85, roughness: .35 }));
    const sw = mk((i, j, x, z) => { const g = new T.Group(); const b = new T.Mesh(new T.BoxGeometry(.4, .24, .4), std('#2d3038')); b.position.y = .12; const st = new T.Mesh(new T.BoxGeometry(.16, .12, .05), std(th.accent)); st.position.y = .3; const st2 = new T.Mesh(new T.BoxGeometry(.05, .12, .16), std(th.accent)); st2.position.y = .3; g.add(b, st, st2); g.position.set(x, 0, z); return g; });
    const kc = mk((i, j, x, z) => { const m = new T.Mesh(key, std((i + j) % 7 === 0 ? th.accent : '#e9e7e1', { roughness: .8 })); m.position.set(x, 0, z); return m; });
    [caseG, pcb, plate, sw, kc].forEach(g => layers.push({ g }));
  } else {
    parts.forEach((p, i) => { const g = new T.Group(); const c = p.color || (i % 2 ? th.card : th.accent); const m = new T.Mesh(new T.BoxGeometry(3.1, .16, 2.4), std(c, { metalness: .2, roughness: .5 })); g.add(m); const tx = cvTex(768, 600); tx.x.fillStyle = 'rgba(0,0,0,0)'; const lt = label(p.name || ('Layer ' + (i + 1)), { size: 90, color: lum(c) > .5 ? '#111' : '#fff', font: FONT.disp }); tx.x.font = `700 130px ${FONT.disp}`; tx.x.fillStyle = lum(c) > .5 ? '#111' : '#fff'; tx.x.textAlign = 'center'; tx.x.textBaseline = 'middle'; wrap(tx.x, p.name || '', 700).slice(0, 2).forEach((ln, k, arr) => tx.x.fillText(ln, 384, 300 + (k - (arr.length - 1) / 2) * 140)); tx.upd(); const top = new T.Mesh(new T.PlaneGeometry(3.0, 2.3), new T.MeshBasicMaterial({ map: tx.t, transparent: true })); top.rotation.x = -Math.PI / 2; top.position.y = .09; g.add(top); layers.push({ g }); });
  }
  const gaps = layers.map((_, i) => 0); const baseY = [0, .3, .42, .56, .86]; const nL = layers.length;
  layers.forEach((l, i) => { l.base = kind === 'keyboard' ? baseY[i] : i * .2; grp.add(l.g); l.g.rotation.y = 0; });
  grp.position.x = -.95; grp.rotation.y = -.5;
  const floor = new T.Mesh(new T.CircleGeometry(9, 64), new T.MeshStandardMaterial({ color: col(th.ground), roughness: .9, metalness: .1 })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.4; s.add(floor);
  s.add(new T.HemisphereLight(0xffffff, 0x222233, .75)); const sp = new T.SpotLight(0xffffff, 90, 40, .7, .6); sp.position.set(3, 12, 5); sp.target.position.set(0, 1, 0); s.add(sp, sp.target); const rim = new T.PointLight(col(th.accent), 20, 20); rim.position.set(-5, 3, -3); s.add(rim);
  const labs = layers.map((l, i) => { const idx = nL - 1 - i; const p = parts[idx] || {}; const L = label([(String(idx + 1).padStart(2, '0') + '  ' + (p.name || '')), p.spec || ''].filter(Boolean), { size: 54, color: th.fg, colors: [th.fg, th.mute], fonts: [`700 54px ${FONT.disp}`, `500 40px ${FONT.mono}`], bg: null, h: p.spec ? .62 : .34, padX: 4, padY: 6 }); s.add(L.s); const lg = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]); const ln = new T.Line(lg, new T.LineBasicMaterial({ color: col(th.accent), transparent: true })); s.add(ln); return { L, ln, lg }; });
  return { scene: s, cam, frame(t, d) {
    const e = spring(pr(t, .7, 2.3)) , spread = 1.15, fade = o3(pr(t, 0, .5));
    layers.forEach((l, i) => { l.g.position.y = l.base + i * spread * e * (kind === 'keyboard' ? 1 : 1.1); l.g.rotation.y = Math.sin(t * .9 + i) * .02 * e; });
    labs.forEach((lb, i) => { const y = layers[i].g.position.y + .1 + (i === nL - 1 ? .2 : 0), a = o3(pr(t, 1.8 + (nL - i) * .18, 2.4 + (nL - i) * .18)); lb.L.s.position.set(1.15, y + .05, 0); lb.L.s.position.x = 1.15 + lb.L.aspect * (lb.L.s.scale.y) / 2 + .2; lb.L.set(a);
      const a0 = new T.Vector3(.5, y, 0).applyMatrix4(grp.matrixWorld), b0 = new T.Vector3(lb.L.s.position.x - lb.L.aspect * lb.L.s.scale.y / 2 - .08, y + .05, 0); lb.lg.setFromPoints([a0.lerp(b0, 0), a0.lerp(b0, 0).clone().lerp(b0, 1)]); lb.lg.setFromPoints([new T.Vector3(.2, y, 0).applyMatrix4(grp.matrixWorld), b0]); lb.ln.material.opacity = a * .8; });
    grp.rotation.y = -.5 + t * .12 * (1); grp.updateMatrixWorld(true);
    const k = io3(pr(t, 0, d)); cam.position.set(lerp(4.6, 3.2, k), lerp(4.2, 6.2, k), lerp(13.4, 12.2, k)); cam.lookAt(0, lerp(1.3, 2.3, k), 0);
  } };
} };

/* ===== paper-desk : papers, tape and a red pen circle land on a green cutting mat (editorial / research feel) ===== */
STYLES['paper-desk'] = { name: 'paper-desk', desc: 'Top-down desk: chart paper with red pen circle, note card, sticky label, tape (insights, data stories, research, tips).', make(P, th, W, H) {
  const s = new T.Scene(); s.background = col(th.bg); const cam = new T.PerspectiveCamera(32, W / H, .1, 60);
  const mt = cvTex(256, 256); mt.x.fillStyle = th.ground; mt.x.fillRect(0, 0, 256, 256); mt.x.strokeStyle = 'rgba(255,255,255,.16)'; mt.x.lineWidth = 2; mt.x.strokeRect(0, 0, 256, 256); mt.x.strokeStyle = 'rgba(255,255,255,.07)'; for (let i = 1; i < 4; i++) { mt.x.beginPath(); mt.x.moveTo(i * 64, 0); mt.x.lineTo(i * 64, 256); mt.x.moveTo(0, i * 64); mt.x.lineTo(256, i * 64); mt.x.stroke(); } mt.upd(); mt.t.wrapS = mt.t.wrapT = T.RepeatWrapping; mt.t.repeat.set(26, 40);
  const mat = new T.Mesh(new T.PlaneGeometry(13, 20), new T.MeshStandardMaterial({ map: mt.t, roughness: .95 })); mat.rotation.x = -Math.PI / 2; s.add(mat);
  s.add(new T.HemisphereLight(0xffffff, 0x445544, .95)); const dl = new T.DirectionalLight(0xfff5e6, 1.2); dl.position.set(-3, 8, 2); s.add(dl);
  const serif = FONT.serif, series = P.series || [95, 90, 72, 55, 42, 33, 27, 22, 19, 16, 14, 12], ci = P.circleAt ?? 2;
  const C1 = cvTex(1200, 1500), C2 = cvTex(1100, 760);
  function paperBase(x, w, h) { x.fillStyle = th.paper; x.fillRect(0, 0, w, h); const r = rng(9); for (let i = 0; i < 2500; i++) { x.fillStyle = `rgba(100,80,50,${r() * .05})`; x.fillRect(r() * w, r() * h, 2 + r() * 3, 1 + r() * 2); } x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 4; x.strokeRect(2, 2, w - 4, h - 4); }
  function drawChart(p, pen) {
    const x = C1.x; paperBase(x, 1200, 1500); x.textBaseline = 'alphabetic'; x.fillStyle = '#7a7261'; x.font = `600 34px ${FONT.mono}`; x.fillText((P.fig || 'FIG. 2 · RETENTION, FIRST 30 SECONDS').toUpperCase(), 90, 110);
    x.fillStyle = '#14120d'; x.font = `900 84px ${serif}`; let y = 230; wrap(x, P.title || 'Most viewers decide in the first three seconds', 1020).forEach(l => { x.fillText(l, 90, y); y += 98; });
    const gx = 110, gy = 600, gw = 980, gh = 640; x.strokeStyle = '#14120d'; x.lineWidth = 4; x.beginPath(); x.moveTo(gx, gy); x.lineTo(gx, gy + gh); x.lineTo(gx + gw, gy + gh); x.stroke(); x.strokeStyle = 'rgba(0,0,0,.08)'; x.lineWidth = 2; for (let i = 1; i < 5; i++) { x.beginPath(); x.moveTo(gx, gy + gh * i / 5); x.lineTo(gx + gw, gy + gh * i / 5); x.stroke(); }
    const mx = Math.max(...series), pt = i => [gx + gw * i / (series.length - 1), gy + gh * (1 - series[i] / mx * .92)];
    x.strokeStyle = '#14120d'; x.lineWidth = 7; x.lineJoin = 'round'; x.beginPath(); const nn = (series.length - 1) * p; for (let i = 0; i <= Math.floor(nn); i++) { const q = pt(i); i ? x.lineTo(q[0], q[1]) : x.moveTo(q[0], q[1]); } if (Math.floor(nn) < series.length - 1) { const a = pt(Math.floor(nn)), b = pt(Math.floor(nn) + 1), f = nn - Math.floor(nn); x.lineTo(lerp(a[0], b[0], f), lerp(a[1], b[1], f)); } x.stroke();
    if (pen > 0) { const q = pt(ci), rr2 = 120, a0 = -2.2; x.strokeStyle = th.accent; x.lineWidth = 11; x.lineCap = 'round'; x.beginPath(); for (let k = 0; k <= 60 * pen; k++) { const a = a0 + k / 60 * Math.PI * 2.25, r = rr2 * (1 + .08 * Math.sin(k * .2) + k / 60 * .12); const px = q[0] + Math.cos(a) * r * 1.25, py = q[1] + Math.sin(a) * r; k ? x.lineTo(px, py) : x.moveTo(px, py); } x.stroke(); if (P.pen) { x.fillStyle = th.accent; x.font = `italic 700 56px ${FONT.disp}`; x.globalAlpha = pen; x.fillText(P.pen, q[0] + 150, q[1] - 40); x.globalAlpha = 1; } }
    C1.upd();
  }
  function drawNote() { const x = C2.x; paperBase(x, 1100, 760); x.fillStyle = '#7a7261'; x.font = `600 32px ${FONT.mono}`; x.textBaseline = 'alphabetic'; x.fillText(((P.note && P.note.head) || 'FROM THE NOTES · 41 REELS').toUpperCase(), 70, 90); x.fillStyle = '#14120d'; x.font = `500 50px ${serif}`; let y = 180; wrap(x, (P.note && P.note.body) || 'Across our last 40 reels, the steepest drop came early. Viewers who made it past the third second mostly stayed to the end.', 960).slice(0, 8).forEach(l => { x.fillText(l, 70, y); y += 68; }); C2.upd(); }
  drawNote();
  const mkPaper = (tx, w, h) => { const m = new T.Mesh(new T.PlaneGeometry(w, h), new T.MeshStandardMaterial({ map: tx.t, roughness: .95 })); m.rotation.x = -Math.PI / 2; return m; };
  const A = mkPaper(C1, 2.4, 3.0), B = mkPaper(C2, 2.5, 1.72); const stick = label(P.sticky || 'THE HOOK', { size: 90, color: '#111', bg: th.paper, h: .5, font: FONT.disp, radius: 4, padX: 40, padY: 26, depthTest: true });
  const sk = new T.Mesh(new T.PlaneGeometry(stick.aspect * .5, .5), new T.MeshBasicMaterial({ map: stick.s.material.map, transparent: true })); sk.rotation.x = -Math.PI / 2;
  const tape = () => new T.Mesh(new T.PlaneGeometry(.75, .26), new T.MeshBasicMaterial({ color: 0xe9dcb8, transparent: true, opacity: .78 })); const t1 = tape(), t2 = tape(), t3 = tape(); [t1, t2, t3].forEach(t => t.rotation.x = -Math.PI / 2);
  const items = [{ m: A, x: -.1, z: -1.1, r: -.05, t0: .2, sh: blobShadow(2.8, 3.4, .55) }, { m: B, x: .35, z: 2.0, r: .07, t0: 1.7, sh: blobShadow(2.9, 2.1, .5) }, { m: sk, x: -.85, z: 1.1, r: -.1, t0: 3.0, sh: blobShadow(stick.aspect * .6, .75, .5) }];
  items.forEach(it => { s.add(it.m, it.sh); it.sh.position.y = .005; }); s.add(t1, t2, t3);
  return { scene: s, cam, frame(t, d) {
    items.forEach(it => { const k = pr(t, it.t0, it.t0 + .7), e = o4(k), fall = (1 - e); it.m.position.set(it.x + fall * .5, .04 + fall * 3, it.z - fall * 1.2); it.m.rotation.z = it.r + fall * .5; it.m.visible = k > 0; it.sh.position.set(it.x + fall * 1.2, .01, it.z - fall * 1.2 + .06); it.sh.scale.set(it.sh.scale.x, it.sh.scale.y, 1); it.sh.material.opacity = (it === items[0] ? .55 : .5) * e; it.sh.visible = k > 0; it.sh.rotation.z = it.r; });
    drawChart(io3(pr(t, .9, 2.4)), o3(pr(t, 2.5, 3.4)));
    const lp = pr(t, .7, 1.0); t1.position.set(-1.0, .06, -2.45); t1.rotation.z = .6; t2.position.set(.75, .06, -2.5); t2.rotation.z = -.5; t3.position.set(.5, .06, 1.3); t3.rotation.z = .15; t1.visible = t2.visible = lp >= 1; t3.visible = t > 2.4;
    const k = io3(pr(t, 0, d)); cam.position.set(lerp(-.5, .4, k), lerp(11.2, 8.6, k), lerp(1.2, .2, k)); cam.lookAt(lerp(.1, .2, k), 0, lerp(-.1, -.3, k));
  } };
} };
