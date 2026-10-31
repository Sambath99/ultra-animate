// node lib/build.js reel.json out.html  -> one self-contained HTML (three.js + fonts + code + spec inlined)
const fs = require('fs'), path = require('path');
const lib = __dirname, spec = JSON.parse(fs.readFileSync(path.resolve(process.argv[2]), 'utf8')), outp = path.resolve(process.argv[3] || 'reel.html');
let nm = path.join(lib, 'node_modules'); if (!fs.existsSync(nm)) nm = path.join(process.cwd(), 'node_modules');
const req = p => path.join(nm, p), b64 = f => fs.readFileSync(f).toString('base64');
const F = (fam, w, pkg, file) => `@font-face{font-family:'${fam}';font-weight:${w};src:url(data:font/woff2;base64,${b64(req(`@fontsource/${pkg}/files/${file}`))}) format('woff2');}`;
const css = [
  F('UA Inter', 700, 'inter', 'inter-latin-700-normal.woff2'), F('UA Inter', 500, 'inter', 'inter-latin-500-normal.woff2'),
  F('UA Kantumruy', 700, 'kantumruy-pro', 'kantumruy-pro-khmer-700-normal.woff2'), F('UA Kantumruy', 700, 'kantumruy-pro', 'kantumruy-pro-latin-700-normal.woff2'),
  F('UA Playfair', 900, 'playfair-display', 'playfair-display-latin-900-normal.woff2'), F('UA Playfair', 700, 'playfair-display', 'playfair-display-latin-700-normal.woff2'),
  F('UA Grotesk', 700, 'space-grotesk', 'space-grotesk-latin-700-normal.woff2'), F('UA Mono', 500, 'jetbrains-mono', 'jetbrains-mono-latin-500-normal.woff2'),
  F('UA NotoSerifKhmer', 700, 'noto-serif-khmer', 'noto-serif-khmer-khmer-700-normal.woff2'),
].join('\n');
const three = fs.readFileSync(req('three/build/three.cjs'), 'utf8');
const code = ['ua_core.js', 'ua_styles_a.js', 'ua_styles_b.js', ...(fs.readdirSync(lib).filter(f => /^ua_style_x_.*\.js$/.test(f))), 'ua_main.js'].map(f => fs.readFileSync(path.join(lib, f), 'utf8')).join('\n');
fs.writeFileSync(outp, `<!doctype html><html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${spec.title || 'ultra-animate'}</title><style>${css}\nhtml,body{margin:0;background:#000;height:100%}canvas{display:block;max-height:100vh;margin:auto;aspect-ratio:${spec.w || 1080}/${spec.h || 1920}}</style></head><body><canvas id="c"></canvas><script>var THREE={};(function(exports){${three}
})(THREE);</script><script>const SPEC=${JSON.stringify(spec)};</script><script>${code}</script><script>(function(){const c=document.getElementById('c');let t0=null;function loop(ts){if(!window.__ready){requestAnimationFrame(loop);return}if(t0===null)t0=ts;const t=((ts-t0)/1000)%window.DUR;render(t);requestAnimationFrame(loop)}if(!/still/.test(location.search))requestAnimationFrame(loop)})()</script></body></html>`);
console.log('built', outp, (fs.statSync(outp).size / 1e6).toFixed(2) + ' MB');
