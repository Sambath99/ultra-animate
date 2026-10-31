/* ultra-animate harness: spec -> timeline of 3D segments (+ command intro, crossfades, grid end card). render(t) is pure. */
const SPEC_ = SPEC, W = SPEC_.w || 1080, H = SPEC_.h || 1920, OV = SPEC_.overlap ?? .4, INTRO = SPEC_.intro === false ? 0 : (SPEC_.introDur ?? 1.5);
const out = document.getElementById('c'); out.width = W; out.height = H; const X = out.getContext('2d');
const glr = new T.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true, powerPreference: 'high-performance' }); glr.setSize(W, H, false); glr.setPixelRatio(1); glr.outputColorSpace = T.SRGBColorSpace; glr.shadowMap.enabled = true; glr.shadowMap.type = T.PCFSoftShadowMap;
const segs = SPEC_.segments.map(s => Object.assign({ dur: 5 }, s)); let cur = 0;
const layers = segs.map((s, i) => { const intro = INTRO && s.intro !== false ? INTRO : 0, S = cur; cur += intro + s.dur - (i < segs.length - 1 || SPEC_.end !== false ? OV : 0); return { kind: 'seg', s, i, intro, S, total: intro + s.dur, th: theme(s.theme), inst: null }; });
const END = SPEC_.end === false ? null : Object.assign({ dur: 3.6, type: 'grid' }, SPEC_.end || {}); let DUR_ = cur;
if (END) { const th = theme(END.theme || segs[segs.length - 1].theme); layers.push({ kind: 'end', S: cur, total: END.dur, th, e: END }); DUR_ = cur + END.dur; } else DUR_ = layers[layers.length - 1].S + layers[layers.length - 1].total;
window.DUR = DUR_;
function inst(L) { if (!L.inst) { const st = STYLES[L.s.style]; if (!st) throw new Error('unknown style ' + L.s.style); L.inst = st.make(L.s.props || {}, L.th, W, H); const FK={'stat-chart':1.5,'headline':1.8,'teardown':1.8,'map-route':1.25,'paper-desk':1.15,'ink-wash':1}; const k=(L.s.props&&L.s.props.fovk)||FK[L.s.style]||1; if(W<H&&k!==1){const c=L.inst.cam; c.fov=Math.min(100,2*Math.atan(Math.tan(c.fov*Math.PI/360)*k)*180/Math.PI); c.updateProjectionMatrix();} } return L.inst; }
function blit(a) { X.globalAlpha = a; X.drawImage(glr.domElement, 0, 0, W, H); X.globalAlpha = 1; }
function drawScene(L, local, a) {
  const I = inst(L), tt = local - L.intro + (L.intro ? .35 : 0), d = L.s.dur; const k = I; I.frame(cl(tt, 0, d + 5), d);
  glr.setClearColor(L.th.bg); glr.render(I.scene, I.cam); blit(a);
  if (I.hud && I.hud.a > .01) hud(L, I.hud);
  if (L.s.caption) caption(L, L.s.caption, local - L.intro);
}
function hud(L, h) { const a = h.a, th = L.th, y = 150 + (1 - a) * -40; X.save(); X.globalAlpha = a; X.shadowColor = 'rgba(0,0,0,.25)'; X.shadowBlur = 40; X.shadowOffsetY = 12; rrect(X, 70, y, W - 140, 190, 40); X.fillStyle = lum(th.bg) < .4 ? 'rgba(14,16,22,.92)' : 'rgba(255,255,255,.94)'; X.fill(); X.shadowColor = 'transparent'; X.fillStyle = th.accent; X.beginPath(); X.arc(150, y + 95, 34, 0, 7); X.fill(); X.fillStyle = '#fff'; X.beginPath(); X.moveTo(138, y + 95); X.lineTo(166, y + 82); X.lineTo(154, y + 108); X.closePath(); X.fill(); X.textBaseline = 'middle'; X.fillStyle = th.fg; X.font = `700 54px ${FONT.disp}`; X.fillText(h.title, 220, y + 72); X.fillStyle = th.mute; X.font = `500 40px ${FONT.mono}`; X.fillText(h.sub, 220, y + 133); X.restore(); }
function caption(L, text, lt) { const a = o3(pr(lt, .8, 1.4)) * (1 - o3(pr(lt, L.s.dur - .4, L.s.dur))); if (a <= .01) return; X.save(); X.globalAlpha = a; X.textAlign = 'center'; X.textBaseline = 'middle'; X.font = `700 62px ${FONT.disp}`; const lines = wrap(X, text, W - 200); const bh = lines.length * 80 + 50, y = H - 330 - bh / 2 + (1 - a) * 30; rrect(X, 70, y - bh / 2, W - 140, bh, 36); X.fillStyle = lum(L.th.bg) < .4 ? 'rgba(10,10,14,.78)' : 'rgba(255,255,255,.86)'; X.fill(); X.fillStyle = L.th.fg; lines.forEach((l, i) => X.fillText(l, W / 2, y - bh / 2 + 25 + 40 + i * 80)); X.restore(); }
function drawIntro(L, lt, la = 1) {            // command screen: typed slash command -> "Animating with …"
  const th = L.th, a = (1 - o3(pr(lt, L.intro - .35, L.intro))) * la; if (a <= 0) return; X.save(); X.globalAlpha = a; X.fillStyle = th.bg; X.fillRect(0, 0, W, H);
  const cmd = L.s.cmd ?? ('/' + L.s.style), n = Math.floor(cmd.length * pr(lt, .15, .75)), y = H * .62, pw = W - 160;
  X.shadowColor = 'rgba(0,0,0,.25)'; X.shadowBlur = 40; X.shadowOffsetY = 12; rrect(X, 80, y, pw, 150, 50); X.fillStyle = th.card; X.fill(); X.shadowColor = 'transparent'; X.lineWidth = 3; X.strokeStyle = th.mute + '55'; X.stroke();
  X.textBaseline = 'middle'; X.font = `600 58px ${FONT.mono}`; X.fillStyle = th.accent; X.fillText(cmd.slice(0, n), 130, y + 75); if (lt < .9 && Math.floor(lt * 3) % 2 === 0) { const w = X.measureText(cmd.slice(0, n)).width; X.fillStyle = th.fg; X.fillRect(134 + w, y + 40, 5, 70); }
  X.fillStyle = th.mute; X.font = `500 40px ${FONT.mono}`; if (L.s.hint !== false) X.fillText(L.s.hint || (STYLES[L.s.style].desc || '').split('(')[0].trim().slice(0, 52), 100, y - 60);
  const k = pr(lt, .8, 1.0); if (k > 0) { X.globalAlpha = a * k; const sx = 120, sy = y + 270; X.save(); X.translate(sx, sy); X.rotate(lt * 5); X.fillStyle = th.accent; for (let i = 0; i < 8; i++) { X.rotate(Math.PI / 4); X.fillRect(-4, 8, 8, 26); } X.restore(); X.fillStyle = th.fg; X.font = `500 46px ${FONT.sans}`; X.fillText('Animating with ' + L.s.style + '…', 190, sy); }
  X.restore();
}
const thumbs = {};
function thumb(L) { if (thumbs[L.i]) return thumbs[L.i]; const I = inst(L), c = document.createElement('canvas'); c.width = W / 2; c.height = H / 2; const d = L.s.dur; I.frame(d * (L.s.thumbAt ?? .86), d); glr.setClearColor(L.th.bg); glr.render(I.scene, I.cam); c.getContext('2d').drawImage(glr.domElement, 0, 0, W / 2, H / 2); return thumbs[L.i] = c; }
function drawEnd(L, lt) {
  const th = L.th, e = L.e; X.fillStyle = th.bg; X.fillRect(0, 0, W, H); X.textAlign = 'center'; X.textBaseline = 'middle';
  const ttl = e.title || 'Animation Styles'; const k0 = o3(pr(lt, .1, .7)); X.globalAlpha = k0; X.fillStyle = th.fg; X.font = `700 92px ${FONT.disp}`; wrap(X, ttl, W - 160).forEach((l, i) => X.fillText(l, W / 2, 190 + i * 100 + (1 - k0) * 30)); if (e.sub) { X.fillStyle = th.accent; X.font = `600 44px ${FONT.sans}`; X.fillText(e.sub, W / 2, 330); } X.globalAlpha = 1;
  const segL = layers.filter(l => l.kind === 'seg'), n = segL.length, cols = n <= 4 ? 2 : 3, gap = 22, cw = (W - 130 - gap * (cols - 1)) / cols, ch = cw * H / W, rows = Math.ceil(n / cols), sc = Math.min(1, 1000 / (rows * ch + gap * (rows - 1))), w2 = cw * sc, h2 = ch * sc, gw = cols * w2 + (cols - 1) * gap, x0 = (W - gw) / 2, y0 = 420;
  segL.forEach((l, i) => { const p = spring(pr(lt, .35 + i * .12, .95 + i * .12)); if (p <= 0) return; const cx = x0 + (i % cols) * (w2 + gap), cy = y0 + Math.floor(i / cols) * (h2 + gap); X.save(); X.translate(cx + w2 / 2, cy + h2 / 2); X.scale(p, p); X.globalAlpha = cl(p * 2); X.shadowColor = 'rgba(0,0,0,.3)'; X.shadowBlur = 30; X.shadowOffsetY = 10; rrect(X, -w2 / 2, -h2 / 2, w2, h2, 26); X.fillStyle = th.card; X.fill(); X.shadowColor = 'transparent'; X.save(); rrect(X, -w2 / 2, -h2 / 2, w2, h2, 26); X.clip(); X.drawImage(thumb(l), -w2 / 2, -h2 / 2, w2, h2); X.restore(); X.restore(); });
  const cy = Math.min(H - 330, y0 + rows * (h2 + gap) + 150), p = spring(pr(lt, .9 + n * .12, 1.5 + n * .12)); if (p > 0 && e.cta !== false) { X.save(); X.translate(W / 2, cy); X.scale(p, p); X.globalAlpha = cl(p * 2); X.font = `700 62px ${FONT.disp}`; X.fillStyle = th.fg; const l1 = e.cta || 'Comment “ANIMATE”'; X.fillText(l1, 0, -20); if (e.cta2 !== false) { const t2 = e.cta2 || 'for every style’s prompt'; X.font = `600 44px ${FONT.sans}`; const w = X.measureText(t2).width + 80; rrect(X, -w / 2, 40, w, 84, 24); X.fillStyle = th.accent; X.fill(); X.fillStyle = lum(th.accent) > .55 ? '#111' : '#fff'; X.fillText(t2, 0, 83); } X.restore(); }
  X.textAlign = 'left';
}
function render(t) {
  t = cl(t, 0, DUR_ - .0001); X.setTransform(1, 0, 0, 1, 0, 0); X.globalAlpha = 1; X.fillStyle = '#000'; X.fillRect(0, 0, W, H);
  layers.forEach((L, idx) => { const lt = t - L.S; if (lt < 0 || lt > L.total + .001 && idx < layers.length - 1 && t > L.S + L.total) return; const a = idx === 0 ? 1 : cl(lt / OV); if (L.kind === 'end') { X.globalAlpha = a; drawEnd(L, lt); X.globalAlpha = 1; return; }
    const sceneOn = lt >= L.intro - .35; if (sceneOn) drawScene(L, lt, a); if (L.intro && lt < L.intro) { X.globalAlpha = 1; drawIntro(L, lt, a); } });
}
window.render = render; window.__ready = false;
(async () => { await Promise.all(['700 40px "UA Inter"', '700 40px "UA Kantumruy"', '900 40px "UA Playfair"', '700 40px "UA Grotesk"', '500 40px "UA Mono"', '700 40px "UA NotoSerifKhmer"'].map(f => document.fonts.load(f, 'Abcក្ខ០១២'))); await document.fonts.ready; window.__ready = true; render(0); })();
