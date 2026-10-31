'use strict';
/* ultra-animate core: math, themes, canvas textures, text helpers, fake shadow, shared renderer.
   Everything is a pure function of time t -> deterministic frames (scrub == render). */
const T = THREE;
const cl = (v, a = 0, b = 1) => v < a ? a : v > b ? b : v;
const lerp = (a, b, k) => a + (b - a) * k;
const pr = (t, a, b) => cl((t - a) / (b - a));
const o3 = t => 1 - Math.pow(1 - t, 3), o4 = t => 1 - Math.pow(1 - t, 4), i3 = t => t * t * t;
const io3 = t => t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
const back = (t, s = 1.6) => { t = t - 1; return 1 + (s + 1) * t * t * t + s * t * t; };
const spring = t => t <= 0 ? 0 : t >= 1 ? 1 : 1 - Math.exp(-7 * t) * Math.cos(15 * t);
function rng(seed) { let s = seed >>> 0; return () => { s |= 0; s = s + 0x6D2B79F5 | 0; let t = Math.imul(s ^ s >>> 15, 1 | s); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; }
function vnoise(seed) {                     // smooth 1D value noise, returns f(x)
  const r = rng(seed), v = Array.from({ length: 512 }, r);
  return x => { const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f); return lerp(v[i & 511], v[(i + 1) & 511], u); };
}
const FONT = { sans: '"UA Inter","UA Kantumruy",sans-serif', serif: '"UA Playfair","UA NotoSerifKhmer",serif', disp: '"UA Grotesk","UA Kantumruy",sans-serif', mono: '"UA Mono","UA Kantumruy",monospace', kh: '"UA Kantumruy","UA Inter",sans-serif' };
/* themes: pick one that fits the topic, or pass your own object {bg,fg,accent,mute,card,ground,water,paper}. */
const THEMES = {
  noir:   { bg: '#0b0c10', fg: '#f4f1ea', accent: '#ff5a36', mute: '#8b8d98', card: '#16171d', ground: '#14151b', water: '#1d2a3a', paper: '#efe9dc' },
  ivory:  { bg: '#ece6d8', fg: '#1b1a17', accent: '#c4361f', mute: '#7a7468', card: '#f6f1e5', ground: '#d9d2c1', water: '#b9c7cc', paper: '#f3eee2' },
  ocean:  { bg: '#04121f', fg: '#e9f6ff', accent: '#2ee6d6', mute: '#7a9bb3', card: '#0a2236', ground: '#0a1d2e', water: '#0f3b5c', paper: '#e8f1f5' },
  forest: { bg: '#0d2a1f', fg: '#f3efdf', accent: '#ffcf4a', mute: '#88a897', card: '#12382a', ground: '#1a4a38', water: '#2a6f73', paper: '#f1ecd9' },
  sunset: { bg: '#1c0f2e', fg: '#fff3e6', accent: '#ff9a3c', mute: '#a68db8', card: '#2a1745', ground: '#2a1745', water: '#5a2a6e', paper: '#f7e9d7' },
  mono:   { bg: '#f4f4f2', fg: '#101012', accent: '#2f5bff', mute: '#7b7b80', card: '#ffffff', ground: '#e4e4e0', water: '#cfd8e6', paper: '#ffffff' },
  jade:   { bg: '#0a1512', fg: '#eafff6', accent: '#3dffa0', mute: '#6f958a', card: '#102520', ground: '#0f201b', water: '#14423f', paper: '#e6f2ec' },
  rose:   { bg: '#fbeff1', fg: '#2b1018', accent: '#e11d48', mute: '#9a6b78', card: '#ffffff', ground: '#f1d9de', water: '#c9d7e6', paper: '#fff8f5' },
};
const theme = t => (typeof t === 'object' && t) ? Object.assign({}, THEMES.noir, t) : (THEMES[t] || THEMES.noir);
const col = h => new T.Color(h);
const lum = h => { const c = new T.Color(h); return .2126 * c.r + .7152 * c.g + .0722 * c.b; };

