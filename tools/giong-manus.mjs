#!/usr/bin/env node
/* TỰ TẠO LỜI DẪN BẰNG GIỌNG MANUS ĐÃ LƯU (loi-dan/GIONG.json) – khỏi phải gửi Manus mỗi lần.
   Giọng: nam trầm, ấm, kể chuyện phim tài liệu (nghe mẫu: loi-dan/giong-mau.mp3).
   Nhà cung cấp mặc định: ElevenLabs (theo tools/create_male_voice_elevenlabs.py của Manus).

   Mã truy cập lấy từ biến môi trường ELEVENLABS_API_KEY (hoặc GEMINI_API_KEY khi dùng Gemini).
   KHÔNG ghi mã vào repo.

   Lần đầu (chỉ làm 1 lần) – chọn giọng:
     node tools/giong-manus.mjs dat-id <voice_id>      # đã có voice_id (file voice_id.txt của Manus)
     node tools/giong-manus.mjs thiet-ke               # chưa có: tạo vài giọng nghe thử vào giong-nhap/thiet-ke/
     node tools/giong-manus.mjs chon <số>              # chọn giọng nghe ưng nhất → lưu voice_id
   Nhân bản giọng từ 48 đoạn Manus gốc (1 lần, ElevenLabs): node tools/giong-manus.mjs nhan-ban [--so-mau=20]
   Kiểm tra file có khớp giọng Manus: node tools/giong-manus.mjs kiem-tra <file.mp3> "lời đọc"
   Nghe thử 1 câu:        node tools/giong-manus.mjs thu ["câu tùy ý"]
   Tạo lời dẫn còn thiếu: node tools/giong-manus.mjs tao [id-trận,...] [--ghi-de]
*/
import fs from 'node:fs';
import path from 'node:path';
import vm from 'node:vm';
import { spawnSync, execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

// fetch của Node chỉ đi qua proxy khi bật NODE_USE_ENV_PROXY
if ((process.env.HTTPS_PROXY || process.env.https_proxy) && !process.env.NODE_USE_ENV_PROXY) {
  const r = spawnSync(process.execPath, process.argv.slice(1), { stdio: 'inherit', env: { ...process.env, NODE_USE_ENV_PROXY: '1', NODE_NO_WARNINGS: '1' } });
  process.exit(r.status ?? 1);
}

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const LD = path.join(ROOT, 'loi-dan'), CFG_F = path.join(LD, 'GIONG.json'), MANI_F = path.join(LD, 'NGUON.json');
const NHAP = path.join(ROOT, 'giong-nhap');
const cfg = JSON.parse(fs.readFileSync(CFG_F, 'utf8'));
const saveCfg = () => fs.writeFileSync(CFG_F, JSON.stringify(cfg, null, 2) + '\n');
const pad = n => String(n).padStart(2, '0');
const [cmd, ...rest] = process.argv.slice(2);
const flags = rest.filter(a => a.startsWith('--')), args = rest.filter(a => !a.startsWith('--'));
const prov = (flags.find(f => f.startsWith('--nha-cung-cap=')) || '').split('=')[1] || cfg.nha_cung_cap;
// Không có mã trong máy: proxy của môi trường đám mây tự chèn mã đã lưu ⇒ dùng mã giả.
const KEY_EL = process.env.ELEVENLABS_API_KEY || 'qua-proxy';
const KEY_GM = process.env.GEMINI_API_KEY || 'qua-proxy';
const EL = 'https://api.elevenlabs.io/v1';
const die = m => { console.error('✖ ' + m); process.exit(1); };

async function elFetch(url, body, accept = 'application/json') {
  const r = await fetch(url, { method: 'POST', headers: { 'xi-api-key': KEY_EL, 'Content-Type': 'application/json', Accept: accept }, body: JSON.stringify(body) });
  if (!r.ok) die(`ElevenLabs HTTP ${r.status}: ${(await r.text()).slice(0, 600)}`);
  return r;
}

/* ---- đọc một câu thành mp3 bằng giọng đã lưu ---- */
async function speak(text, out) {
  fs.mkdirSync(path.dirname(out), { recursive: true });
  if (prov === 'gemini') {
    const g = cfg.gemini;
    const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${g.model}:generateContent`, {
      method: 'POST', headers: { 'x-goog-api-key': KEY_GM, 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: [{ parts: [{ text: (g.phong_cach || '') + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: g.voice } } } } })
    });
    if (!r.ok) die(`Gemini HTTP ${r.status}: ${(await r.text()).slice(0, 600)}`);
    const j = await r.json(), b64 = j.candidates?.[0]?.content?.parts?.find(p => p.inlineData)?.inlineData?.data;
    if (!b64) die('Gemini không trả về âm thanh.');
    const pcm = out + '.pcm'; fs.writeFileSync(pcm, Buffer.from(b64, 'base64'));
    execFileSync('ffmpeg', ['-y', '-v', 'error', '-f', 's16le', '-ar', '24000', '-ac', '1', '-i', pcm, '-b:a', '96k', out]); fs.unlinkSync(pcm);
    return;
  }
  if (!cfg.voice_id) die('Chưa có voice_id. Chạy "dat-id <voice_id>" hoặc "thiet-ke" rồi "chon <số>" trước.');
  const e = cfg.elevenlabs;
  const r = await elFetch(`${EL}/text-to-speech/${encodeURIComponent(cfg.voice_id)}?output_format=${e.output_format}`, { text, model_id: e.model_id, language_code: 'vi', voice_settings: e.voice_settings }, 'audio/mpeg');
  fs.writeFileSync(out, Buffer.from(await r.arrayBuffer()));
}

function battles() {
  const ctx = { window: {} }; vm.createContext(ctx);
  vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
  return ctx.window.BATTLES;
}

if (cmd === 'dat-id') {
  if (!args[0]) die('Thiếu voice_id.');
  cfg.voice_id = args[0].trim(); cfg.nha_cung_cap = 'elevenlabs'; saveCfg();
  console.log(`✔ Đã lưu voice_id ${cfg.voice_id} vào loi-dan/GIONG.json. Nghe thử: node tools/giong-manus.mjs thu`);
} else if (cmd === 'thiet-ke') {
  const t = cfg.elevenlabs.thiet_ke, dir = path.join(NHAP, 'thiet-ke'); fs.mkdirSync(dir, { recursive: true });
  const j = await (await elFetch(`${EL}/text-to-voice/design?output_format=mp3_22050_32`, { voice_description: t.mo_ta, model_id: t.model_id, text: t.cau_thu, auto_generate_text: false, should_enhance: true, guidance_scale: 5 })).json();
  const pv = j.previews || []; if (!pv.length) die('ElevenLabs không trả về giọng nghe thử.');
  pv.forEach((p, i) => p.audio_base_64 && fs.writeFileSync(path.join(dir, `giong-${i + 1}.mp3`), Buffer.from(p.audio_base_64, 'base64')));
  fs.writeFileSync(path.join(dir, 'ung-vien.json'), JSON.stringify(pv.map(p => p.generated_voice_id)));
  console.log(`🎧 ${pv.length} giọng nghe thử trong giong-nhap/thiet-ke/ (giong-1.mp3 …). So với loi-dan/giong-mau.mp3, rồi chạy: node tools/giong-manus.mjs chon <số>`);
} else if (cmd === 'chon') {
  const ids = JSON.parse(fs.readFileSync(path.join(NHAP, 'thiet-ke', 'ung-vien.json'), 'utf8')), g = ids[+args[0] - 1];
  if (!g) die(`Chọn số từ 1 đến ${ids.length}.`);
  const t = cfg.elevenlabs.thiet_ke;
  const c = await (await elFetch(`${EL}/text-to-voice`, { voice_name: t.ten_giong, voice_description: t.mo_ta, generated_voice_id: g, labels: { language: 'vi', style: 'documentary narration', gender: 'male' } })).json();
  if (!c.voice_id) die('Không tạo được giọng: ' + JSON.stringify(c).slice(0, 300));
  cfg.voice_id = c.voice_id; cfg.nha_cung_cap = 'elevenlabs'; saveCfg();
  console.log(`✔ Đã lưu giọng (voice_id ${c.voice_id}) vào loi-dan/GIONG.json.`);
} else if (cmd === 'nhan-ban') {
  // NHÂN BẢN GIỌNG từ các đoạn Manus gốc (ElevenLabs Instant Voice Clone) → lưu voice_id vào GIONG.json
  const list = JSON.parse(fs.readFileSync(path.join(LD, 'nhan-ban', 'thu-tu-mau.json'), 'utf8')).slice(0, +(flags.find(f => f.startsWith('--so-mau=')) || '=20').split('=')[1]);
  const fd = new FormData();
  fd.append('name', 'Giọng Manus – Sử Việt'); fd.append('description', 'Giọng nam trầm, ấm, kể chuyện phim tài liệu lịch sử – nhân bản từ lời dẫn Manus của Xưởng film Lịch sử Việt Nam');
  fd.append('remove_background_noise', 'false'); fd.append('labels', JSON.stringify({ language: 'vi', use: 'narration' }));
  list.forEach(f => fd.append('files', new Blob([fs.readFileSync(path.join(ROOT, f))], { type: 'audio/mpeg' }), f.replace(/^loi-dan\//, '').replace(/\//g, '-')));
  console.log(`🧬 Gửi ${list.length} đoạn Manus gốc để nhân bản giọng…`);
  const r = await fetch(`${EL}/voices/add`, { method: 'POST', headers: { 'xi-api-key': KEY_EL }, body: fd });
  const j = await r.json().catch(() => ({}));
  if (!r.ok || !j.voice_id) die('ElevenLabs: ' + (JSON.stringify(j.detail || j).slice(0, 400) || 'HTTP ' + r.status));
  cfg.voice_id = j.voice_id; cfg.nha_cung_cap = 'elevenlabs'; cfg.nhan_ban = { ngay: new Date().toISOString().slice(0, 10), so_mau: list.length, nguon: 'Các đoạn lời dẫn Manus gốc (loi-dan/nhan-ban/thu-tu-mau.json)' }; saveCfg();
  console.log(`✔ Đã nhân bản giọng – voice_id ${j.voice_id} lưu vào loi-dan/GIONG.json. Đọc thử và kiểm tra: node tools/giong-manus.mjs thu`);
} else if (cmd === 'kiem-tra') {
  // so một file giọng mới với hồ sơ giọng Manus (cao độ, tốc độ)
  const r = spawnSync('python3', [path.join(ROOT, 'tools', 'phan-tich-giong.py'), 'kiemtra', args[0], args.slice(1).join(' ')], { encoding: 'utf8' });
  process.stdout.write(r.stdout || r.stderr); process.exit(r.status);
} else if (cmd === 'thu') {
  const b = battles().find(x => x.id === 'bach-dang-1288');
  const text = args.join(' ') || b.scenes[0].say, out = path.join(NHAP, 'thu.mp3');
  await speak(text, out);
  console.log(`🎧 giong-nhap/thu.mp3 – so với bản Manus loi-dan/bach-dang-1288/01.mp3 (cùng câu) để kiểm tra giọng.`);
  const k = spawnSync('python3', [path.join(ROOT, 'tools', 'phan-tich-giong.py'), 'kiemtra', out, text], { encoding: 'utf8' });
  console.log(k.status === 0 ? '✔ Khớp hồ sơ giọng Manus (cao độ, tốc độ).' : '⚠ Chưa khớp hồ sơ giọng Manus:\n' + (k.stdout || k.stderr));
} else if (cmd === 'tao') {
  if (prov !== 'gemini' && !cfg.voice_id) die('Chưa có voice_id. Chạy "dat-id <voice_id>" hoặc "thiet-ke" rồi "chon <số>" trước.');
  const mani = JSON.parse(fs.readFileSync(MANI_F, 'utf8')), all = battles(), ghiDe = flags.includes('--ghi-de');
  const pick = args[0] ? all.filter(b => args[0].split(',').includes(b.id)) : all;
  let n = 0;
  for (const b of pick) {
    const old = mani.tran[b.id];
    if (old && old.nguon === 'manus' && !old.tu_dong && !ghiDe && b.scenes.every((_, i) => fs.existsSync(path.join(LD, b.id, pad(i + 1) + '.mp3')))) continue; // giữ nguyên bản Manus gửi
    const tmp = path.join(NHAP, 'tao', b.id); let made = 0;
    for (let i = 0; i < b.scenes.length; i++) {
      const dst = path.join(LD, b.id, pad(i + 1) + '.mp3');
      if (fs.existsSync(dst) && !ghiDe) continue;
      process.stdout.write(`🎙 ${b.id} cảnh ${i + 1}/${b.scenes.length}… `);
      const f = path.join(tmp, pad(i + 1) + '.mp3'); await speak(b.scenes[i].say, f);
      const k = spawnSync('python3', [path.join(ROOT, 'tools', 'phan-tich-giong.py'), 'kiemtra', f, b.scenes[i].say], { encoding: 'utf8' });
      fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(f, dst); made++; n++; console.log(k.status === 0 ? 'xong' : 'xong ⚠ lệch hồ sơ giọng – nên nghe lại');
    }
    if (made || !old) {
      mani.tran[b.id] = { nguon: 'manus', so_doan: b.scenes.length, ngay_nap: new Date().toISOString().slice(0, 10), tu_dong: true,
        ghi_chu: `Tạo tự động bằng giọng Manus đã lưu (${prov}${prov === 'elevenlabs' ? ' ' + cfg.voice_id : ''}) – loi-dan/GIONG.json` };
      fs.writeFileSync(MANI_F, JSON.stringify(mani, null, 2));
    }
  }
  fs.rmSync(path.join(NHAP, 'tao'), { recursive: true, force: true });
  console.log(n ? `✔ Đã tạo ${n} đoạn lời dẫn. Xuất video: node tools/render-video.mjs <id>` : '✔ Không còn đoạn nào thiếu giọng.');
} else {
  console.log(fs.readFileSync(fileURLToPath(import.meta.url), 'utf8').split('*/')[0].replace('/*', '').trim());
}
