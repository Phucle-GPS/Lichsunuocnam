#!/usr/bin/env node
/* =========================================================================
   KIỂM ĐỘ MƯỢT VIDEO ĐÃ RENDER – Xưởng film Lịch sử Việt Nam (phim bản đồ chiến dịch HyperFrames)
   node tools/kiem-muot.mjs <id-trận | file.mp4> [--ban-xem] [--json]
   Đo độ khác nhau giữa từng cặp khung liền nhau (ffmpeg tblend + signalstats) rồi tìm:
     • NHẢY  – một khung đổi mạnh gấp ≥3 lần các khung quanh nó (nhãn bật/tắt, vật nhảy chỗ, máy quay giật)
     • ĐỨNG  – khung đứng hình giữa lúc mọi thứ đang chuyển động (khựng, mất khung)
   Bỏ qua chỗ CỐ Ý: quanh điểm cắt cảnh (mực bắn phủ kín) và lúc đổi câu phụ đề – lấy từ
   hyperframes/<id>/index.html và compositions/phu-de.html.
   --ban-xem : xuất thêm hyperframes/<id>-xem.mp4 (720p, < 30 MB) để gửi xem trên điện thoại/web.
   Mã thoát 1 nếu còn chỗ giật ngoài vùng cố ý.
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import os from 'node:os';
import { spawnSync } from 'node:child_process';
const args = process.argv.slice(2), dau = args.find(a => !a.startsWith('--'));
if (!dau) { console.log('Cách dùng: node tools/kiem-muot.mjs <id-trận | file.mp4> [--ban-xem] [--json]'); process.exit(2); }
const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1')), '..');
const MP4 = dau.endsWith('.mp4') ? path.resolve(dau) : path.join(ROOT, 'hyperframes', dau + '.mp4');
const id = path.basename(MP4, '.mp4'), DU_AN = path.join(ROOT, 'hyperframes', id);
if (!fs.existsSync(MP4)) { console.log('Không có ' + MP4 + ' – render trước.'); process.exit(2); }

/* vùng cố ý: cắt cảnh (±0,8 s) và đổi phụ đề (±1 khung) */
const boQua = [];
const doc = f => fs.existsSync(f) ? fs.readFileSync(f, 'utf8') : '';
const idx = doc(path.join(DU_AN, 'index.html'));
[...idx.matchAll(/data-composition-src="[^"]*"[^>]*data-start="([\d.]+)"[^>]*data-track-index="0"/g)].forEach(m => { const t = +m[1]; if (t > 0) boQua.push([t - .8, t + .8, 'cắt cảnh']); });
[...idx.matchAll(/class="clip muc"[^>]*data-start="([\d.]+)"[^>]*data-duration="([\d.]+)"/g)].forEach(m => boQua.push([+m[1] - .1, +m[1] + +m[2] + .1, 'mực bắn']));
[...doc(path.join(DU_AN, 'compositions', 'phu-de.html')).matchAll(/class="clip pd" data-start="([\d.]+)" data-duration="([\d.]+)"/g)].forEach(m => { const a = +m[1], b = a + +m[2]; boQua.push([a - .07, a + .07, 'phụ đề'], [b - .07, b + .07, 'phụ đề']); });
[...idx.matchAll(/id="(mo-dau|nhan-vat|trich-dan|ket)"[^>]*data-start="([\d.]+)"/g)].forEach(m => boQua.push([+m[2], +m[2] + 2.6, 'chữ tựa hiện']));   // tựa/chú thích cảnh tư liệu hiện ra (cố ý)
const coY = t => boQua.find(([a, b]) => t >= a && t <= b);

/* đo khác biệt từng khung (ffmpeg ghi file tương đối trong thư mục tạm: tránh dấu ':' của ổ đĩa Windows trong bộ lọc) */
const tam = fs.mkdtempSync(path.join(os.tmpdir(), 'kiem-muot-'));
const r = spawnSync('ffmpeg', ['-v', 'error', '-i', MP4, '-vf', 'scale=480:-1,tblend=all_mode=difference,signalstats,metadata=print:key=lavfi.signalstats.YAVG:file=diff.txt', '-an', '-f', 'null', '-'], { cwd: tam, encoding: 'utf8' });
if (r.status !== 0) { console.log('ffmpeg lỗi: ' + (r.stderr || r.error)); process.exit(2); }
const fps = (() => { const p = spawnSync('ffprobe', ['-v', 'error', '-select_streams', 'v:0', '-show_entries', 'stream=r_frame_rate', '-of', 'csv=p=0', MP4], { encoding: 'utf8' }).stdout.trim().split('/'); return +p[0] / (+p[1] || 1) || 30; })();
const v = [...fs.readFileSync(path.join(tam, 'diff.txt'), 'utf8').matchAll(/YAVG=([\d.]+)/g)].map(m => +m[1]);
fs.rmSync(tam, { recursive: true, force: true });

const ket = [];
for (let i = 3; i < v.length - 3; i++) {
  const nb = [v[i - 3], v[i - 2], v[i - 1], v[i + 1], v[i + 2], v[i + 3]].sort((a, b) => a - b), tb = (nb[2] + nb[3]) / 2, t = (i + 1) / fps;
  let loai = null; if (tb > .6 && v[i] < tb * .25) loai = 'ĐỨNG'; else if (v[i] > Math.max(2, tb * 3)) loai = 'NHẢY';
  if (!loai) continue; const cy = coY(t); ket.push({ loai, t: +t.toFixed(2), d: +v[i].toFixed(2), quanh: +tb.toFixed(2), co_y: cy ? cy[2] : null });
}
const that = ket.filter(k => !k.co_y);
if (args.includes('--json')) console.log(JSON.stringify({ mp4: MP4, khung: v.length, fps, giat: that, co_y: ket.filter(k => k.co_y) }, null, 1));
else {
  console.log(`🎞 KIỂM ĐỘ MƯỢT ${path.relative(ROOT, MP4)} · ${v.length} khung · ${fps} fps · bỏ qua ${ket.length - that.length} chỗ cố ý (cắt cảnh, mực bắn, phụ đề, chữ tựa)`);
  if (!that.length) console.log('✔ Không có chỗ giật/khựng ngoài vùng cố ý.');
  else { console.log(`✖ ${that.length} chỗ giật/khựng – xem khung quanh các mốc này (thường do nhãn bật/tắt, máy quay khựng ở khóa, sprite đổi hình):`); that.forEach(k => console.log(`  ${k.loai} ${k.t.toFixed(2)}s  khác biệt ${k.d} (quanh ${k.quanh})`)); }
}

/* bản xem nhẹ để gửi điện thoại/web (giới hạn gửi file 30 MB) */
if (args.includes('--ban-xem')) {
  const ra = MP4.replace(/\.mp4$/, '-xem.mp4'), dur = +spawnSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', MP4], { encoding: 'utf8' }).stdout.trim() || 90;
  const kbps = Math.max(600, Math.min(2400, Math.floor(27 * 8192 / dur) - 140));   // ~27 MB tổng, trừ 128k âm thanh
  const x = spawnSync('ffmpeg', ['-v', 'error', '-y', '-i', MP4, '-vf', 'scale=1280:-2', '-c:v', 'libx264', '-preset', 'slow', '-b:v', kbps + 'k', '-maxrate', Math.round(kbps * 1.2) + 'k', '-bufsize', kbps * 2 + 'k', '-pix_fmt', 'yuv420p', '-c:a', 'aac', '-b:a', '128k', '-movflags', '+faststart', ra], { stdio: 'inherit' });
  if (x.status === 0) console.log(`✔ Bản xem: ${path.relative(ROOT, ra)} · ${(fs.statSync(ra).size / 1048576).toFixed(1)} MB`);
}
process.exit(that.length ? 1 : 0);
