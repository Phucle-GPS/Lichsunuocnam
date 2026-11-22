#!/usr/bin/env node
/* GÓI LÀM VIỆC GOOGLE FLOW cho một trận (phim người que A5):
   node tools/goi-flow.mjs <id-trận> [--phim bản-người-que.mp4] [--out thư-mục] [--nhac hungca-1288]
   Tạo <out>/flow-<id>/ + file .zip gồm:
     01-prompt/        prompt từng clip (clip-NN.txt) + bộ đầy đủ Phase A/B
     02-nhan-vat/      ảnh tham chiếu nhân vật (Ingredients) – tướng, lính Đại Việt, lính địch, kỵ binh
     03-khung-dau/     khung hình mở đầu từng clip (Frames to Video), lấy từ phim người que
     04-am-thanh/      giọng Manus từng cảnh + bản lời dẫn liền mạch + nhạc nền
     05-phim-mau/      phim người que làm bản dựng mẫu (canh thời lượng, bố cục)
     HUONG-DAN.txt */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2), flag = (n, d) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : d; };
const id = args.find((a, i) => !a.startsWith('--') && !['--phim', '--out', '--nhac'].includes(args[i - 1])) || 'bach-dang-1288';
const OUT = path.resolve(flag('--out', path.join(ROOT, 'video'))), DIR = path.join(OUT, 'flow-' + id), nhac = flag('--nhac', 'hungca-1288');
const ff = (...a) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...a]);
const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString();
fs.rmSync(DIR, { recursive: true, force: true }); for (const d of ['01-prompt', '02-nhan-vat', '03-khung-dau', '04-am-thanh', '05-phim-mau']) fs.mkdirSync(path.join(DIR, d), { recursive: true });

