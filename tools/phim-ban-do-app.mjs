#!/usr/bin/env node
/* =========================================================================
   ĐƯA PHIM BẢN ĐỒ CHIẾN DỊCH LÊN APP – Xưởng film Lịch sử Việt Nam
   node tools/phim-ban-do-app.mjs <id-trận> [--xoa]
   Từ bản render gốc hyperframes/<id>.mp4 (1080p, đã duyệt / đã qua kiem-muot):
     • phim-ban-do/<id>.mp4      720p H.264 ~16 MB (app trên GitHub Pages phát trực tiếp; không đưa bản 1080p vào kho)
     • phim-ban-do/<id>.jpg      ảnh bìa: khung giữa cảnh bản đồ 3D
     • phim-ban-do/danh-sach.json  thêm/cập nhật mục của trận (app đọc để hiện "Phim bản đồ chiến dịch" ở cột Xưởng Lịch sử)
   --xoa : gỡ trận khỏi app (xóa 2 file + mục trong danh sách).
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), OUT = path.join(ROOT, 'phim-ban-do'), DS = path.join(OUT, 'danh-sach.json');
const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--'));
if (!id) { console.log('Cách dùng: node tools/phim-ban-do-app.mjs <id-trận> [--xoa]'); process.exit(2); }
fs.mkdirSync(OUT, { recursive: true });
const ds = fs.existsSync(DS) ? JSON.parse(fs.readFileSync(DS, 'utf8')) : { ghi_chu: 'Phim bản đồ chiến dịch (HyperFrames) đã đưa lên app – tạo bằng tools/phim-ban-do-app.mjs', phim: [] };
const luu = () => { ds.phim.sort((a, b) => (a.nam || 0) - (b.nam || 0)); fs.writeFileSync(DS, JSON.stringify(ds, null, 1) + '\n'); };
if (args.includes('--xoa')) { ds.phim = ds.phim.filter(p => p.id !== id); ['mp4', 'jpg'].forEach(e => fs.rmSync(path.join(OUT, `${id}.${e}`), { force: true })); luu(); console.log('✔ Đã gỡ ' + id); process.exit(0); }

const SRC = path.join(ROOT, 'hyperframes', id + '.mp4');
if (!fs.existsSync(SRC)) { console.log('Chưa có ' + path.relative(ROOT, SRC) + ' – render trước (skill ban-do-chien-dich).'); process.exit(2); }
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
const B = ctx.window.BATTLES.find(b => b.id === id); if (!B) { console.log('Không có trận ' + id + ' trong battles.js'); process.exit(2); }
const dur = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', SRC], { encoding: 'utf8' }).stdout.trim();
// mốc giữa cảnh bản đồ 3D (đọc từ dự án HyperFrames nếu còn)
let tBia = dur * .45; { const f = path.join(ROOT, 'hyperframes', id, 'index.html'); if (fs.existsSync(f)) { const m = fs.readFileSync(f, 'utf8').match(/id="ban-do"[^>]*data-start="([\d.]+)" data-duration="([\d.]+)"/); if (m) tBia = +m[1] + +m[2] * .62; } }

const mp4 = path.join(OUT, id + '.mp4'), jpg = path.join(OUT, id + '.jpg');
const kbps = Math.max(700, Math.min(1500, Math.floor(15.5 * 8192 / dur) - 112));
const r = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', SRC, '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-preset', 'slow', '-b:v', kbps + 'k', '-maxrate', Math.round(kbps * 1.3) + 'k', '-bufsize', kbps * 2 + 'k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '112k', '-movflags', '+faststart', mp4], { stdio: 'inherit' });
if (r.status !== 0) process.exit(1);
spawnSync('ffmpeg', ['-v', 'error', '-y', '-ss', tBia.toFixed(2), '-i', SRC, '-frames:v', '1', '-vf', 'scale=960:-2', '-q:v', '4', jpg], { stdio: 'inherit' });

const muc = { id, ten: B.name, nam: +(String(B.year).match(/\d+/) || [0])[0], video: `phim-ban-do/${id}.mp4`, anh_bia: `phim-ban-do/${id}.jpg`,
  thoi_luong: `${Math.floor(dur / 60)}:${String(Math.round(dur % 60)).padStart(2, '0')}`, ngay: new Date().toISOString().slice(0, 10),
  mo_ta: (B.scenes[0] && B.scenes[0].say || '').replace(/\s+/g, ' ').trim(), nguon: 'Giọng: Manus · Bản đồ: © OpenStreetMap contributors (ODbL), địa hình Terrain Tiles (AWS) · Ảnh tư liệu: xem anh/' + id + '/nguon.json' };
ds.phim = ds.phim.filter(p => p.id !== id).concat(muc); luu();
console.log(`✔ ${B.name}: phim-ban-do/${id}.mp4 (${(fs.statSync(mp4).size / 1048576).toFixed(1)} MB) + ảnh bìa · danh-sach.json có ${ds.phim.length} phim`);
