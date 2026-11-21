#!/usr/bin/env node
/* Tạo giọng NHÁP (Google tiếng Việt) để duyệt nhịp – KHÔNG dùng cho mục Trận đánh lừng danh (mục này chỉ dùng giọng Manus).
   Dùng với render-video.mjs --voice giong-nhap
   Cách dùng:  node tools/tts-google.mjs <id-trận | all> [--out loi-dan] [--speed 1.15]
   Kết quả:    loi-dan/<id>/01.mp3, 02.mp3 ...
   Ghi chú: dùng dịch vụ đọc của Google Dịch (không chính thức, mỗi đoạn ≤ 200 ký tự),
   phù hợp làm bản nháp / dùng cá nhân. Muốn giọng hay hơn: thay file mp3 bằng giọng thu thật hoặc AI khác.
   Cần: curl, ffmpeg. */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const args = process.argv.slice(2);
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const which = args.find(a => !a.startsWith('--') && args[args.indexOf(a) - 1] !== '--out' && args[args.indexOf(a) - 1] !== '--speed') || 'all';
const out = path.resolve(flag('--out', path.join(ROOT, 'giong-nhap')));
if (out === path.join(ROOT, 'loi-dan')) { console.error('✖ Mục Trận đánh lừng danh chỉ dùng giọng Manus – không ghi giọng Google vào loi-dan/. Dùng --out thư-mục-khác (bản nháp).'); process.exit(1); }
const speed = Number(flag('--speed', 1.15));

const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
const BATTLES = ctx.window.BATTLES;

/* cắt câu thành đoạn ≤ 180 ký tự, ưu tiên ngắt ở dấu câu */
function pieces(text) {
  const out = []; let cur = '';
  for (const sent of text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:])\s+/)) {
    const parts = sent.length <= 180 ? [sent] : sent.split(/(?<=,)\s+/);
    for (const p of parts) {
      if ((cur + ' ' + p).trim().length > 180) { if (cur) out.push(cur); cur = p; }
      else cur = (cur + ' ' + p).trim();
    }
  }
  if (cur) out.push(cur);
  return out;
}

const tmp = fs.mkdtempSync(path.join(out + '-tmp-'));
for (const b of BATTLES.filter(b => which === 'all' || which.split(',').includes(b.id))) {
  const dir = path.join(out, b.id); fs.mkdirSync(dir, { recursive: true });
  b.scenes.forEach((sc, i) => {
    const files = pieces(sc.say || '').map((p, j) => {
      const f = path.join(tmp, `${b.id}-${i}-${j}.mp3`);
      const url = 'https://translate.googleapis.com/translate_tts?ie=UTF-8&client=gtx&tl=vi&q=' + encodeURIComponent(p);
      for (let k = 0; k < 4; k++) {
        try { execFileSync('curl', ['-sSf', '-m', '30', '-A', 'Mozilla/5.0', '-o', f, url]); if (fs.statSync(f).size > 500) break; } catch (e) { if (k === 3) throw e; }
        execFileSync('sleep', [String(1 + k)]);
      }
      return f;
    });
    if (!files.length) return;
    const list = path.join(tmp, 'list.txt');
    fs.writeFileSync(list, files.map(f => `file '${f}'`).join('\n'));
    const dst = path.join(dir, String(i + 1).padStart(2, '0') + '.mp3');
    // nối các đoạn, tăng tốc nhẹ, cắt khoảng lặng đầu, chuẩn hóa âm lượng
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 'concat', '-safe', '0', '-i', list,
      '-af', `atempo=${speed},silenceremove=start_periods=1:start_threshold=-45dB,loudnorm=I=-16:TP=-1.5:LRA=11`,
      '-ar', '44100', '-ac', '2', '-b:a', '160k', dst]);
    console.log('✔', dst);
  });
}
fs.rmSync(tmp, { recursive: true, force: true });