// --- dữ liệu trận + prompt A5
const ctx = { document: {}, indexedDB: {}, console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['battles.js', 'lib/xuong.js', 'lib/aiprompt.js', 'lib/a5-anchor.js', 'lib/stickprompt.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx);
const b = ctx.BATTLES.find(x => x.id === id); if (!b) throw new Error('Không có trận ' + id);
const vfiles = b.scenes.map((_, i) => path.join(ROOT, 'loi-dan', id, String(i + 1).padStart(2, '0') + '.mp3'));
if (!vfiles.every(fs.existsSync)) throw new Error('Trận chưa đủ giọng Manus.');
const durs = vfiles.map(f => probe(f) + 1);
const pk = ctx.StickPrompt.pack(b, durs);
fs.writeFileSync(path.join(DIR, '01-prompt', '00-BO-DAY-DU-' + id + '.txt'), pk.text);
const parts = pk.text.split(/\n▶ CLIP /).slice(1).map(x => { const n = +x.match(/^\d+/)[0]; return { n, text: x.replace(/^\d+[^\n]*\n/, '').split(/\n━━━━|\n═══════════/)[0].trim() }; });
parts.forEach(c => fs.writeFileSync(path.join(DIR, '01-prompt', `clip-${String(c.n).padStart(2, '0')}.txt`), c.text + '\n'));
// thời điểm bắt đầu từng clip (theo khối giọng của từng cảnh)
const clipT = []; let acc = 0; durs.forEach(d => { const n = Math.max(1, Math.ceil(d / 8)); for (let k = 0; k < n; k++) clipT.push(acc + k * 8); acc += d; });

// --- phim người que (bản dựng mẫu)
let phim = flag('--phim', path.join(ROOT, 'video', id + '-nguoi-que.mp4'));
if (!fs.existsSync(phim)) { console.log('🎬 Dựng phim người que mẫu…'); execFileSync(process.execPath, [path.join(ROOT, 'tools', 'render-video.mjs'), id, '--nguoi-que', '--nhac', nhac, '--out', path.join(DIR, '05-phim-mau')], { stdio: 'inherit' }); phim = path.join(DIR, '05-phim-mau', id + '-nguoi-que.mp4'); }
else fs.copyFileSync(phim, path.join(DIR, '05-phim-mau', path.basename(phim)));
clipT.forEach((t, i) => ff('-ss', (t + .8).toFixed(2), '-i', phim, '-frames:v', '1', path.join(DIR, '03-khung-dau', `clip-${String(i + 1).padStart(2, '0')}.png`)));
console.log(`✔ ${parts.length} prompt clip, ${clipT.length} khung mở đầu`);

// --- ảnh tham chiếu nhân vật + nhạc nền (vẽ bằng chính engine của app)
const require = createRequire(import.meta.url), { chromium } = require('playwright');
const br = await chromium.launch(), page = await br.newPage({ viewport: { width: 1920, height: 1080 } });
await page.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + `?render=${id}`); await page.waitForFunction(() => window.STUDIO);
const sheets = [
  ['01-chi-huy-' + id, `${b.who} – chỉ huy`, { hat: 'khan', weapon: 'co' }, 'ta'],
  ['02-linh-dai-viet', 'Lính Đại Việt', { hat: 'non', weapon: 'giao' }, 'ta'],
  ['03-linh-' + b.vs.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/gi, 'd').replace(/\s+/g, '-').toLowerCase(), `Lính ${b.vs}`, { hat: 'mu', weapon: 'giao', side: 'giac' }, 'giac'],
  ['04-ky-binh', 'Kỵ binh Đại Việt', { hat: 'non', weapon: 'giao', horse: 1 }, 'ta']
];
for (const [file, title, o] of sheets) {
  await page.evaluate(([o, title]) => {
    document.body.innerHTML = ''; document.body.style.cssText = 'margin:0;background:#efe6d2';
    const S = Studio.svgEl, svg = S('svg', { viewBox: '0 0 1920 1080', width: 1920, height: 1080 }); document.body.appendChild(svg);
    S('rect', { width: 1920, height: 1080, fill: '#efe6d2' }, svg);
    const tx = S('text', { x: 960, y: 90, 'text-anchor': 'middle', 'font-family': 'Oswald, sans-serif', 'font-weight': 700, 'font-size': 56, fill: '#3b2a1a' }, svg); tx.textContent = title.toUpperCase();
    const lab = o.horse ? ['Phi nước đại', 'Phi nước đại (nhịp sau)', 'Giương giáo xung trận'] : ['Nhìn phải', 'Nhìn trái', 'Hành động'];
    [[420, 1], [960, -1], [1500, 1]].forEach(([x, dir], i) => {
      S('line', { x1: x - 220, y1: 900, x2: x + 220, y2: 900, stroke: '#b9a684', 'stroke-width': 4 }, svg);
      const l = S('text', { x, y: 980, 'text-anchor': 'middle', 'font-family': 'sans-serif', 'font-size': 30, fill: '#6b5a42' }, svg); l.textContent = lab[i];
      if (o.horse) { const hz = Studio.drawHorse(svg, '#1d1a16'); hz(x - 40, 720, i * 1.3 + .4); const f = Studio.stickFig(svg, '#1d1a16', '#c8352b', o); f(x - 50, 694, dir > 0 ? 1 : 1, { lean: .2, la: [.9, 1.5], ra: [1.4, 1.62], ll: [.75, .25], rl: [.85, .2], wa: i === 2 ? 2.6 : 1.62 }, .85, 0); return; }
      const f = Studio.stickFig(svg, '#1d1a16', '#c8352b', o);
      const act = o.weapon === 'co' ? { lean: -.05, la: [-.3, -.1], ra: [2.4, 2.9], ll: [-.15, -.1], rl: [.15, .1], wa: 3, mouth: 1 } : { brow: 3, lean: .12, la: [.4, 1.2], ra: [1.3, 1.62], ll: [.35, .2], rl: [-.3, -.35], wa: 1.62 };
      f(x, 750, dir, i === 2 ? act : { lean: 0, la: [-.15, -.05], ra: o.weapon === 'co' ? [.5, 2.75] : [.25, .5], ll: [-.12, -.12], rl: [.12, .12], wa: 3.05 }, 1.25, .5);
    });
  }, [o, title]);
  await page.screenshot({ path: path.join(DIR, '02-nhan-vat', file + '.png') });
}
const total = durs.reduce((a, c) => a + c, 0);
const [st, seed] = nhac.split('-');
const b64 = await page.evaluate(async ([st, seed, sec]) => { const sg = Nhac.newSong(st, +seed || 7); const blob = await Nhac.renderWav(sg, sec); const u8 = new Uint8Array(await blob.arrayBuffer()); let s = ''; for (let i = 0; i < u8.length; i += 32768) s += String.fromCharCode.apply(null, u8.subarray(i, i + 32768)); return btoa(s); }, [st, seed, Math.ceil(total)]);
await br.close();
const A = path.join(DIR, '04-am-thanh'), wav = path.join(A, 'nhac.wav'); fs.writeFileSync(wav, Buffer.from(b64, 'base64'));
ff('-i', wav, '-af', 'loudnorm=I=-20:TP=-2', '-b:a', '192k', path.join(A, `nhac-nen-${st}.mp3`)); fs.unlinkSync(wav);
console.log('✔ 4 ảnh nhân vật, nhạc nền');

