#!/usr/bin/env node
/* NẠP GIỌNG MANUS cho mục "Trận đánh lừng danh".
   Quy tắc: mục này CHỈ dùng giọng do Manus tạo (xem loi-dan/NGUON.json).

   Nạp gói Manus:   node tools/nap-giong-manus.mjs <goi.zip | thư-mục-chứa-mp3>
   Tạo yêu cầu gửi Manus cho các trận còn thiếu giọng:
                    node tools/nap-giong-manus.mjs --yeu-cau
   File trong gói phải đặt tên <id-trận>_<số cảnh 2 chữ số>.mp3, VD bach-dang-1288_05.mp3
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
  let t = `YÊU CẦU GỬI MANUS – GIỌNG DẪN CHUYỆN CÒN THIẾU (${n} đoạn)\n=========================================\n\nHãy tạo giọng đọc tiếng Việt cho các đoạn lời dẫn bên dưới, DÙNG ĐÚNG GIỌNG như các lần trước:\n\n- Giọng: nam trung niên, giọng trầm, ấm, truyền cảm, chuẩn giọng Bắc.\n- Phong cách: kể chuyện lịch sử chậm rãi, như người dẫn phim tài liệu; ngắt nghỉ rõ ở dấu phẩy, dấu chấm; nhấn nhẹ vào tên người, địa danh, năm tháng.\n- Tốc độ: chậm hơn mức bình thường một chút (khoảng 0,9).\n- Không bắt chước giọng của bất kỳ người thật hay kênh nào; dùng giọng AI có quyền sử dụng thương mại.\n- Mỗi đoạn xuất thành MỘT file mp3 riêng, đặt tên ĐÚNG như tên trong ngoặc vuông.\n- Đọc nguyên văn, không thêm, không bớt chữ. Không chèn nhạc nền.\n- Gói tất cả ${n} file vào một file .zip để tải về.\n`;
  for (const { b, miss } of list) { t += `\n──────── ${b.name.toUpperCase()} (${b.who}) ────────\n\n`; miss.forEach(k => { t += `[${b.id}_${pad(k)}.mp3]\n${b.scenes[k - 1].say}\n\n`; }); }
  fs.writeFileSync(path.join(LD, 'CAN-GUI-MANUS.txt'), t);
  console.log(`📝 loi-dan/CAN-GUI-MANUS.txt: ${n} đoạn của ${list.length} trận đang chờ giọng Manus:`); list.forEach(x => console.log(`   • ${x.b.name}: cảnh ${x.miss.join(', ')}`));
  console.log('   ⇢ Nhanh hơn: tự đọc bằng giọng Manus đã lưu: node tools/giong-manus.mjs tao');
}

const arg = process.argv.slice(2).find(a => !a.startsWith('--'));
if (process.argv.includes('--yeu-cau') || !arg) { yeuCau(); process.exit(0); }

// ---- đọc gói: zip hoặc thư mục
const files = {};
if (fs.statSync(arg).isDirectory()) { for (const f of fs.readdirSync(arg)) files[f] = fs.readFileSync(path.join(arg, f)); }
else {
  const require = createRequire(import.meta.url), JSZip = require(path.join(ROOT, 'lib', 'jszip.min.js'));
  const zip = await JSZip.loadAsync(fs.readFileSync(arg));
  for (const [name, e] of Object.entries(zip.files)) if (!e.dir) files[path.basename(name)] = await e.async('nodebuffer');
}
const tmp = fs.mkdtempSync(path.join(fs.realpathSync(process.env.TMPDIR || '/tmp'), 'manus-'));
let ok = 0, bo = 0; const changed = new Set();
for (const [name, buf] of Object.entries(files)) {
  const m = name.match(/^([a-z0-9-]+)_(\d{2})\.mp3$/i);
  if (!m) { if (/\.mp3$/i.test(name)) { console.log(`⚠ Bỏ qua ${name}: tên không đúng dạng <id-trận>_<số>.mp3`); bo++; } continue; }
  const b = BATTLES.find(x => x.id === m[1].toLowerCase()), k = +m[2];
  if (!b || !b.scenes[k - 1]) { console.log(`⚠ Bỏ qua ${name}: không có trận/cảnh này`); bo++; continue; }
  const t = path.join(tmp, name); fs.writeFileSync(t, buf);
  let d; try { d = dur(t); } catch (e) { console.log(`⚠ Bỏ qua ${name}: không đọc được âm thanh`); bo++; continue; }
  const db = meanDb(t), wps = words(b.scenes[k - 1].say) / d;
  if (db < -45) { console.log(`⚠ Bỏ qua ${name}: file gần như câm (${db} dB)`); bo++; continue; }
  if (wps < 1.4 || wps > 5) console.log(`⚠ ${name}: tốc độ ${wps.toFixed(1)} chữ/giây – có thể không khớp lời dẫn, nên nghe lại`);
  fs.mkdirSync(path.join(LD, b.id), { recursive: true });
  fs.copyFileSync(t, path.join(LD, b.id, pad(k) + '.mp3')); ok++; changed.add(b.id);
}
for (const id of changed) {
  const n = fs.readdirSync(path.join(LD, id)).filter(f => f.endsWith('.mp3')).length;
  mani.tran[id] = { nguon: 'manus', so_doan: n, ngay_nap: new Date().toISOString().slice(0, 10), ghi_chu: 'Giọng nam trầm do Manus tạo' };
}
fs.writeFileSync(MANI, JSON.stringify(mani, null, 2));
fs.rmSync(tmp, { recursive: true, force: true });
console.log(`✔ Đã nạp ${ok} đoạn giọng Manus${bo ? `, bỏ qua ${bo} file` : ''}.`);
yeuCau();
