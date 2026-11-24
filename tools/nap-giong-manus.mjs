#!/usr/bin/env node
/* NẠP GIỌNG MANUS cho mục "Trận đánh lừng danh".
   Quy tắc: mục này CHỈ dùng giọng do Manus tạo (xem loi-dan/NGUON.json).

   Nạp gói Manus:   node tools/nap-giong-manus.mjs <goi.zip | thư-mục-chứa-mp3>
   Tạo yêu cầu gửi Manus cho các trận còn thiếu giọng:
                    node tools/nap-giong-manus.mjs --yeu-cau
   Nhận mp3, mp4, m4a, wav, ogg, webm, mov (video thì lấy phần tiếng). Gửi theo 1 trong 2 cách:
     • mỗi cảnh một file: <id-trận>_<số cảnh 2 chữ số>.<đuôi>, VD bach-dang-1288_05.mp4
     • mỗi trận một file đọc liền các cảnh theo thứ tự, nghỉ ~2 giây giữa các cảnh: <id-trận>.<đuôi>, VD luy-lau-40.mp4
       → tự cắt thành từng cảnh theo khoảng lặng và độ dài lời dẫn.
   Có thể đưa thẳng 1 file, nhiều file trong thư mục, hoặc file .zip.
   --thu : chỉ cắt/chuyển thử vào giong-nhap/thu-nap/, KHÔNG ghi vào loi-dan/.
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync, spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LD = path.join(ROOT, 'loi-dan'), MANI = path.join(LD, 'NGUON.json');
const ctx = { window: {} }; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
const BATTLES = ctx.window.BATTLES;
const mani = fs.existsSync(MANI) ? JSON.parse(fs.readFileSync(MANI, 'utf8')) : { quy_tac: 'Mục Trận đánh lừng danh chỉ dùng giọng do Manus tạo. Không dùng giọng TTS khác.', tran: {} };
const pad = n => String(n).padStart(2, '0');
const words = t => (t || '').trim().split(/\s+/).filter(Boolean).length;
const dur = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const meanDb = f => { const r = spawnSync('ffmpeg', ['-i', f, '-af', 'volumedetect', '-f', 'null', '-'], { encoding: 'utf8' }).stderr.match(/mean_volume: ([-\d.]+)/); return r ? +r[1] : -99; };

function thieu() {
  return BATTLES.map(b => ({ b, miss: b.scenes.map((_, i) => i + 1).filter(k => !(mani.tran[b.id] && mani.tran[b.id].nguon === 'manus' && fs.existsSync(path.join(LD, b.id, pad(k) + '.mp3')))) })).filter(x => x.miss.length);
}
function yeuCau() {
  const list = thieu();
  if (!list.length) { console.log('✔ Tất cả các trận đã có đủ giọng Manus.'); const f = path.join(LD, 'CAN-GUI-MANUS.txt'); if (fs.existsSync(f)) fs.unlinkSync(f); return; }
  const n = list.reduce((a, x) => a + x.miss.length, 0);
  let t = `YÊU CẦU GỬI MANUS – GIỌNG DẪN CHUYỆN CÒN THIẾU (${n} đoạn)\n=========================================\n\nHãy tạo giọng đọc tiếng Việt cho các đoạn lời dẫn bên dưới, DÙNG ĐÚNG GIỌNG như các lần trước:\n\n- Giọng: nam trung niên, giọng trầm, ấm, truyền cảm, chuẩn giọng Bắc.\n- Phong cách: kể chuyện lịch sử chậm rãi, như người dẫn phim tài liệu; ngắt nghỉ rõ ở dấu phẩy, dấu chấm; nhấn nhẹ vào tên người, địa danh, năm tháng.\n- Tốc độ: chậm hơn mức bình thường một chút (khoảng 0,9).\n- Không bắt chước giọng của bất kỳ người thật hay kênh nào; dùng giọng AI có quyền sử dụng thương mại.\n- Mỗi đoạn xuất thành MỘT file riêng (mp3 hoặc mp4), đặt tên ĐÚNG như tên trong ngoặc vuông (đổi đuôi .mp4 nếu là video). Hoặc mỗi trận MỘT file đọc liền các cảnh theo thứ tự, nghỉ khoảng 2 giây giữa các cảnh, đặt tên <id-trận>.mp3 / .mp4.\n- Đọc nguyên văn, không thêm, không bớt chữ. Không chèn nhạc nền.\n- Gói tất cả ${n} file vào một file .zip để tải về.\n`;
  for (const { b, miss } of list) { t += `\n──────── ${b.name.toUpperCase()} (${b.who}) ────────\n\n`; miss.forEach(k => { t += `[${b.id}_${pad(k)}.mp3]\n${b.scenes[k - 1].say}\n\n`; }); }
  fs.writeFileSync(path.join(LD, 'CAN-GUI-MANUS.txt'), t);
  console.log(`📝 loi-dan/CAN-GUI-MANUS.txt: ${n} đoạn của ${list.length} trận đang chờ giọng Manus:`); list.forEach(x => console.log(`   • ${x.b.name}: cảnh ${x.miss.join(', ')}`));
  console.log('   ⇢ Nhanh hơn: tự đọc bằng giọng Manus đã lưu: node tools/giong-manus.mjs tao');
}

const arg = process.argv.slice(2).find(a => !a.startsWith('--'));
if (process.argv.includes('--yeu-cau') || !arg) { yeuCau(); process.exit(0); }

// ---- đọc gói: zip hoặc thư mục
const files = {}, MEDIA = /\.(mp3|mp4|m4a|wav|ogg|webm|mov|aac)$/i, DRY = process.argv.includes('--thu');
if (MEDIA.test(arg) && fs.statSync(arg).isFile()) files[path.basename(arg)] = fs.readFileSync(arg);
else if (fs.statSync(arg).isDirectory()) { for (const f of fs.readdirSync(arg)) files[f] = fs.readFileSync(path.join(arg, f)); }
else {
  const require = createRequire(import.meta.url), JSZip = require(path.join(ROOT, 'lib', 'jszip.min.js'));
  const zip = await JSZip.loadAsync(fs.readFileSync(arg));
  for (const [name, e] of Object.entries(zip.files)) if (!e.dir) files[path.basename(name)] = await e.async('nodebuffer');
}
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'manus-'));
let ok = 0, bo = 0; const changed = new Set();
const OUT = DRY ? path.join(ROOT, 'giong-nhap', 'thu-nap') : LD;
const toMp3 = (src, dst, from, to) => execFileSync('ffmpeg', ['-y', '-v', 'error', ...(from != null ? ['-ss', from.toFixed(2)] : []), ...(to != null ? ['-to', to.toFixed(2)] : []), '-i', src, '-vn', '-ac', '1', '-ar', '24000',
  '-af', 'silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.15,areverse,silenceremove=start_periods=1:start_threshold=-45dB:start_silence=0.25,areverse', '-b:a', '96k', dst]);
const silences = f => { const r = spawnSync('ffmpeg', ['-i', f, '-vn', '-af', 'silencedetect=noise=-38dB:d=0.7', '-f', 'null', '-'], { encoding: 'utf8' }).stderr; const st = [...r.matchAll(/silence_start: ([\d.]+)/g)].map(x => +x[1]), en = [...r.matchAll(/silence_end: ([\d.]+)/g)].map(x => +x[1]); return st.map((a, i) => [a, en[i] ?? a + .7]); };
const check = (f, text) => { const k = spawnSync('python3', [path.join(ROOT, 'tools', 'phan-tich-giong.py'), 'kiemtra', f, text], { encoding: 'utf8' }); return k.status === 0; };
function addScene(b, k, mp3, label) {
  let d; try { d = dur(mp3); } catch (e) { console.log(`⚠ Bỏ qua ${label}: không đọc được âm thanh`); bo++; return; }
  const db = meanDb(mp3), wps = words(b.scenes[k - 1].say) / d;
  if (db < -45) { console.log(`⚠ Bỏ qua ${label}: file gần như câm (${db} dB)`); bo++; return; }
  const warn = [];
  if (wps < 1.4 || wps > 5) warn.push(`tốc độ ${wps.toFixed(1)} chữ/giây – có thể không khớp lời dẫn`);
  if (!check(mp3, b.scenes[k - 1].say)) warn.push('lệch hồ sơ giọng Manus');
  console.log(`${warn.length ? '⚠' : '✔'} ${b.id} cảnh ${k}: ${d.toFixed(1)} giây${warn.length ? ' – ' + warn.join(', ') + ', nên nghe lại' : ''}`);
  fs.mkdirSync(path.join(OUT, b.id), { recursive: true }); fs.copyFileSync(mp3, path.join(OUT, b.id, pad(k) + '.mp3')); ok++; changed.add(b.id);
}
for (const [name, buf] of Object.entries(files)) {
  if (!MEDIA.test(name)) continue;
  const m = name.match(/^([a-z0-9-]+?)(?:_(\d{2}))?\.[a-z0-9]+$/i), b = m && BATTLES.find(x => x.id === m[1].toLowerCase());
  if (!b) { console.log(`⚠ Bỏ qua ${name}: tên phải là <id-trận>_<số>.<đuôi> hoặc <id-trận>.<đuôi>`); bo++; continue; }
  const src = path.join(tmp, name); fs.writeFileSync(src, buf);
  if (m[2]) { const k = +m[2]; if (!b.scenes[k - 1]) { console.log(`⚠ Bỏ qua ${name}: trận không có cảnh ${k}`); bo++; continue; } const o = path.join(tmp, `${b.id}_${m[2]}.out.mp3`); toMp3(src, o); addScene(b, k, o, name); continue; }
  // cả trận trong 1 file → cắt theo khoảng lặng gần nhất với vị trí dự kiến (tỉ lệ số chữ của từng cảnh)
  const total = dur(src), W = b.scenes.map(sc => words(sc.say)), WS = W.reduce((a, c) => a + c, 0), sil = silences(src), cuts = [];
  let acc = 0, from = 0;
  for (let k = 0; k < b.scenes.length - 1; k++) {
    acc += W[k]; const want = total * acc / WS;
    const cand = sil.map(([a, e]) => [(a + e) / 2, e - a]).filter(([mid]) => mid > from + 1.5 && mid < total - 1).map(([mid, len]) => [mid, Math.abs(mid - want) - 1.5 * len]).sort((x, y) => x[1] - y[1]);
    const cut = cand.length ? cand[0][0] : want; cuts.push(cut); from = cut;
  }
  console.log(`✂ ${name}: ${total.toFixed(1)} giây → ${b.scenes.length} cảnh (cắt tại ${cuts.map(c => c.toFixed(1)).join(', ')} giây)`);
  [0, ...cuts].forEach((a, k) => { const o = path.join(tmp, `${b.id}_${pad(k + 1)}.out.mp3`); toMp3(src, o, a, cuts[k]); addScene(b, k + 1, o, `${name} cảnh ${k + 1}`); });
}
if (DRY) { fs.rmSync(tmp, { recursive: true, force: true }); console.log(`🧪 Chạy thử: ${ok} đoạn ở giong-nhap/thu-nap/ (chưa ghi vào loi-dan/).`); process.exit(0); }
for (const id of changed) {
  const n = fs.readdirSync(path.join(LD, id)).filter(f => f.endsWith('.mp3')).length;
  mani.tran[id] = { nguon: 'manus', so_doan: n, ngay_nap: new Date().toISOString().slice(0, 10), ghi_chu: 'Giọng nam trầm do Manus tạo' };
}
fs.writeFileSync(MANI, JSON.stringify(mani, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✔ Đã nạp ${ok} đoạn giọng Manus${bo ? `, bỏ qua ${bo} file` : ''}.`);
yeuCau();
