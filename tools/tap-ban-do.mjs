#!/usr/bin/env node
/* =========================================================================
   CHẠY TRỌN QUY TRÌNH 1 TẬP PHIM BẢN ĐỒ CHIẾN DỊCH – Xưởng film Lịch sử Việt Nam (skill ban-do-chien-dich)
   node tools/tap-ban-do.mjs <id-trận> [--snap 30,45,60] [--render] [--app]
     1. hf-tap        dựng hyperframes/<id>/
     2. kiem-phim --hf  (lỗi → dừng) · kiem-thuy (thuyền trên cạn → dừng)
     3. --snap t,…    chụp khung → hyperframes/_snap/<id>/ (contact-sheet.jpg) để xem trước khi render
     4. --render      render 1080p → hyperframes/<id>.mp4, rồi kiem-muot --ban-xem (giật → báo, vẫn giữ bản)
     5. --app         đưa lên app: tools/phim-ban-do-app.mjs (chỉ khi kiem-muot đạt)
   Telemetry HyperFrames luôn tắt.
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import { spawnSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..'), HF = path.join(ROOT, 'hyperframes');
const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--') && !/^[\d.,]+$/.test(a)), flag = n => args.includes(n), val = n => { const i = args.indexOf(n); return i < 0 ? null : args[i + 1]; };
if (!id) { console.log('Cách dùng: node tools/tap-ban-do.mjs <id-trận> [--snap 30,45] [--render] [--app]'); process.exit(2); }
const env = { ...process.env, HYPERFRAMES_NO_TELEMETRY: '1', DO_NOT_TRACK: '1' }, BIN = path.join(HF, 'node_modules', 'hyperframes', 'bin', 'hyperframes.mjs');
const chay = (ten, cmd, a, cwd = ROOT) => { console.log(`\n▶ ${ten}`); const r = spawnSync(cmd, a, { cwd, env, stdio: 'inherit' }); return r.status; };
const node = process.execPath;

if (chay('Dựng dự án HyperFrames', node, [path.join(ROOT, 'tools', 'hf-tap.mjs'), id])) process.exit(1);
if (chay('Tự kiểm phim', node, [path.join(ROOT, 'tools', 'kiem-phim.mjs'), path.join('hyperframes', id), '--hf'])) { console.log('✖ Kiểm phim có lỗi – sửa rồi chạy lại.'); process.exit(1); }
if (chay('Kiểm thủy (thuyền luôn trên mặt nước)', node, [path.join(ROOT, 'tools', 'kiem-thuy.mjs'), id])) { console.log('✖ Có thuyền trên cạn – sửa kịch bản/tuyến rồi chạy lại.'); process.exit(1); }
const snap = val('--snap');
if (snap) { const out = path.join(HF, '_snap', id); fs.rmSync(out, { recursive: true, force: true });
  chay('Chụp khung xem trước', node, [BIN, 'snapshot', id, '--at', snap, '--no-end', '-o', out], HF); console.log('  → ' + path.join(out, 'contact-sheet.jpg')); }
if (flag('--render')) {
  const t0 = Date.now(); if (chay('Render 1080p (vài phút)', node, [BIN, 'render', '-o', `../${id}.mp4`], path.join(HF, id))) { console.log('✖ Render lỗi.'); process.exit(1); }
  console.log(`  render xong sau ${Math.round((Date.now() - t0) / 1000)} giây`);
  const muot = chay('Kiểm độ mượt + bản xem', node, [path.join(ROOT, 'tools', 'kiem-muot.mjs'), id, '--ban-xem']);
  if (flag('--app')) { if (muot) console.log('✖ Còn chỗ giật – chưa đưa lên app.'); else chay('Đưa lên app', node, [path.join(ROOT, 'tools', 'phim-ban-do-app.mjs'), id]); }
}