/* canvas texture: {c,x,t,upd()} */
function cvTex(w, h, srgb = true) {
  const c = document.createElement('canvas'); c.width = w; c.height = h; const x = c.getContext('2d');
  const t = new T.CanvasTexture(c); if (srgb) t.colorSpace = T.SRGBColorSpace; t.anisotropy = 8; t.generateMipmaps = true; t.minFilter = T.LinearMipmapLinearFilter;
  return { c, x, t, w, h, upd() { t.needsUpdate = true; } };
}
function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }
/* wrap text into lines that fit maxW (works for Latin words and for Khmer by falling back to char breaks) */
function wrap(x, text, maxW) {
  const out = []; let line = '';
  const toks = /\s/.test(text) ? text.split(/(\s+)/) : Array.from(text);
  for (const w of toks) { const tryL = line + w; if (x.measureText(tryL).width > maxW && line) { out.push(line.trim()); line = w.trimStart(); } else line = tryL; }
  if (line.trim()) out.push(line.trim()); return out;
}
/* label sprite: pill with text, always faces the camera. returns {s, setOpacity} ; world height h */
function label(text, o = {}) {
  const size = o.size || 64, f = `${o.weight || 700} ${size}px ${o.font || FONT.disp}`;
  const m = document.createElement('canvas').getContext('2d'); m.font = f; const lines = Array.isArray(text) ? text : [text];
  const tw = Math.max(...lines.map(s => m.measureText(s).width)), padX = o.padX ?? size * .55, padY = o.padY ?? size * .35, lh = size * 1.18;
  const w = Math.ceil(tw + padX * 2), h = Math.ceil(lines.length * lh + padY * 2 - (lh - size));
  const tx = cvTex(w, h), x = tx.x; x.font = f; x.textBaseline = 'middle'; x.textAlign = o.align || 'left';
  if (o.bg) { rrect(x, 0, 0, w, h, o.radius ?? h * .28); x.fillStyle = o.bg; x.fill(); if (o.border) { x.lineWidth = 3; x.strokeStyle = o.border; x.stroke(); } }
  lines.forEach((s, i) => { x.fillStyle = (o.colors && o.colors[i]) || o.color || '#fff'; x.font = (o.fonts && o.fonts[i]) || f; x.fillText(s, o.align === 'center' ? w / 2 : padX, padY + i * lh + size / 2); });
  tx.upd(); const mat = new T.SpriteMaterial({ map: tx.t, transparent: true, depthWrite: false, depthTest: o.depthTest ?? false });
  const sp = new T.Sprite(mat); const H = o.h || 1; sp.scale.set(H * w / h, H, 1); sp.renderOrder = 10;
  return { s: sp, set(a) { mat.opacity = a; sp.visible = a > .01; }, aspect: w / h };
}
/* soft blob shadow texture */
let _shadowTex = null;
function shadowTex() { if (_shadowTex) return _shadowTex; const t = cvTex(256, 256); const g = t.x.createRadialGradient(128, 128, 10, 128, 128, 128); g.addColorStop(0, 'rgba(0,0,0,.7)'); g.addColorStop(.55, 'rgba(0,0,0,.3)'); g.addColorStop(1, 'rgba(0,0,0,0)'); t.x.fillStyle = g; t.x.fillRect(0, 0, 256, 256); t.upd(); return _shadowTex = t.t; }
function blobShadow(w, h, op = .5) { const m = new T.Mesh(new T.PlaneGeometry(1, 1), new T.MeshBasicMaterial({ map: shadowTex(), transparent: true, opacity: op, depthWrite: false })); m.scale.set(w, h, 1); m.rotation.x = -Math.PI / 2; return m; }
function particles(n, box, color, size, seed = 3) { const r = rng(seed), p = new Float32Array(n * 3); for (let i = 0; i < n; i++) { p[i * 3] = (r() - .5) * box[0]; p[i * 3 + 1] = r() * box[1]; p[i * 3 + 2] = (r() - .5) * box[2]; } const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(p, 3)); return new T.Points(g, new T.PointsMaterial({ color, size, transparent: true, opacity: .6, depthWrite: false, sizeAttenuation: true })); }
/* sky-style helper: scene background color + fog */
function envScene(th, near, far) { const s = new T.Scene(); s.background = col(th.bg); if (near) s.fog = new T.Fog(col(th.bg), near, far); return s; }
function lights(s, th, o = {}) {
  s.add(new T.HemisphereLight(0xffffff, col(th.ground), o.hemi ?? .85));
  const d = new T.DirectionalLight(0xffffff, o.sun ?? 1.6); d.position.set(...(o.pos || [-5, 9, 6])); s.add(d); return d;
}
const STYLES = {};            // filled by styles files: STYLES[name] = { make(props, th, W, H) -> {scene,cam,frame(t,dur)} }
