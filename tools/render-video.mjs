#!/usr/bin/env node
/* Xuất video MP4 từ trang tran-danh/index.html
   Cần: Node 18+, Playwright (npm i playwright && npx playwright install chromium), ffmpeg.

   Cách dùng:
     node tools/render-video.mjs <id-trận | all> [--doc] [--fps 30] [--out thư-mục] [--voice thư-mục] [--preview]

   --doc       khung dọc 1080×1920 (TikTok / Reels / Shorts); mặc định ngang 1920×1080
   --voice D   thư mục chứa file thu âm lời dẫn cho từng cảnh: D/<id>/01.mp3, 02.mp3 ...
               (mặc định: thư mục loi-dan/ trong kho; --no-voice để tắt giọng)
               (thu bằng điện thoại hoặc AI giọng đọc). Cảnh sẽ tự kéo dài theo độ dài file.
   --preview   chỉ xuất ảnh PNG giữa mỗi cảnh để duyệt nhanh
   --cho-phep-thieu-giong  vẫn xuất khi trận chưa đủ giọng Manus (chỉ phụ đề, dùng để duyệt hình)
   --page F    trang dựng (mặc định index.html; phim 3D: --page phim3d.html bach-dang-1288 --fps 24)
   Ví dụ:  node tools/render-video.mjs bach-dang-1288
*/
import { createRequire } from 'node:module';
import { spawn, execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : (args[i + 1] && !args[i + 1].startsWith('--') ? args[i + 1] : true); };
const which = args.find((a, i) => !a.startsWith('--') && !['--out', '--voice', '--fps', '--page'].includes(args[i - 1])) || 'all';
const format = args.includes('--doc') ? 'doc' : 'ngang';
const fps = Number(flag('--fps', 30));
const outDir = path.resolve(flag('--out', path.join(ROOT, 'video')));
const voiceDir = args.includes('--no-voice') ? null : flag('--voice', fs.existsSync(path.join(ROOT, 'loi-dan')) ? path.join(ROOT, 'loi-dan') : null);
const preview = args.includes('--preview');
fs.mkdirSync(outDir, { recursive: true });

const pageFile = flag('--page', 'index.html');
const page_url = id => pathToFileURL(path.join(ROOT, pageFile)).href + `?render=${id}&format=${format}` + (args.includes('--nguoi-dan') ? '&pip=1' : '');

function probe(f) { return Number(execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim()); }

/* Quy tắc: mục Trận đánh lừng danh chỉ dùng giọng Manus (loi-dan/NGUON.json) */
const MANI_F = path.join(ROOT, 'loi-dan', 'NGUON.json');
const isDefaultVoice = voiceDir && path.resolve(voiceDir) === path.join(ROOT, 'loi-dan');
function manusOK(id, n) {
  if (!isDefaultVoice) return true;
  const m = fs.existsSync(MANI_F) ? JSON.parse(fs.readFileSync(MANI_F, 'utf8')).tran[id] : null;
  if (!m || m.nguon !== 'manus') return false;
  for (let i = 1; i <= n; i++) if (!fs.existsSync(path.join(voiceDir, id, String(i).padStart(2, '0') + '.mp3'))) return false;
  return true;
}

