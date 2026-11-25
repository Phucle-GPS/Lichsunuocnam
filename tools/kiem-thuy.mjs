#!/usr/bin/env node
/* =========================================================================
   KIỂM THỦY – thuyền có luôn nằm trên mặt nước không? (phim bản đồ chiến dịch, Xưởng film Lịch sử Việt Nam)
   node tools/kiem-thuy.mjs <id-trận> [--buoc 0.25]
   Nạp máy dựng 3D (hyperframes/_chung/bando3d.js) với nền + độ cao + kịch bản của trận, tua cảnh bản đồ
   từ đầu đến cuối (mỗi --buoc giây) và liệt kê mọi thuyền đang hiện; thuyền nào đứng ở chỗ không phải
   mặt nước (độ cao > 0 sau khi hạ phẳng sông/biển của bản đồ cổ) → LỖI. Mã thoát 1 nếu có lỗi.
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module'; import { fileURLToPath, pathToFileURL } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), require = createRequire(import.meta.url);
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(ROOT, 'tools', 'node_modules', 'playwright')); } })();
const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--')), buoc = +(args[args.indexOf('--buoc') + 1] || .25) || .25;
if (!id) { console.log('Cách dùng: node tools/kiem-thuy.mjs <id-trận> [--buoc 0.25]'); process.exit(2); }
const M = path.join(ROOT, 'maps', id), KB = JSON.parse(fs.readFileSync(path.join(M, 'kich-ban-ban-do.json'), 'utf8')), DU = JSON.parse(fs.readFileSync(path.join(M, 'tuyen.json'), 'utf8'));
if (!(KB.doan_quan || []).some(q => q.phuong_tien === 'thuyen')) { console.log(`🚣 KIỂM THỦY ${id}: trận không có thuyền – bỏ qua.`); process.exit(0); }
const u = f => pathToFileURL(f).href;
const html = `<!doctype html><meta charset=utf-8><div id=k style="width:640px;height:360px"></div><img id=n src="${u(path.join(M, 'nen-3d.jpg'))}"><img id=d src="${u(path.join(M, 'do-cao.png'))}">
<script src="${u(path.join(ROOT, 'lib', 'three.min.js'))}"></script><script src="${u(path.join(ROOT, 'hyperframes', '_chung', 'bando3d.js'))}"></script>`;
const tam = path.join(ROOT, 'hyperframes', '_kiem-thuy.html'); fs.writeFileSync(tam, html);
const br = await chromium.launch({ args: ['--allow-file-access-from-files', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] }), pg = await br.newPage({ viewport: { width: 640, height: 360 } });
const loi = []; pg.on('pageerror', e => loi.push(e.message));
await pg.goto(u(tam)); await pg.evaluate(async ({ du, kb }) => { const n = document.getElementById('n'), d = document.getElementById('d'); await n.decode(); await d.decode();
  window.bd = BanDo3D(document.getElementById('k'), { nen: n, doCao: d, du_lieu: du, kich_ban: kb, sau_tran: false }); }, { du: { khung: DU.khung, tuyen: DU.tuyen, dia_danh: [] }, kb: KB });
const tMax = Math.max(...(KB.may_quay || [[0]]).map(k => k[0]), ...(KB.doan_quan || []).map(q => (q.an_sau ?? q.t1) + 5));
const sai = [], dem = { khung: 0, thuyen: 0 };
for (let t = 0; t <= tMax; t += buoc) { const ds = await pg.evaluate(t => window.bd.kiemThuyen(t), t); dem.khung++; dem.thuyen += ds.length; ds.filter(b => !b.nuoc).forEach(b => sai.push({ t: +t.toFixed(2), ...b })); }
await br.close(); fs.rmSync(tam, { force: true });
if (loi.length) { console.log('✖ Lỗi máy dựng:', loi.slice(0, 3)); process.exit(1); }
console.log(`🚣 KIỂM THỦY ${id}: ${dem.khung} khung (0–${tMax.toFixed(1)} s, bước ${buoc}s) · ${dem.thuyen} lượt thuyền`);
if (!sai.length) { console.log('✔ Mọi thuyền luôn nằm trên mặt nước.'); process.exit(0); }
const nhom = {}; sai.forEach(s => { const k = s.ten; (nhom[k] = nhom[k] || []).push(s); });
console.log(`✖ ${sai.length} lượt thuyền ĐỨNG TRÊN CẠN:`); Object.entries(nhom).forEach(([k, v]) => console.log(`  ${k}: ${v.length} lượt, từ ${v[0].t}s đến ${v[v.length - 1].t}s, vd. điểm ảnh (${v[0].x}, ${v[0].y})`));
process.exit(1);
