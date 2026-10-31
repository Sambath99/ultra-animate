// node lib/render.js reel.html out.mp4 [--fps 30] [--workers 2] [--scale 1]   (silent video; WebGL via SwiftShader, no GPU needed)
const { chromium } = require('playwright'), { spawn, spawnSync } = require('child_process'), fs = require('fs'), os = require('os'), path = require('path'), { pathToFileURL } = require('url');
const html = path.resolve(process.argv[2]), outFile = path.resolve(process.argv[3] || 'reel.mp4'), arg = (k, d) => { const i = process.argv.indexOf('--' + k); return i > 0 ? process.argv[i + 1] : d; };
const FPS = +arg('fps', 30), WORKERS = +arg('workers', Math.max(1, Math.min(3, os.cpus().length))), tmp = path.join(path.dirname(outFile), '_ua_tmp'); fs.mkdirSync(tmp, { recursive: true });
const URL = pathToFileURL(html).href + '?still=1', fwd = p => p.replace(/\\/g, '/');
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];
async function worker(browser, n, a, b) {
  const page = await browser.newPage({ viewport: { width: 540, height: 960 } }); await page.goto(URL); await page.waitForFunction('window.__ready===true', null, { timeout: 120000 });
  const part = path.join(tmp, `part${n}.mp4`);
  const ff = spawn('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'image2pipe', '-framerate', String(FPS), '-c:v', 'png', '-i', '-', '-vf', 'scale=out_color_matrix=bt709:out_range=tv,format=yuv420p', '-c:v', 'libx264', '-preset', 'medium', '-crf', '18', '-g', String(FPS), '-colorspace', 'bt709', '-color_primaries', 'bt709', '-color_trc', 'bt709', '-color_range', 'tv', '-an', part], { stdio: ['pipe', 'inherit', 'inherit'] });
  const done = new Promise(r => ff.on('close', r)), t0 = Date.now();
  for (let i = a; i < b; i++) { const url = await page.evaluate(t => { render(t); return document.getElementById('c').toDataURL('image/png'); }, i / FPS); if (!ff.stdin.write(Buffer.from(url.slice(22), 'base64'))) await new Promise(r => ff.stdin.once('drain', r)); if ((i - a) % 60 === 0) console.log(`worker${n} ${i - a}/${b - a}  ${((Date.now() - t0) / 1000).toFixed(0)}s`); }
  ff.stdin.end(); await done; await page.close(); return part;
}
(async () => {
  const browser = await chromium.launch({ args: ARGS }); const p0 = await browser.newPage(); await p0.goto(URL); await p0.waitForFunction('window.__ready===true', null, { timeout: 120000 }); const DUR = await p0.evaluate('DUR'); await p0.close();
  const TOTAL = Math.round(FPS * DUR), step = Math.ceil(TOTAL / WORKERS); console.log(`render ${DUR.toFixed(1)}s @ ${FPS}fps = ${TOTAL} frames on ${WORKERS} workers`);
  const parts = await Promise.all(Array.from({ length: WORKERS }, (_, n) => worker(browser, n, n * step, Math.min(TOTAL, (n + 1) * step))));
  fs.writeFileSync(path.join(tmp, 'list.txt'), parts.map(f => `file '${fwd(f)}'`).join('\n'));
  const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-f', 'concat', '-safe', '0', '-i', path.join(tmp, 'list.txt'), '-c', 'copy', '-movflags', '+faststart', outFile]);
  if (r.status) console.error('concat failed'); else console.log('done', outFile, (fs.statSync(outFile).size / 1e6).toFixed(1) + ' MB'); await browser.close();
})();
