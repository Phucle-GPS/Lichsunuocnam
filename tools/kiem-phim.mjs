#!/usr/bin/env node
/* =========================================================================
   TỰ KIỂM PHIM (dự án HyperFrames) – Xưởng film Lịch sử Việt Nam
   node tools/kiem-phim.mjs hyperframes/<id> [--hf] [--json]
   Kiểm 3 loại lỗi trước khi render/đăng:
     1. CLIP THIẾU   – file ảnh/giọng/nhạc/cảnh con được trỏ tới nhưng không có; cảnh hở (khoảng trống trên
                       dòng thời gian chính); giọng đọc tràn khỏi cảnh; clip thiếu id/data-start/data-duration.
     2. TƯ LIỆU LẶP  – cùng 1 ảnh/clip (trùng tên hoặc trùng nội dung – băm SHA-1) dùng ở nhiều cảnh.
     3. ĐƯỜNG DẪN MÁY – đường dẫn tuyệt đối của máy dựng (/home/, /Users/, /root/, /tmp/, C:\, file://,
                       localhost, 127.0.0.1) hoặc tài nguyên mạng (http…) lọt vào phim → máy khác render hỏng.
   --hf   : chạy thêm `npx hyperframes check --json` (lint + runtime + bố cục) và gộp kết quả.
   Mã thoát 1 nếu có LỖI (cảnh báo không chặn).
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';
const args = process.argv.slice(2), DIR = path.resolve(args.find(a => !a.startsWith('--')) || '.');
if (!fs.existsSync(path.join(DIR, 'index.html'))) { console.log('Cách dùng: node tools/kiem-phim.mjs hyperframes/<id> [--hf] [--json]'); process.exit(2); }
const loi = [], canh = [], add = (muc, ma, tin, file) => (muc === 'loi' ? loi : canh).push({ ma, tin, file: file && path.relative(DIR, file) });
const doc = f => fs.readFileSync(f, 'utf8');
const attrs = tag => Object.fromEntries([...tag.matchAll(/([\w-]+)\s*=\s*"([^"]*)"/g)].map(m => [m[1], m[2]]));

/* ---------- gom mọi file HTML/JS/CSS của dự án ---------- */
const files = []; (function walk(d) { for (const e of fs.readdirSync(d, { withFileTypes: true })) { if (e.name.startsWith('.') || e.name === 'node_modules' || e.name === 'renders') continue; const f = path.join(d, e.name); if (e.isDirectory()) walk(f); else files.push(f); } })(DIR);
const nguon = files.filter(f => /\.(html|css|js|mjs|json)$/i.test(f) && !/three\.min\.js|gsap\.min\.js/.test(f));