async function renderOne(browser, id) {
  const page = await browser.newPage({ viewport: format === 'doc' ? { width: 1080, height: 1920 } : { width: 1920, height: 1080 }, deviceScaleFactor: 1 });
  // lời dẫn thu sẵn ⇒ tính lại thời lượng từng cảnh
  let durs = [], voices = [];
  if (voiceDir) {
    await page.goto(page_url(id)); await page.waitForFunction(() => window.STUDIO);
    const n = await page.evaluate(() => window.STUDIO.starts.length);
    if (!manusOK(id, n) && !args.includes('--cho-phep-thieu-giong')) {
      console.log(`⏸ ${id}: chưa đủ giọng Manus ⇒ KHÔNG xuất (quy tắc chỉ dùng giọng Manus). Tự đọc bằng giọng Manus đã lưu: "node tools/giong-manus.mjs tao ${id}" (hoặc gửi Manus: "node tools/nap-giong-manus.mjs --yeu-cau").`);
      await page.close(); return;
    }
    for (let i = 1; i <= n; i++) {
      const f = ['mp3', 'm4a', 'wav', 'ogg'].map(e => path.join(voiceDir, id, String(i).padStart(2, '0') + '.' + e)).find(fs.existsSync);
      voices.push(f || null); durs.push(f ? probe(f) + 1.0 : 0);
    }
  }
  const url = page_url(id) + (durs.some(Boolean) ? '&durs=' + durs.map(d => d ? d.toFixed(2) : '').join(',') : '');
  await page.goto(url);
  await page.waitForFunction(() => window.STUDIO);
  const info = await page.evaluate(() => ({ total: window.STUDIO.total, starts: window.STUDIO.starts }));
  const base = path.join(outDir, `${id}${pageFile !== 'index.html' ? '-' + path.basename(pageFile, '.html') : ''}${format === 'doc' ? '-doc' : ''}`);

  if (preview) {
    const ends = [...info.starts.slice(1), info.total];
    for (let i = 0; i < info.starts.length; i++) {
      for (const k of [.45, .85]) {
        const tt = info.starts[i] + (ends[i] - info.starts[i]) * k;
        await page.evaluate(x => window.STUDIO.seek(x), tt);
        await page.screenshot({ path: `${base}-c${String(i + 1).padStart(2, '0')}-${Math.round(k * 100)}.png` });
      }
    }
    console.log('Ảnh xem trước:', base + '-c*.png');
    await page.close(); return;
  }

  // nhạc nền
  const wav = base + '.music.wav';
  fs.writeFileSync(wav, Buffer.from(await page.evaluate(() => window.STUDIO.audio()), 'base64'));

  const frames = Math.ceil(info.total * fps);
  const silent = base + '.video.mp4';
  const ff = spawn('ffmpeg', ['-y', '-v', 'error', '-f', 'image2pipe', '-c:v', 'mjpeg', '-framerate', String(fps), '-i', '-',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-preset', 'medium', '-crf', '23', '-movflags', '+faststart', silent], { stdio: ['pipe', 'inherit', 'inherit'] });
  const t0 = Date.now();
  for (let f = 0; f < frames; f++) {
    await page.evaluate(x => window.STUDIO.seek(x), f / fps);
    const buf = await page.screenshot({ type: 'jpeg', quality: 92 });
    if (!ff.stdin.write(buf)) await new Promise(r => ff.stdin.once('drain', r));
    if (f % (fps * 5) === 0) process.stdout.write(`\r${id}: ${Math.round(f / frames * 100)}%  (${((Date.now() - t0) / 1000).toFixed(0)}s)   `);
  }
  ff.stdin.end(); await new Promise(r => ff.on('close', r));
  await page.close();

  // trộn âm thanh: nhạc nền (+ lời dẫn nếu có, nhạc tự hạ thấp khi có giọng)
  const out = base + '.mp4';
  const inputs = ['-i', silent, '-i', wav];
  let filter = '[1:a]volume=0.9[m]', mixOut = '[m]';
  const vs = voices.map((v, i) => v && { v, at: info.starts[i] + 0.4 }).filter(Boolean);
  if (vs.length) {
    vs.forEach(x => inputs.push('-i', x.v));
    // nhạc tự hạ khi có giọng (sidechain), nâng lại ở khoảng nghỉ
    filter = '[1:a]volume=0.75,aformat=channel_layouts=stereo[m];' + vs.map((x, i) => `[${i + 2}:a]adelay=${Math.round(x.at * 1000)}|${Math.round(x.at * 1000)},aformat=channel_layouts=stereo[v${i}]`).join(';') +
      ';' + vs.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${vs.length}:normalize=0[vv];[vv]asplit=2[vk][vs];[m][vk]sidechaincompress=threshold=0.02:ratio=8:attack=40:release=600[md];[md][vs]amix=inputs=2:normalize=0[a]`;
    mixOut = '[a]';
  }
  // chuẩn âm lượng nền tảng video: -14 LUFS, đỉnh -1.5 dBTP (YouTube/Facebook/TikTok không tự hạ giọng)
  filter += `;${mixOut}loudnorm=I=-14:TP=-1.5:LRA=11,aresample=48000[an]`; mixOut = '[an]';
  execFileSync('ffmpeg', ['-y', '-v', 'error', ...inputs, '-filter_complex', filter, '-map', '0:v', '-map', mixOut, '-c:v', 'copy', '-c:a', 'aac', '-b:a', '160k', '-shortest', out]);
  fs.unlinkSync(silent); fs.unlinkSync(wav);
  console.log(`\r✔ ${out}  (${info.total.toFixed(1)} giây)`);
}

const browser = await chromium.launch();
const ids = which === 'all'
  ? (await (async () => { const p = await browser.newPage(); await p.goto(page_url('x').replace('render=x', 'list=1')); const r = await p.evaluate(() => BATTLES.map(b => b.id)); await p.close(); return r; })())
  : which.split(',');
for (const id of ids) await renderOne(browser, id);
await browser.close();
