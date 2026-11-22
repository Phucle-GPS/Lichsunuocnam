#!/usr/bin/env node
/* Xuất bộ prompt PHIM NGƯỜI QUE LỊCH SỬ (Style A5 Historical Cartoon, theo skill directing-stickman-videos – MIT)
   cho các trận: node tools/prompt-nguoi-que.mjs [id-trận | all]  →  prompt-ai/nguoi-que/<id>.txt
   Thời lượng từng cảnh lấy theo giọng Manus trong loi-dan/<id>/ (nếu có). */
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const ctx = { window: {}, document: {}, indexedDB: {}, console }; ctx.window = ctx; vm.createContext(ctx);
for (const f of ['battles.js', 'lib/xuong.js', 'lib/aiprompt.js', 'lib/a5-anchor.js', 'lib/stickprompt.js']) vm.runInContext(fs.readFileSync(path.join(ROOT, f), 'utf8'), ctx, { filename: f });
const which = process.argv[2] || 'all', out = path.join(ROOT, 'prompt-ai', 'nguoi-que'); fs.mkdirSync(out, { recursive: true });
const dur = f => { if (!fs.existsSync(f)) return 0; try { return +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString() + 1; } catch (e) { return 0; } };
for (const b of ctx.BATTLES.filter(x => which === 'all' || which.split(',').includes(x.id))) {
  const durs = b.scenes.map((_, i) => dur(path.join(ROOT, 'loi-dan', b.id, String(i + 1).padStart(2, '0') + '.mp3')));
  const r = ctx.StickPrompt.pack(b, durs);
  fs.writeFileSync(path.join(out, b.id + '.txt'), r.text);
  console.log(`✔ prompt-ai/nguoi-que/${b.id}.txt  (${r.clips} clip · ${Math.round(r.total)} giây)`);
}
