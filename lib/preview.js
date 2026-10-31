// node lib/preview.js reel.html [t1,t2,...]  -> stills + contact_sheet.jpg next to the html (look at them before rendering!)
const { chromium } = require('playwright'), fs = require('fs'), path = require('path'), { pathToFileURL } = require('url'), { spawnSync } = require('child_process');
(async () => {
  const html = path.resolve(process.argv[2]), dir = path.join(path.dirname(html), 'shots'); fs.mkdirSync(dir, { recursive: true });
  const b = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] }), p = await b.newPage({ viewport: { width: 540, height: 960 } }); const errs = []; p.on('pageerror', e => errs.push(e.message)); p.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await p.goto(pathToFileURL(html).href + '?still=1'); await p.waitForFunction('window.__ready===true', null, { timeout: 120000 }); const dur = await p.evaluate('DUR');
  const ts = process.argv[3] ? process.argv[3].split(',').map(Number) : Array.from({ length: 18 }, (_, i) => +((i + .5) * dur / 18).toFixed(2)); let n = 0, t0 = Date.now();
  fs.writeFileSync(path.join(dir, 'times.txt'), ts.map((t, i) => `s${String(i).padStart(3, '0')}.png = ${t}s`).join('\n'));
  for (const t of ts) { await p.evaluate(t => render(t), t); await p.locator('#c').screenshot({ path: path.join(dir, `s${String(n++).padStart(3, '0')}.png`) }); }
  console.log(`duration ${dur.toFixed(1)}s, ${ts.length} stills in ${((Date.now() - t0) / 1000).toFixed(0)}s`); if (errs.length) console.log('ERRORS', [...new Set(errs)].slice(0, 5).join(' | '));
  spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', path.join(dir, 's%03d.png'), '-vf', `scale=270:480,tile=6x${Math.ceil(ts.length / 6)}`, '-frames:v', '1', path.join(dir, 'contact_sheet.jpg')]); console.log('contact sheet:', path.join(dir, 'contact_sheet.jpg')); await b.close();
})();