// --- giọng Manus: từng cảnh + bản liền mạch đúng mốc thời gian phim
let at = 0; const inputs = [], fil = [];
vfiles.forEach((f, i) => { fs.copyFileSync(f, path.join(A, `giong-canh-${String(i + 1).padStart(2, '0')}.mp3`)); inputs.push('-i', f); fil.push(`[${i}:a]adelay=${Math.round((at + .4) * 1000)}|${Math.round((at + .4) * 1000)},aformat=channel_layouts=stereo[v${i}]`); at += durs[i]; });
ff(...inputs, '-filter_complex', fil.join(';') + ';' + vfiles.map((_, i) => `[v${i}]`).join('') + `amix=inputs=${vfiles.length}:normalize=0,apad,atrim=0:${total.toFixed(2)},loudnorm=I=-16:TP=-1.5[a]`, '-map', '[a]', '-b:a', '192k', path.join(A, 'loi-dan-manus-lien-mach.mp3'));

// --- hướng dẫn + bảng clip
const rows = clipT.map((t, i) => `clip-${String(i + 1).padStart(2, '0')}  ·  ${t.toFixed(1)}s → ${(t + 8).toFixed(1)}s`).join('\n');
fs.writeFileSync(path.join(DIR, 'HUONG-DAN.txt'), `GÓI LÀM VIỆC GOOGLE FLOW – ${b.name.toUpperCase()} (phim người que, phong cách A5 Historical Cartoon)
Theo quy trình skill directing-stickman-videos (kaomei/stickman-video-director, MIT). Giọng: CHỈ giọng Manus.

BƯỚC 1 – Tạo dự án trong Google Flow (labs.google/flow), tỉ lệ 16:9.
BƯỚC 2 – Nạp nhân vật: mục Ingredients (Thành phần) → tải 4 ảnh trong 02-nhan-vat/. Đặt tên đúng như tên file.
         (Skill khuyên: giữ cùng bộ ảnh tham chiếu cho MỌI clip để nhân vật không đổi mặt.)
BƯỚC 3 – Tạo từng clip theo thứ tự clip-01 → clip-${String(parts.length).padStart(2, '0')}:
   • Cách A (giống bố cục phim mẫu nhất): chế độ "Frames to Video" → ảnh đầu = 03-khung-dau/clip-NN.png → dán 01-prompt/clip-NN.txt
   • Cách B (đẹp, tự do hơn): chế độ "Ingredients to Video" → chọn nhân vật xuất hiện trong clip → dán prompt
   • Mỗi clip 8 giây. Clip hỏng (đầu tách cổ, thừa tay, có chữ) thì tạo lại riêng clip đó.
BƯỚC 4 – Ghép trong Scenebuilder của Flow hoặc phần mềm dựng: đặt 04-am-thanh/loi-dan-manus-lien-mach.mp3 làm trục,
         xếp clip theo mốc bên dưới (khớp phim mẫu 05-phim-mau/), thêm nhạc nền nhỏ dưới giọng (-20 LUFS), phụ đề tiếng Việt.
         KHÔNG dùng tiếng nói do Flow tạo – lời dẫn chỉ là giọng Manus.
BƯỚC 5 – Gửi lại các clip (hoặc phim đã ghép) cho Claude: sẽ ghép giọng, nhạc, phụ đề, chuẩn -14 LUFS và xuất bản 16:9 + 9:16.

MỐC THỜI GIAN CÁC CLIP (tổng ≈ ${total.toFixed(0)} giây):
${rows}
`);
execFileSync('zip', ['-qr', path.join(OUT, `flow-${id}.zip`), path.basename(DIR)], { cwd: OUT });
console.log(`✔ ${DIR}\n✔ ${path.join(OUT, `flow-${id}.zip`)}`);
