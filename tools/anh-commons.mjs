#!/usr/bin/env node
/* =========================================================================
   ẢNH TƯ LIỆU TỪ WIKIMEDIA COMMONS – Xưởng film Lịch sử Việt Nam
   node tools/anh-commons.mjs tim "<từ khóa>" [--so 12]
        → liệt kê ảnh tìm được: tên tệp, kích thước, GIẤY PHÉP, tác giả (chỉ in, không tải)
   node tools/anh-commons.mjs tai <id-trận> <slot> "<File:Tên tệp.jpg>" "<chú thích tiếng Việt>" [--fit contain]
        → tải bản rộng 1920 px vào anh/<id>/NN-<slot>.jpg, ghi/ cập nhật anh/<id>/nguon.json
   Chỉ nhận giấy phép tự do: Public domain, CC0, CC BY, CC BY-SA (từ chối mọi giấy phép khác).
   Dùng API chính thức của Commons; User-Agent chung, không gửi thông tin cá nhân.
   Sau khi tải xong: chép các mục trong nguon.json vào mảng anh: [...] của trận trong battles.js
   (node tools/anh-commons.mjs khai <id-trận> in sẵn đoạn cần chép).
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const UA = 'XuongVideo-LichSu/1.0 (cong cu giao duc; Wikimedia API)';
const [lenh, ...a] = process.argv.slice(2), co = n => { const i = a.indexOf(n); return i < 0 ? null : a[i + 1]; };
const ngu = ms => Atomics.wait(new Int32Array(new SharedArrayBuffer(4)), 0, 0, ms);
const api = q => { for (let lan = 0; lan < 5; lan++) { try { return JSON.parse(execFileSync('curl', ['-sf', '-m', '40', '-A', UA, 'https://commons.wikimedia.org/w/api.php?' + new URLSearchParams({ format: 'json', maxlag: '5', ...q })]).toString()); } catch (e) { ngu(3000 * (lan + 1)); } } throw new Error('Commons không phản hồi (đã thử 5 lần)'); };   // thử lại, giãn cách tăng dần (tránh bị giới hạn tần suất)
const sach = s => String(s || '').replace(/<[^>]+>/g, '').replace(/\s+/g, ' ').trim();
const tuDo = l => /^(public domain|pd|cc0|cc[- ]by(-sa)?([- ][0-9.]+)?( [a-z]+)?)/i.test(l) && !/nc|nd/i.test(l);
const thongTin = tieuDe => { const r = api({ action: 'query', titles: tieuDe, prop: 'imageinfo', iiprop: 'url|size|extmetadata|mime', iiurlwidth: '1920' });
  const p = Object.values(r.query.pages)[0], ii = p.imageinfo && p.imageinfo[0]; if (!ii) return null; const m = ii.extmetadata || {};
  return { tieuDe: p.title, url: ii.thumburl || ii.url, rong: ii.width, cao: ii.height, mime: ii.mime, license: sach(m.LicenseShortName?.value), artist: sach(m.Artist?.value), mota: sach(m.ImageDescription?.value).slice(0, 160), trang: ii.descriptionurl }; };

if (lenh === 'tim') {
  const q = a.find(x => !x.startsWith('--')), so = +(co('--so') || 12);
  // một lần gọi: tìm + lấy thông tin ảnh (giấy phép, tác giả) cho cả trang kết quả
  const r = api({ action: 'query', generator: 'search', gsrsearch: q, gsrnamespace: '6', gsrlimit: String(so), prop: 'imageinfo', iiprop: 'size|extmetadata|mime' });
  for (const p of Object.values(r.query?.pages || {}).sort((x, y) => x.index - y.index)) { const ii = p.imageinfo?.[0]; if (!ii || !/jpeg|png/.test(ii.mime)) continue; const m = ii.extmetadata || {}, lic = sach(m.LicenseShortName?.value);
    console.log(`${tuDo(lic) ? '✔' : '✖'} ${p.title} · ${ii.width}×${ii.height} · ${lic || '?'} · ${sach(m.Artist?.value).slice(0, 40)}\n     ${sach(m.ImageDescription?.value).slice(0, 150)}`); }
} else if (lenh === 'tai') {
  const [id, slot, tieuDe, chu] = a.filter(x => !x.startsWith('--') && x !== co('--fit'));
  const t = thongTin(tieuDe); if (!t) { console.log('✖ Không thấy tệp ' + tieuDe); process.exit(1); }
  if (!tuDo(t.license)) { console.log(`✖ Giấy phép "${t.license}" không tự do – không tải.`); process.exit(1); }
  const dir = path.join(ROOT, 'anh', id); fs.mkdirSync(dir, { recursive: true });
  const nf = path.join(dir, 'nguon.json'), ds = fs.existsSync(nf) ? JSON.parse(fs.readFileSync(nf, 'utf8')) : [];
  const stt = String((ds.findIndex(d => d.slot === slot) + 1) || ds.length + 1).padStart(2, '0'), file = `${stt}-${slot}.jpg`, tam = path.join(dir, '_tai.tmp');
  execFileSync('curl', ['-sf', '-m', '120', '-A', UA, '-o', tam, t.url]);
  execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', tam, '-vf', "scale='min(1920,iw)':-2", '-q:v', '3', path.join(dir, file)]); fs.rmSync(tam, { force: true });
  const muc = { file, slot, caption: chu, credit: `Ảnh: ${t.artist || 'Khuyết danh'} · ${t.license} · Wikimedia Commons`, license: t.license, artist: t.artist, nguon: t.trang, tep: t.tieuDe, ...(co('--fit') ? { fit: co('--fit') } : {}) };
  const k = ds.findIndex(d => d.slot === slot); if (k >= 0) ds[k] = muc; else ds.push(muc);
  fs.writeFileSync(nf, JSON.stringify(ds, null, 1) + '\n'); console.log(`✔ anh/${id}/${file} · ${t.license} · ${t.artist || 'khuyết danh'}`);
} else if (lenh === 'khai') {
  const ds = JSON.parse(fs.readFileSync(path.join(ROOT, 'anh', a[0], 'nguon.json'), 'utf8'));
  console.log(JSON.stringify(ds.map(({ file, slot, caption, credit, fit }) => ({ file, slot, ...(fit ? { fit } : {}), caption, credit }))));
} else console.log('Cách dùng: tim "<từ khóa>" | tai <id> <slot> "<File:…>" "<chú thích>" [--fit contain] | khai <id>');
