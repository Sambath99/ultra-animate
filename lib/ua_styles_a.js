/* ===== stat-chart : a huge number counting up over a glowing 3D line chart ===== */
STYLES['stat-chart'] = { name: 'stat-chart', desc: 'Big number + glowing 3D growth line (revenue, users, students, results).', make(P, th, W, H) {
  const s = envScene(th, 12, 32), cam = new T.PerspectiveCamera(36, W / H, .1, 100);
  const ser = (P.series && P.series.length > 3) ? P.series : [.5, .55, .6, .62, .7, .8, .95, 1.1, 1.5, 2.2, 2.9, 3.4, 3.8, 4.1];
  const mn = Math.min(...ser), mx = Math.max(...ser), N = ser.length, X0 = -3.6, X1 = 3.6;
  const pts = ser.map((v, i) => new T.Vector3(lerp(X0, X1, i / (N - 1)), .15 + (v - mn) / (mx - mn || 1) * 3.2, 0));
  const curve = new T.CatmullRomCurve3(pts, false, 'catmullrom', .35);
  const TS = 360, geo = new T.TubeGeometry(curve, TS, .05, 10, false), glow = new T.TubeGeometry(curve, TS, .16, 10, false);
  const accent = col(th.accent);
  const line = new T.Mesh(geo, new T.MeshBasicMaterial({ color: accent })), gl = new T.Mesh(glow, new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: .22, blending: T.AdditiveBlending, depthWrite: false }));
  s.add(line, gl); const idxN = geo.index.count, idxG = glow.index.count;
  // area ribbon under the curve
  const P2 = [], I2 = []; const SM = 240; for (let i = 0; i <= SM; i++) { const p = curve.getPoint(i / SM); P2.push(p.x, p.y, 0, p.x, 0, 0); if (i) { const a = (i - 1) * 2; I2.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const ag = new T.BufferGeometry(); ag.setAttribute('position', new T.Float32BufferAttribute(P2, 3)); ag.setIndex(I2);
  const area = new T.Mesh(ag, new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: .16, side: T.DoubleSide, depthWrite: false })); s.add(area); const idxA = I2.length;
  // floor grid + axis
  const gt = cvTex(1024, 1024); gt.x.fillStyle = 'rgba(0,0,0,0)'; gt.x.clearRect(0, 0, 1024, 1024); gt.x.strokeStyle = th.mute; gt.x.globalAlpha = .35; gt.x.lineWidth = 2; for (let i = 0; i <= 16; i++) { gt.x.beginPath(); gt.x.moveTo(i * 64, 0); gt.x.lineTo(i * 64, 1024); gt.x.moveTo(0, i * 64); gt.x.lineTo(1024, i * 64); gt.x.stroke(); } gt.upd();
  const floor = new T.Mesh(new T.PlaneGeometry(30, 30), new T.MeshBasicMaterial({ map: gt.t, transparent: true, opacity: .9, depthWrite: false })); floor.rotation.x = -Math.PI / 2; floor.position.y = -.02; s.add(floor);
  const base = new T.Mesh(new T.BoxGeometry(8.2, .03, .03), new T.MeshBasicMaterial({ color: col(th.mute) })); base.position.set(0, 0, 0); s.add(base);
  s.add(particles(160, [26, 9, 14], col(th.fg), .05, 5));
  // x-axis labels
  const xl = P.xlabels || [ser.length > 6 ? '' : '']; (P.xlabels || []).forEach((tx, i, a) => { const L = label(tx, { size: 56, color: th.mute, font: FONT.mono, weight: 500, h: .26 }); L.s.position.set(lerp(X0, X1, i / (a.length - 1)), -.28, .3); L.set(.9); s.add(L.s); });
  // marks (milestones)
  const marks = (P.marks || []).map(m => { const i = m.i ?? Math.floor(N * .75), p = curve.getPoint(i / (N - 1)); const L = label([m.text || 'Launch', m.sub || ''].filter(Boolean), { size: 58, color: th.fg, colors: [th.fg, th.mute], fonts: [`700 58px ${FONT.disp}`, `500 44px ${FONT.mono}`], bg: th.card, border: th.accent, h: m.sub ? .95 : .6, padX: 40 }); L.s.position.set(p.x - .2, p.y + 1.1, .2); s.add(L.s);
    const dot = new T.Mesh(new T.SphereGeometry(.11, 20, 16), new T.MeshBasicMaterial({ color: col(th.fg) })); dot.position.copy(p); s.add(dot); return { u: i / (N - 1), L, dot }; });
  // moving head
  const head = new T.Mesh(new T.SphereGeometry(.14, 24, 18), new T.MeshBasicMaterial({ color: col(th.fg) })), ring = new T.Mesh(new T.RingGeometry(.2, .26, 40), new T.MeshBasicMaterial({ color: accent, transparent: true, opacity: .8, side: T.DoubleSide })); s.add(head, ring);
  // big number panel
  const num = cvTex(1400, 760), panel = new T.Mesh(new T.PlaneGeometry(6.4, 3.48), new T.MeshBasicMaterial({ map: num.t, transparent: true, depthWrite: false })); panel.position.set(-.2, 5.6, -1.2); s.add(panel);
  const pre = P.prefix ?? '$', unit = P.unit ?? 'B', from = P.from ?? mn, to = P.to ?? ser[N - 1], dec = P.decimals ?? 1;
  function drawNum(v, a) {
    const x = num.x; x.clearRect(0, 0, 1400, 760); x.globalAlpha = a;
    x.fillStyle = th.mute; x.font = `600 44px ${FONT.mono}`; x.textBaseline = 'alphabetic'; x.fillText((P.kicker || '').toUpperCase(), 40, 70);
    x.fillStyle = th.fg; x.font = `500 52px ${FONT.sans}`; x.fillText(P.label || '', 40, 150);
    x.font = `700 330px ${FONT.disp}`; const t = pre + v.toFixed(dec); x.fillStyle = th.fg; x.fillText(pre, 30, 500);
    const pw = x.measureText(pre).width; x.fillText(v.toFixed(dec), 30 + pw, 500); const vw = x.measureText(v.toFixed(dec)).width; x.font = `700 200px ${FONT.disp}`; x.fillStyle = th.accent; x.fillText(unit, 30 + pw + vw + 12, 500);
    x.fillStyle = th.mute; x.font = `500 46px ${FONT.mono}`; x.fillText(P.footnote || '', 40, 640); num.upd();
  }
  s.add(new T.AmbientLight(0xffffff, 1));
  return { scene: s, cam, frame(t, d) {
    const g = io3(pr(t, .5, Math.max(1.5, d * .72))), vis = o3(pr(t, 0, .5));
    geo.setDrawRange(0, Math.floor(idxN * g / 3) * 3); glow.setDrawRange(0, Math.floor(idxG * g / 3) * 3); ag.setDrawRange(0, Math.floor(idxA * g / 6) * 6);
    const hp = curve.getPoint(cl(g, .001, 1)); head.position.copy(hp); ring.position.copy(hp); ring.scale.setScalar(1 + .35 * Math.sin(t * 6)); ring.material.opacity = .7 * (1 - .4 * Math.sin(t * 6)); ring.lookAt(cam.position);
    drawNum(lerp(from, to, g), vis);
    marks.forEach(m => { const k = pop(pr(g, m.u - .02, m.u + .06)); m.L.set(cl(k)); m.L.s.scale.setScalar(1); m.dot.scale.setScalar(k); });
    const k = t / d, ang = lerp(-.55, .5, io3(k)), rad = lerp(13.5, 9.8, io3(k)), hgt = lerp(2.2, 4.4, io3(k));
    cam.position.set(Math.sin(ang) * rad, hgt, Math.cos(ang) * rad); cam.lookAt(0, lerp(2.6, 2.4, k), 0);
    panel.lookAt(cam.position.x * .35, panel.position.y, cam.position.z);
  } };
} };
function pop(k) { return spring(k); }