/* ---------- 3. ĐƯỜNG DẪN MÁY ---------- */
const MAY = [/\/home\/[\w.-]+/, /\/Users\/[\w.-]+/, /\/root\//, /(^|["'(\s])\/tmp\//, /\b[A-Z]:\\/, /file:\/\//i, /\blocalhost\b/, /127\.0\.0\.1/, /\\\\[\w.-]+\\/];
for (const f of nguon) {
  const lines = doc(f).split('\n');
  lines.forEach((l, i) => {
    for (const re of MAY) if (re.test(l)) { add('loi', 'duong_dan_may', `dòng ${i + 1}: "${l.trim().slice(0, 110)}"`, f); break; }
    const m = l.match(/(?:src|href)\s*=\s*"(https?:\/\/[^"]+)"|url\(\s*['"]?(https?:\/\/[^'")]+)/);
    if (m && /\.(html|css)$/.test(f)) add('loi', 'tai_nguyen_mang', `dòng ${i + 1}: ${m[1] || m[2]} (render không được tải mạng – chép vào assets/)`, f);
  });
}

/* ---------- 1. CLIP THIẾU ---------- */
const html = doc(path.join(DIR, 'index.html'));
const root = attrs((html.match(/<div[^>]*data-composition-id="main"[^>]*>/) || [''])[0]);
const TOTAL = +root['data-duration'] || 0; if (!TOTAL) add('loi', 'thieu_thoi_luong', 'bản dựng gốc không có data-duration', path.join(DIR, 'index.html'));
const tham = new Map();   // file tài nguyên → [nơi dùng]
const ghiTham = (src, noi, f) => { if (!src || /^(data:|#|https?:)/.test(src)) return; const p = path.resolve(path.dirname(f).endsWith('compositions') ? DIR : path.dirname(f), src.split('?')[0]); (tham.get(p) || tham.set(p, []).get(p)).push(noi); };
for (const f of nguon.filter(f => f.endsWith('.html'))) {
  const s = doc(f);
  for (const m of s.matchAll(/<(img|audio|video|source|script)\b[^>]*\bsrc="([^"]+)"[^>]*>/g)) ghiTham(m[2], path.relative(DIR, f) + ' · ' + (attrs(m[0]).id || m[1]), f);
  for (const m of s.matchAll(/url\(\s*['"]?([^'")]+)['"]?\s*\)/g)) ghiTham(m[1], path.relative(DIR, f) + ' · css', f);
  for (const m of s.matchAll(/data-composition-src="([^"]+)"/g)) ghiTham(m[1], path.relative(DIR, f) + ' · cảnh con', f);
}
for (const [p, noi] of tham) if (!fs.existsSync(p)) add('loi', 'clip_thieu', `không có file ${path.relative(DIR, p)} (dùng ở ${noi[0]})`, path.join(DIR, 'index.html'));
// cảnh chính trên track 0: hở / chồng
const CANH = [...html.matchAll(/<div[^>]*data-composition-src="[^"]+"[^>]*>/g)].map(m => attrs(m[0])).filter(a => a['data-track-index'] === '0')
  .map(a => ({ id: a.id, s: +a['data-start'], e: +a['data-start'] + +a['data-duration'] })).sort((a, b) => a.s - b.s);
let den = 0; CANH.forEach(c => { if (c.s - den > 0.05) add('loi', 'canh_ho', `khoảng trống ${den.toFixed(2)}–${c.s.toFixed(2)} s trước cảnh "${c.id}" (màn hình đen)`); if (den - c.s > 0.05) add('canh', 'canh_chong', `cảnh "${c.id}" chồng ${(den - c.s).toFixed(2)} s lên cảnh trước`); den = Math.max(den, c.e); });
if (TOTAL && TOTAL - den > 0.05) add('loi', 'canh_ho', `cuối phim trống ${den.toFixed(2)}–${TOTAL.toFixed(2)} s`);
// clip có thời gian: đủ thuộc tính, không tràn khỏi phim; giọng nằm trong cảnh
for (const f of nguon.filter(f => f.endsWith('.html'))) for (const m of doc(f).matchAll(/<(\w+)\b[^>]*class="[^"]*\bclip\b[^"]*"[^>]*>/g)) {
  const a = attrs(m[0]); if (!a.id) add('loi', 'clip_thieu_id', `<${m[1]}> class="clip" không có id`, f);
  if (a['data-start'] == null || a['data-duration'] == null) add('loi', 'clip_thieu_thoi_gian', `#${a.id} thiếu data-start/data-duration`, f);
  else if (f.endsWith('index.html') && TOTAL && +a['data-start'] + +a['data-duration'] > TOTAL + 0.05) add('canh', 'clip_tran', `#${a.id} kết thúc ở ${(+a['data-start'] + +a['data-duration']).toFixed(2)} s, quá cuối phim ${TOTAL} s`, f);
}
// độ dài file âm thanh so với khe
const probe = p => { try { return +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', p]).toString().trim(); } catch (e) { return null; } };
for (const m of html.matchAll(/<audio\b[^>]*>/g)) { const a = attrs(m[0]), p = path.join(DIR, a.src || ''); if (!fs.existsSync(p)) continue; const d = probe(p);
  if (d != null && d + 0.15 < +a['data-duration'] && a.id !== 'nhac') add('canh', 'am_thanh_ngan', `#${a.id} dài ${d.toFixed(2)} s, khe ${a['data-duration']} s`);
  if (d != null && d < 0.3) add('loi', 'am_thanh_rong', `#${a.id} gần như rỗng (${d.toFixed(2)} s)`); }
// file trong assets không ai dùng (thừa – có thể là tư liệu quên gắn)
for (const f of files.filter(f => f.includes(path.sep + 'assets' + path.sep) && /\.(jpe?g|png|webp|mp4|webm|mov|mp3|wav|m4a)$/i.test(f))) if (!tham.has(f)) add('canh', 'tu_lieu_thua', `${path.relative(DIR, f)} không được cảnh nào dùng`);

/* ---------- 2. TƯ LIỆU LẶP ---------- */
// bản đồ nền (nen-*.jpg, do-cao.png) được phép dùng lại cho cảnh trước & sau trận
const anhVid = [...tham.entries()].filter(([p]) => /\.(jpe?g|png|webp|gif|mp4|webm|mov)$/i.test(p) && fs.existsSync(p));
const cảnhCủa = noi => [...new Set(noi.map(n => n.split(' · ')[0]))];
anhVid.filter(([p]) => !/(nen-[\w-]+|do-cao)\.(jpe?g|png)$/.test(p)).forEach(([p, noi]) => { const c = cảnhCủa(noi); if (c.length > 1) add('canh', 'tu_lieu_lap', `${path.relative(DIR, p)} dùng ở ${c.length} cảnh: ${c.join(', ')}`); });
const bam = new Map(); anhVid.forEach(([p]) => { const h = crypto.createHash('sha1').update(fs.readFileSync(p)).digest('hex'); (bam.get(h) || bam.set(h, []).get(h)).push(path.relative(DIR, p)); });
for (const [, ds] of bam) if (ds.length > 1) add('loi', 'tu_lieu_lap', `cùng một tư liệu nhưng khác tên: ${ds.join(' = ')}`);
// cùng ảnh gốc trong nguon.json của trận (khác file nhưng chung nguồn Commons)
const ng = path.join(DIR, '..', '..', 'anh', path.basename(DIR), 'nguon.json');
if (fs.existsSync(ng)) { try { const J = JSON.parse(doc(ng)), arr = Array.isArray(J) ? J : Object.values(J), by = new Map(); arr.forEach(x => { const k = x && (x.url || x.nguon || x.source); if (k) (by.get(k) || by.set(k, []).get(k)).push(x.file || x.slot); }); for (const [k, ds] of by) if (ds.length > 1) add('canh', 'tu_lieu_lap', `nhiều ảnh cùng một nguồn ${k}: ${ds.join(', ')}`); } catch (e) {} }

/* ---------- HyperFrames check ---------- */
let hf = null;
if (args.includes('--hf')) {
  const bin = path.resolve(DIR, '..', 'node_modules', '.bin', 'hyperframes');
  try { const out = execFileSync(fs.existsSync(bin) ? bin : 'npx', fs.existsSync(bin) ? ['check', '--json'] : ['hyperframes', 'check', '--json'], { cwd: DIR, env: { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' }, stdio: ['ignore', 'pipe', 'ignore'], maxBuffer: 64 << 20 }).toString(); hf = JSON.parse(out); }
  catch (e) { try { hf = JSON.parse(e.stdout?.toString() || ''); } catch (e2) { add('loi', 'hf_check', 'không chạy được hyperframes check: ' + e.message.split('\n')[0]); } }
  if (hf) for (const k of ['lint', 'runtime', 'layout', 'contrast', 'craft', 'audio']) (hf[k]?.findings || []).forEach(x => { if (x.severity === 'error') add('loi', 'hf_' + x.code, x.message.slice(0, 160), x.sourceFile && path.join(DIR, x.sourceFile)); });
}

/* ---------- báo cáo ---------- */
const kq = { thu_muc: path.relative(process.cwd(), DIR) || '.', thoi_luong: TOTAL, so_canh: CANH.length, so_tai_nguyen: tham.size, loi, canh_bao: canh, hf_ok: hf ? !!hf.ok : null };
if (args.includes('--json')) console.log(JSON.stringify(kq, null, 2));
else {
  console.log(`\n🎬 KIỂM PHIM ${kq.thu_muc} · ${TOTAL.toFixed(1)} s · ${CANH.length} cảnh · ${tham.size} tài nguyên${hf ? ' · HyperFrames check: ' + (hf.ok ? 'đạt' : 'KHÔNG đạt') : ''}`);
  const nhom = { clip_thieu: 'Clip thiếu', canh_ho: 'Cảnh hở', tu_lieu_lap: 'Tư liệu lặp', duong_dan_may: 'Đường dẫn máy', tai_nguyen_mang: 'Tài nguyên mạng' };
  for (const [ten, ds, ky] of [['LỖI', loi, '✖'], ['Cảnh báo', canh, '⚠']]) { if (!ds.length) continue; console.log(`\n${ten} (${ds.length}):`); ds.forEach(x => console.log(`  ${ky} [${nhom[x.ma] || x.ma}] ${x.tin}${x.file ? '  — ' + x.file : ''}`)); }
  console.log(loi.length ? `\n✖ ${loi.length} lỗi – sửa trước khi render.` : `\n✔ Không có lỗi: không thiếu clip, không trùng tư liệu, không đường dẫn máy.`);
}
process.exit(loi.length ? 1 : 0);