/* ===== map-route : 3D city, blue route draws itself, camera dives in ===== */
STYLES['map-route'] = { name: 'map-route', desc: '3D city with a route drawing itself (location, journey, campus, delivery, "find us").', make(P, th, W, H) {
  const s = envScene(th, 18, 46), cam = new T.PerspectiveCamera(34, W / H, .1, 120); const dark = lum(th.bg) < .4;
  const R = rng(P.seed ?? 11), noise = vnoise(P.seed ?? 11), G = 25, C = G / 2 | 0;
  const riverZ = x => 1.8 * Math.sin(x * .32) - 1.2;      // river centre line
  const blds = []; for (let i = 0; i < G; i++) for (let j = 0; j < G; j++) {
    const x = (i - C) * 1.0, z = (j - C) * 1.0; if (i % 4 === 0 || j % 4 === 0) continue;        // streets every 4th line
    if (Math.abs(z - riverZ(x)) < 1.05) continue;
    const park = (Math.floor(i / 4) * 7 + Math.floor(j / 4) * 3) % 11 === 0; const dc = Math.hypot(x, z) / C;
    blds.push({ x, z, h: park ? 0 : .25 + Math.pow(noise(i * .5 + j * .37), 2.2) * (2.1 - dc * 1.1) + R() * .3, w: .62 + R() * .18, park });
  }
  const box = new T.BoxGeometry(1, 1, 1); box.translate(0, .5, 0);
  const bl = blds.filter(b => !b.park), inst = new T.InstancedMesh(box, new T.MeshStandardMaterial({ color: 0xffffff, roughness: .85 }), bl.length), m4 = new T.Matrix4();
  const base = col(dark ? '#3a4150' : '#f1f1ee'); bl.forEach((b, i) => { m4.makeScale(b.w, b.h, b.w); m4.setPosition(b.x, 0, b.z); inst.setMatrixAt(i, m4); inst.setColorAt(i, base.clone().multiplyScalar(.9 + R() * .18)); }); inst.castShadow = true; inst.receiveShadow = true; s.add(inst);
  const ground = new T.Mesh(new T.PlaneGeometry(80, 80), new T.MeshStandardMaterial({ color: col(th.ground), roughness: 1 })); ground.rotation.x = -Math.PI / 2; ground.receiveShadow = true; s.add(ground);
  // river ribbon
  const rp = [], ri = []; for (let i = 0; i <= 80; i++) { const x = (i / 80 - .5) * 30, z = riverZ(x), n = Math.cos(x * .32) * .576; const nl = Math.hypot(1, n), nx = -n / nl, nz = 1 / nl; rp.push(x + nx * .85, .012, z + nz * .85, x - nx * .85, .012, z - nz * .85); if (i) { const a = (i - 1) * 2; ri.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }
  const rg = new T.BufferGeometry(); rg.setAttribute('position', new T.Float32BufferAttribute(rp, 3)); rg.setIndex(ri); rg.computeVertexNormals(); s.add(new T.Mesh(rg, new T.MeshStandardMaterial({ color: col(th.water), roughness: .35, side: T.DoubleSide })));
  // parks + trees
  blds.filter(b => b.park).forEach(b => { const pk = new T.Mesh(new T.BoxGeometry(2.6, .03, 2.6), new T.MeshStandardMaterial({ color: dark ? 0x1f4a35 : 0xb9d6a2 })); pk.position.set(b.x, .015, b.z); s.add(pk); for (let k = 0; k < 5; k++) { const tr = new T.Mesh(new T.SphereGeometry(.22 + R() * .08, 10, 8), new T.MeshStandardMaterial({ color: dark ? 0x2f7a52 : 0x7fb069 })); tr.position.set(b.x + (R() - .5) * 2, .3, b.z + (R() - .5) * 2); s.add(tr); } });
  const sun = lights(s, th, { hemi: dark ? .7 : 1, sun: dark ? 1.1 : 1.7, pos: [-8, 14, 6] }); sun.castShadow = true; sun.shadow.mapSize.set(2048, 2048); const sc = sun.shadow.camera; sc.left = -16; sc.right = 16; sc.top = 16; sc.bottom = -16; sc.far = 50; sun.shadow.bias = -.0006;
  // route: streets are on lines i%4==0 -> world coords multiples of 4 relative to centre offset
  const st = v => Math.round(v / 4) * 4; const A = P.start || [-8, 8], B = P.end || [8, -8], W2 = P.via || [[-8, 0], [0, 0], [0, -8]];
  const way = [A, ...W2, B].map(p => new T.Vector3(st(p[0]), .04, st(p[1])));
  const path = [way[0]]; for (let i = 1; i < way.length; i++) { const a = path[path.length - 1], b = way[i]; if (a.x !== b.x && a.z !== b.z) path.push(new T.Vector3(b.x, .04, a.z)); path.push(b); }
  const dense = []; path.forEach((p, i) => { if (!i) return; const a = path[i - 1], n = Math.max(2, Math.round(a.distanceTo(p) / .08)); for (let k = (i === 1 ? 0 : 1); k <= n; k++) dense.push(a.clone().lerp(p, k / n)); });
  function ribbon(w, y, colr, op) { const pp = [], ii = []; dense.forEach((p, i) => { const q = dense[Math.min(i + 1, dense.length - 1)], r0 = dense[Math.max(i - 1, 0)]; const dx = q.x - r0.x, dz = q.z - r0.z, l = Math.hypot(dx, dz) || 1, nx = -dz / l * w / 2, nz = dx / l * w / 2; pp.push(p.x + nx, y, p.z + nz, p.x - nx, y, p.z - nz); if (i) { const a = (i - 1) * 2; ii.push(a, a + 1, a + 2, a + 1, a + 3, a + 2); } }); const g = new T.BufferGeometry(); g.setAttribute('position', new T.Float32BufferAttribute(pp, 3)); g.setIndex(ii); const m = new T.Mesh(g, new T.MeshBasicMaterial({ color: col(colr), transparent: op < 1, opacity: op, side: T.DoubleSide })); m.renderOrder = 2; s.add(m); return { g, n: ii.length }; }
  const cas = ribbon(.34, .03, '#ffffff', 1), rte = ribbon(.2, .045, th.accent, 1);
  const puck = new T.Mesh(new T.SphereGeometry(.2, 24, 18), new T.MeshBasicMaterial({ color: col(th.accent) })), halo = new T.Mesh(new T.RingGeometry(.28, .4, 40), new T.MeshBasicMaterial({ color: col(th.accent), transparent: true, opacity: .55, side: T.DoubleSide })); halo.rotation.x = -Math.PI / 2; s.add(puck, halo);
  const end = path[path.length - 1], pin = new T.Mesh(new T.ConeGeometry(.28, .8, 20), new T.MeshStandardMaterial({ color: 0xff3b30 })); pin.rotation.x = Math.PI; pin.position.set(end.x, .9, end.z); s.add(pin); const pinHead = new T.Mesh(new T.SphereGeometry(.2, 16, 12), new T.MeshStandardMaterial({ color: 0xff3b30 })); pinHead.position.set(end.x, 1.35, end.z); s.add(pinHead);
  const places = P.places || [{ name: 'Old Town', x: -5, z: 4 }, { name: 'Central Station', x: 3, z: 1 }, { name: 'Riverside Park', x: -3, z: -5 }];
  const labs = places.map(p => { const L = label(p.name, { size: 52, color: th.fg, bg: dark ? 'rgba(10,12,16,.7)' : 'rgba(255,255,255,.88)', color2: th.fg, h: .56, weight: 600, font: FONT.sans }); L.s.position.set(p.x, 1.5, p.z); L.s.material.depthTest = true; L.s.material.color = new T.Color(1, 1, 1); s.add(L.s); return L; });
  const dl = label(P.dest || 'Destination', { size: 60, color: '#fff', bg: '#ff3b30', h: .6, font: FONT.disp }); dl.s.position.set(end.x, 2.1, end.z); s.add(dl.s);
  const hud = { title: P.title || 'Route', sub: P.dist || '' };
  let hudA = 0;
  return { scene: s, cam, hud, frame(t, d) {
    const g = io3(pr(t, .7, d * .78)); const cnt = Math.floor(rte.n / 6 * g) * 6; rte.g.setDrawRange(0, cnt); cas.g.setDrawRange(0, cnt);
    const idx = Math.min(dense.length - 1, Math.floor(g * (dense.length - 1))), hp = dense[idx]; puck.position.set(hp.x, .22, hp.z); halo.position.set(hp.x, .06, hp.z); const sc2 = 1 + (t * 2 % 1) * .9; halo.scale.setScalar(sc2); halo.material.opacity = .6 * (1 - (t * 2 % 1));
    labs.forEach((L, i) => L.set(o3(pr(t, 1.2 + i * .25, 1.8 + i * .25)) * .95)); dl.set(o3(pr(g, .9, 1)));
    pin.position.y = .9 + Math.sin(t * 3) * .05; pinHead.position.y = 1.35 + Math.sin(t * 3) * .05;
    const k = pr(t, 0, d), over = o4(pr(t, 0, d * .28)); const fx = lerp(0, hp.x, io3(pr(t, d * .15, d * .45))), fz = lerp(0, hp.z, io3(pr(t, d * .15, d * .45)));
    const ang = lerp(.5, -.55, io3(k)), dist = lerp(25, 9, io3(pr(t, 0, d * .6))), h = lerp(21, 7.5, io3(pr(t, 0, d * .6)));
    cam.position.set(fx + Math.sin(ang) * dist * .35, h, fz + Math.cos(ang) * dist); cam.lookAt(fx, 0, fz);
    this.hud.a = o3(pr(t, .2, .8));
  } };
} };

/* ===== headline : a newspaper page flies in, highlighter marks the key phrases ===== */
STYLES['headline'] = { name: 'headline', desc: 'Newspaper page with highlighted key lines (news, quotes, announcements, claims). Khmer supported.', make(P, th, W, H) {
  const s = new T.Scene(); const dark = true; s.background = col('#0d0d10'); s.fog = new T.Fog(col('#0d0d10'), 9, 22);
  const cam = new T.PerspectiveCamera(32, W / H, .1, 60);
  const PW = 1400, PH = 1900, tex = cvTex(PW, PH); const paper = P.paper || 'The Daily Ledger', hed = P.head || 'A regional retailer quietly moved its call center to AI. Then margins doubled.';
  const body = P.body || 'When Halvorsen Home Goods moved its customer calls to an automated agent last spring, executives called it a pilot. By September, support costs had fallen 58 percent while a team of eleven handled twice the volume. Internal documents show the plan was approved in early 2025, a full year before anyone outside the building knew.';
  const hi = P.highlights || ['support costs had fallen 58 percent', 'twice the volume'], hiLines = P.highlightLines || [];
  const serif = FONT.serif, rr = rng(4);
  // fixed layout (computed once)
  const lay = (() => { const x = tex.x; x.font = `400 40px ${serif}`; const words = body.split(/(?<=\s)/), lines = []; let cur = [], w = 0, maxW = PW - 200 - 130; const khm = !/\s/.test(body); const toks = khm ? Array.from(body) : words; let lineIdx = 0;
    toks.forEach(tk => { const tw = x.measureText(tk).width; if (w + tw > (lines.length < 3 ? maxW : PW - 200) && cur.length) { lines.push(cur); cur = []; w = 0; } cur.push({ t: tk, w: tw, x: w }); w += tw; }); if (cur.length) lines.push(cur); return lines; })();
  const speckle = (() => { const c = document.createElement('canvas'); c.width = PW; c.height = PH; const x = c.getContext('2d'); x.fillStyle = th.paper; x.fillRect(0, 0, PW, PH); for (let i = 0; i < 9000; i++) { x.fillStyle = `rgba(90,70,40,${rr() * .06})`; x.fillRect(rr() * PW, rr() * PH, 2 + rr() * 3, 1 + rr() * 2); } const g = x.createLinearGradient(0, 0, 0, PH); g.addColorStop(0, 'rgba(255,255,255,.12)'); g.addColorStop(1, 'rgba(120,90,50,.10)'); x.fillStyle = g; x.fillRect(0, 0, PW, PH); return c; })();
  function drawPage(hp) {
    const x = tex.x; x.drawImage(speckle, 0, 0); x.fillStyle = '#16140f'; x.textBaseline = 'alphabetic';
    x.textAlign = 'center'; x.font = `900 150px ${serif}`; x.fillText(paper, PW / 2, 210); x.font = `500 30px ${FONT.mono}`; x.fillStyle = '#6b6354'; x.fillText((P.section || 'BUSINESS EDITION').toUpperCase() + '   ·   ' + (P.date || ''), PW / 2, 100);
    x.fillStyle = '#16140f'; x.fillRect(100, 250, PW - 200, 4); x.fillRect(100, 262, PW - 200, 2);
    x.textAlign = 'left'; x.font = `900 108px ${serif}`; x.fillStyle = '#12100c'; const hl = wrap(x, hed, PW - 200); let y = 410; hl.forEach(l => { x.fillText(l, 100, y); y += 122; });
    x.font = `500 34px ${FONT.sans}`; x.fillStyle = '#6b6354'; x.fillText(P.byline || 'By Staff Reporter', 100, y + 10); y += 70; x.fillStyle = '#16140f'; x.fillRect(100, y - 30, PW - 200, 2);
    const y0 = y + 40, lh = 62; x.font = `400 40px ${serif}`;
    // highlights (behind text)
    let hiIdx = 0; const flat = []; lay.forEach((ln, li) => ln.forEach(wd => flat.push({ ...wd, li })));
    hi.forEach((phrase, pi) => { const toks = /\s/.test(phrase) ? phrase.trim().split(/\s+/) : Array.from(phrase); const k0 = pr(hp, pi / (hi.length + hiLines.length) , (pi + 1) / (hi.length + hiLines.length)); if (k0 <= 0) return;
      for (let a = 0; a < flat.length; a++) { let ok = true; for (let b = 0; b < toks.length; b++) if (!flat[a + b] || flat[a + b].t.trim() !== toks[b]) { ok = false; break; } if (!ok) continue; const rects = {}; for (let b = 0; b < toks.length; b++) { const w = flat[a + b], r = rects[w.li] || (rects[w.li] = { x0: w.x, x1: w.x + w.w }); r.x1 = w.x + w.w; r.x0 = Math.min(r.x0, w.x); }
        const lns = Object.keys(rects).map(Number); const tot = lns.reduce((q, l) => q + rects[l].x1 - rects[l].x0, 0); let acc = 0; x.fillStyle = 'rgba(225,255,0,.85)'; lns.forEach(l => { const r = rects[l], wdt = r.x1 - r.x0, ox = (l < 3 ? 130 : 0) + 100, a0 = acc / tot, a1 = (acc + wdt) / tot; acc += wdt; const f = cl((k0 - a0) / (a1 - a0 || 1)); if (f > 0) { x.save(); x.beginPath(); rrect(x, ox + r.x0 - 6, y0 + l * lh - 40, wdt * f + 12, 54, 8); x.fill(); x.restore(); } }); break; } });
    hiLines.forEach((l, i) => { const k0 = pr(hp, (hi.length + i) / (hi.length + hiLines.length), (hi.length + i + 1) / (hi.length + hiLines.length)); if (k0 > 0 && lay[l]) { const ln = lay[l], wd = ln.reduce((q, w) => q + w.w, 0); x.fillStyle = 'rgba(225,255,0,.85)'; rrect(x, 100 + (l < 3 ? 130 : 0) - 6, y0 + l * lh - 40, wd * k0 + 12, 54, 8); x.fill(); } });
    x.fillStyle = '#1a1812'; lay.forEach((ln, li) => { const ox = (li < 3 ? 130 : 0) + 100; ln.forEach(w => x.fillText(w.t, ox + w.x, y0 + li * lh)); });
    x.font = `900 210px ${serif}`; x.fillStyle = '#12100c'; x.fillText((body.trim()[0] || 'W'), 100, y0 + 150);
    tex.upd();
  }
  const geom = new T.PlaneGeometry(3.3, 3.3 * PH / PW, 28, 36); const pos = geom.attributes.position, p0 = Float32Array.from(pos.array);
  const pmat = new T.MeshStandardMaterial({ map: tex.t, roughness: .92, side: T.DoubleSide }), page = new T.Mesh(geom, pmat); s.add(page);
  [[-.18, .1, -.35, .06, .75], [.15, -.05, -.7, -.05, .55]].forEach(([dx, dy, dz, rz, b]) => { const m = new T.Mesh(new T.PlaneGeometry(3.1, 3.1 * PH / PW), new T.MeshStandardMaterial({ map: tex.t, color: new T.Color(b, b, b * .95), roughness: .95 })); m.position.set(dx, dy, dz); m.rotation.z = rz; s.add(m); });
  const bgGrid = cvTex(1024, 1024); bgGrid.x.fillStyle = '#0d0d10'; bgGrid.x.fillRect(0, 0, 1024, 1024); for (let i = 0; i < 16; i++) for (let j = 0; j < 16; j++) { const v = 18 + ((i * 7 + j * 13) % 9); bgGrid.x.fillStyle = `rgb(${v},${v},${v + 3})`; rrect(bgGrid.x, i * 64 + 3, j * 64 + 3, 58, 58, 8); bgGrid.x.fill(); } bgGrid.upd(); bgGrid.t.wrapS = bgGrid.t.wrapT = T.RepeatWrapping; bgGrid.t.repeat.set(3, 5);
  const wall = new T.Mesh(new T.PlaneGeometry(26, 40), new T.MeshBasicMaterial({ map: bgGrid.t })); wall.position.z = -2.2; s.add(wall);
  s.add(new T.HemisphereLight(0xffffff, 0x333344, .9)); const dl = new T.DirectionalLight(0xfff4e0, 1.5); dl.position.set(-3, 5, 6); s.add(dl);
  return { scene: s, cam, frame(t, d) {
    const fl = o4(pr(t, .1, 1.3)), curl = (1 - io3(pr(t, .2, 1.5)));
    for (let i = 0; i < pos.count; i++) { const x = p0[i * 3], y = p0[i * 3 + 1], u = x / 3.3 + .5, v = y / (3.3 * PH / PW) + .5; pos.setZ(i, Math.sin(u * Math.PI) * .35 * curl + Math.sin(v * 3 + t * .8) * .01); } pos.needsUpdate = true; geom.computeVertexNormals();
    page.position.set(0, lerp(-5.5, 0, fl), lerp(2, 0, fl)); page.rotation.set(lerp(.9, 0, fl), lerp(-.4, 0, fl) + Math.sin(t * .6) * .02, lerp(.25, 0, fl));
    drawPage(pr(t, 1.2, d * .8));
    const k = io3(pr(t, 0, d)); cam.position.set(lerp(-.4, .25, k), lerp(.3, -1.2, k), lerp(9.2, 5.3, k)); cam.lookAt(lerp(0, .1, k), lerp(0, -1.0, k), 0);
  } };
} };
