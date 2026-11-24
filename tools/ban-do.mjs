#!/usr/bin/env node
/* =========================================================================
   BẢN ĐỒ TRẬN ĐÁNH – Xưởng film Lịch sử Việt Nam (làm TỪNG TRẬN một)
   node tools/ban-do.mjs <id-trận> [--zoom 12] [--khong-osm]

   Đọc   maps/<id>/region.json  (vùng, địa danh lịch sử, các tuyến hành quân)
   Tải   • địa hình thật: AWS Terrain Tiles (Terrarium PNG, công khai, miễn phí)
         • OpenStreetMap qua Overpass API: sông, hồ, bờ biển, (tùy chọn) đường, địa danh
   Vẽ    maps/<id>/nen-2k.jpg      nền bản đồ 2560×1440: màu theo độ cao + đổ bóng núi + sông hồ + địa danh
   Dò    maps/<id>/tuyen.json      tuyến hành quân theo địa hình (đường ít tốn sức nhất giữa các điểm)
         maps/<id>/xem-truoc.jpg   nền + tuyến để duyệt
   Bộ nhớ đệm: maps/_cache/ (ô địa hình, dữ liệu OSM) – chạy lại không tải lại.
   Nguồn: © OpenStreetMap contributors (ODbL) · Địa hình: Mapzen/Tilezen Terrain Tiles trên AWS (SRTM, GMTED, ETOPO1…).
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import { createRequire } from 'node:module';
import { execFileSync } from 'node:child_process'; import { fileURLToPath } from 'node:url';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(ROOT, 'tools', 'node_modules', 'playwright')); } })();

const args = process.argv.slice(2), id = args.find(a => !a.startsWith('--'));
if (!id) { console.log('Cách dùng: node tools/ban-do.mjs <id-trận>   (cần maps/<id>/region.json)'); process.exit(1); }
const flag = (n, d) => { const i = args.indexOf(n); return i < 0 ? d : args[i + 1]; };
const DIR = path.join(ROOT, 'maps', id), CACHE = path.join(ROOT, 'maps', '_cache');
const R = JSON.parse(fs.readFileSync(path.join(DIR, 'region.json'), 'utf8'));
const W = R.rong || 2560, H = R.cao || 1440;
fs.mkdirSync(CACHE, { recursive: true });

/* ---------- chiếu Web Mercator & khung 16:9 ---------- */
const lon2x = (lon, z) => (lon + 180) / 360 * 256 * 2 ** z;
const lat2y = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z; };
const x2lon = (x, z) => x / (256 * 2 ** z) * 360 - 180;
const y2lat = (y, z) => { const n = Math.PI - 2 * Math.PI * y / (256 * 2 ** z); return 180 / Math.PI * Math.atan(Math.sinh(n)); };
let { tay, dong, nam, bac } = R.vung;
// nới vùng cho đúng tỉ lệ khung hình
{ const z = 0, x0 = lon2x(tay, z), x1 = lon2x(dong, z), y0 = lat2y(bac, z), y1 = lat2y(nam, z), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
  let w = x1 - x0, h = y1 - y0; if (w / h > W / H) h = w * H / W; else w = h * W / H;
  tay = x2lon(cx - w / 2, z); dong = x2lon(cx + w / 2, z); bac = y2lat(cy - h / 2, z); nam = y2lat(cy + h / 2, z); }
let Z = +flag('--zoom', R.zoom || 0);
if (!Z) { Z = 6; while (lon2x(dong, Z) - lon2x(tay, Z) < W * .8 && Z < 13) Z++; }   // mức chi tiết đủ cho 2K
const PX0 = lon2x(tay, Z), PY0 = lat2y(bac, Z), SX = W / (lon2x(dong, Z) - PX0), SY = H / (lat2y(nam, Z) - PY0);
const proj = ([lon, lat]) => [(lon2x(lon, Z) - PX0) * SX, (lat2y(lat, Z) - PY0) * SY];
console.log(`▶ ${R.ten || id}: vùng ${tay.toFixed(3)}–${dong.toFixed(3)}°E, ${nam.toFixed(3)}–${bac.toFixed(3)}°N · zoom ${Z} · ${W}×${H}`);

/* ---------- 1. địa hình AWS Terrain Tiles ---------- */
const tx0 = Math.floor(PX0 / 256), tx1 = Math.floor(lon2x(dong, Z) / 256), ty0 = Math.floor(PY0 / 256), ty1 = Math.floor(lat2y(nam, Z) / 256);
const tiles = [];
for (let x = tx0; x <= tx1; x++) for (let y = ty0; y <= ty1; y++) {
  const f = path.join(CACHE, `terrarium-${Z}-${x}-${y}.png`);
  if (!fs.existsSync(f)) {
    let ok = false;
    for (let k = 0; k < 3 && !ok; k++) { try { execFileSync('curl', ['-sf', '-m', '60', '-o', f, `https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${Z}/${x}/${y}.png`]); ok = true; } catch (e) {} }
    if (!ok) throw new Error(`Không tải được ô địa hình ${Z}/${x}/${y}`);
  }
  tiles.push({ x, y, b64: fs.readFileSync(f).toString('base64') });
}
console.log(`  địa hình: ${tiles.length} ô (AWS Terrain Tiles)`);

/* ---------- 2. OpenStreetMap (Overpass) ---------- */
const O = Object.assign({ song: true, ho: true, bien: true, duong: false, dia_danh: false }, R.osm || {});
let osm = { elements: [] };
if (!args.includes('--khong-osm')) {
  const bb = `${nam},${tay},${bac},${dong}`, q = [
    O.song && `way["waterway"~"^(river|canal)$"](${bb});way["waterway"="stream"]["name"](${bb});`,
    O.ho && `way["natural"="water"](${bb});relation["natural"="water"](${bb});way["waterway"="riverbank"](${bb});`,
    O.bien && `way["natural"="coastline"](${bb});`,
    O.duong && `way["highway"~"^(motorway|trunk|primary)$"](${bb});`,
    O.dia_danh && `node["place"~"^(city|town)$"](${bb});`].filter(Boolean).join('');
  const key = path.join(CACHE, `osm-${id}-${Buffer.from(JSON.stringify([bb, O])).toString('base64url').slice(0, 40)}.json`);
  const body = `[out:json][timeout:120];(${q});out geom;`;
  for (const ep of ['https://overpass-api.de/api/interpreter', 'https://overpass.private.coffee/api/interpreter']) {
    if (fs.existsSync(key)) break;
    try { execFileSync('curl', ['-sf', '-m', '180', '-o', key + '.tmp', '--data-urlencode', `data=${body}`, ep]); fs.renameSync(key + '.tmp', key); } catch (e) { try { fs.unlinkSync(key + '.tmp'); } catch (x) {} }
  }
  if (fs.existsSync(key)) { osm = JSON.parse(fs.readFileSync(key, 'utf8')); console.log(`  OpenStreetMap: ${osm.elements.length} đối tượng`); }
  else console.log('  ⚠ Không kết nối được OpenStreetMap (Overpass) → vẽ sông suối từ chính địa hình (dòng chảy tích lũy)');
}
// chiếu sẵn hình học OSM sang tọa độ ảnh
const geom = osm.elements.map(e => {
  const t = e.tags || {}, kind = t.natural === 'coastline' ? 'bien' : t.natural === 'water' || t.waterway === 'riverbank' ? 'ho' : t.waterway ? (t.waterway === 'stream' ? 'suoi' : 'song') : t.highway ? 'duong' : t.place ? 'noi' : 'khac';
  const lines = e.type === 'node' ? [[proj([e.lon, e.lat])]] : e.type === 'way' ? [(e.geometry || []).map(p => proj([p.lon, p.lat]))] : (e.members || []).filter(m => m.geometry).map(m => m.geometry.map(p => proj([p.lon, p.lat])));
  const nm = t['name:vi'] || t.name || ''; return { kind, name: /[\u2E80-\u9FFF\uAC00-\uD7AF]/.test(nm) ? '' : nm, lines };   // bỏ tên chữ Hán/Hàn (sông bên kia biên giới)
}).filter(g => g.kind !== 'khac');

/* ---------- 3 + 4. vẽ nền & dò tuyến trong trình duyệt không giao diện ---------- */
const diaDanh = (R.dia_danh || []).map(d => ({ ...d, p: proj([d.lon, d.lat]) }));
const tuyenIn = (R.tuyen || []).map(t => ({ ...t, P: t.diem.map(proj) }));
const browser = await chromium.launch(), page = await browser.newPage({ viewport: { width: 400, height: 300 } });
await page.setContent('<canvas id="c"></canvas>');
const out = await page.evaluate(async ({ songDH, nguong, tiles, tx0, ty0, PX0, PY0, SX, SY, W, H, geom, diaDanh, tuyenIn, nuoc, mpp }) => {
  /* độ cao toàn vùng ở độ phân giải ảnh */
  const nx = (Math.max(...tiles.map(t => t.x)) - tx0 + 1) * 256, ny = (Math.max(...tiles.map(t => t.y)) - ty0 + 1) * 256;
  const big = new OffscreenCanvas(nx, ny), bg = big.getContext('2d');
  for (const t of tiles) { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + t.b64)).blob()); bg.drawImage(im, (t.x - tx0) * 256, (t.y - ty0) * 256); }
  const px = bg.getImageData(0, 0, nx, ny).data, ox = PX0 - tx0 * 256, oy = PY0 - ty0 * 256;
  const elevAt = (X, Y) => { const i = (Math.max(0, Math.min(ny - 1, Y | 0)) * nx + Math.max(0, Math.min(nx - 1, X | 0))) * 4; return px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768; };
  const E = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) E[y * W + x] = elevAt(ox + x / SX, oy + y / SY);
  let emax = 0, emin = 1e9; for (const e of E) { if (e > emax) emax = e; if (e < emin) emin = e; }
  /* bản đồ độ cao 1024×576 (xám 8 bit, 0 = thấp nhất, 255 = cao nhất) để dựng địa hình 3D nổi khối */
  const hw = 1024, hh = 576, hc = new OffscreenCanvas(hw, hh), hg = hc.getContext('2d'), hd = hg.createImageData(hw, hh);
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const v = Math.round((E[Math.floor(y * H / hh) * W + Math.floor(x * W / hw)] - emin) / Math.max(1, emax - emin) * 255); const i = (y * hw + x) * 4; hd.data[i] = hd.data[i + 1] = hd.data[i + 2] = v; hd.data[i + 3] = 255; }
  hg.putImageData(hd, 0, 0); const hb = await hc.convertToBlob({ type: 'image/png' }), docao = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(hb); });
  /* màu theo độ cao + đổ bóng núi (nguồn sáng tây bắc) */
  const cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const ramp = [[-50, [70, 110, 140]], [0, [96, 138, 160]], [1, [142, 158, 118]], [60, [158, 168, 120]], [200, [172, 164, 118]], [500, [160, 138, 100]], [900, [140, 116, 90]], [1500, [170, 160, 150]], [2500, [225, 222, 215]]];
  const tint = e => { for (let i = 1; i < ramp.length; i++) if (e < ramp[i][0]) { const [a, ca] = ramp[i - 1], [b, cb] = ramp[i], k = (e - a) / (b - a); return ca.map((c, j) => c + (cb[j] - c) * k); } return ramp[ramp.length - 1][1]; };
  const zf = 2.2;   // phóng đại độ dốc cho đổ bóng rõ
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, e = E[i], ex = E[y * W + Math.min(W - 1, x + 1)] - E[y * W + Math.max(0, x - 1)], ey = E[Math.min(H - 1, y + 1) * W + x] - E[Math.max(0, y - 1) * W + x];
    const sx = -ex * zf / (2 * mpp), sy = -ey * zf / (2 * mpp), n = Math.hypot(sx, sy, 1), sh = Math.max(0, (sx * -.6 + sy * -.6 + 1 * .53) / n);
    const c = e <= 0 && nuoc ? [92, 134, 158] : tint(e), k = .55 + .6 * sh;
    d[i * 4] = Math.min(255, c[0] * k); d[i * 4 + 1] = Math.min(255, c[1] * k); d[i * 4 + 2] = Math.min(255, c[2] * k); d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  /* lớp nước & đường từ OpenStreetMap */
  const WATER = '#3f6f8e';
  const stroke = (lines, col, w, close) => { g.strokeStyle = col; g.lineWidth = w; g.lineJoin = g.lineCap = 'round'; lines.forEach(l => { if (l.length < 2) return; g.beginPath(); l.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); if (close) g.closePath(); g.stroke(); }); };
  geom.filter(o => o.kind === 'ho').forEach(o => { g.fillStyle = WATER; o.lines.forEach(l => { if (l.length < 3) return; g.beginPath(); l.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.fill(); }); });
  geom.filter(o => o.kind === 'suoi').forEach(o => stroke(o.lines, 'rgba(63,111,142,.7)', 1.6));
  geom.filter(o => o.kind === 'song').forEach(o => stroke(o.lines, WATER, 4.5));
  geom.filter(o => o.kind === 'bien').forEach(o => stroke(o.lines, '#2f5874', 3));
  geom.filter(o => o.kind === 'duong').forEach(o => stroke(o.lines, 'rgba(120,96,70,.55)', 2.2));
  /* SÔNG TỪ ĐỊA HÌNH (khi không có OSM): lấp chỗ trũng → hướng chảy D8 → dòng chảy tích lũy → vẽ chỗ gom nước lớn */
  if (songDH) {
    const f = 2, gw2 = Math.ceil(W / f), gh2 = Math.ceil(H / f), N = gw2 * gh2, Z2 = new Float32Array(N);
    for (let y = 0; y < gh2; y++) for (let x = 0; x < gw2; x++) Z2[y * gw2 + x] = E[Math.min(H - 1, y * f) * W + Math.min(W - 1, x * f)];
    const done = new Uint8Array(N), hp = [], hpush = (z, i) => { hp.push([z, i]); let k = hp.length - 1; while (k) { const p = (k - 1) >> 1; if (hp[p][0] <= hp[k][0]) break; [hp[p], hp[k]] = [hp[k], hp[p]]; k = p; } },
      hpop = () => { const t = hp[0], l = hp.pop(); if (hp.length) { hp[0] = l; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < hp.length && hp[a][0] < hp[m][0]) m = a; if (b < hp.length && hp[b][0] < hp[m][0]) m = b; if (m === k) break; [hp[m], hp[k]] = [hp[k], hp[m]]; k = m; } } return t; };
    const order = new Int32Array(N); let oi = 0, eps = 1e-3;
    for (let x = 0; x < gw2; x++) for (const y of [0, gh2 - 1]) { const i = y * gw2 + x; if (!done[i]) { done[i] = 1; hpush(Z2[i], i); } }
    for (let y = 0; y < gh2; y++) for (const x of [0, gw2 - 1]) { const i = y * gw2 + x; if (!done[i]) { done[i] = 1; hpush(Z2[i], i); } }
    const DD = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], down = new Int32Array(N).fill(-1);
    while (hp.length) { const [z, i] = hpop(); order[oi++] = i; const x = i % gw2, y = (i - x) / gw2;
      for (const [dx, dy] of DD) { const nx2 = x + dx, ny2 = y + dy; if (nx2 < 0 || ny2 < 0 || nx2 >= gw2 || ny2 >= gh2) continue; const j = ny2 * gw2 + nx2; if (done[j]) continue; done[j] = 1; if (Z2[j] <= z) Z2[j] = z + eps; down[j] = i; hpush(Z2[j], j); } }
    const acc = new Float32Array(N).fill(1); for (let k = N - 1; k >= 0; k--) { const i = order[k]; if (down[i] >= 0) acc[down[i]] += acc[i]; }
    const thr = N * nguong; g.lineCap = 'round';
    for (let i = 0; i < N; i++) { if (acc[i] < thr || down[i] < 0) continue; const j = down[i], w = Math.min(7, 1.2 + Math.log2(acc[i] / thr) * 1.15);
      g.strokeStyle = WATER; g.lineWidth = w; g.beginPath(); g.moveTo((i % gw2) * f + 1, Math.floor(i / gw2) * f + 1); g.lineTo((j % gw2) * f + 1, Math.floor(j / gw2) * f + 1); g.stroke(); }
  }
  // lưới nước: điểm ảnh gần sông/hồ (để dò tuyến tránh vượt sông)
  const wc = new OffscreenCanvas(W, H), wg = wc.getContext('2d'); wg.drawImage(cv, 0, 0);
  /* tên sông (mỗi sông 1 lần, chỗ dài nhất) */
  g.font = 'italic 600 26px Georgia, serif'; g.fillStyle = '#1f4560'; g.strokeStyle = 'rgba(235,240,232,.8)'; g.lineWidth = 5;
  const daGhi = new Set();
  geom.filter(o => o.kind === 'song' && o.name).forEach(o => { if (daGhi.has(o.name)) return; const l = o.lines.sort((a, b) => b.length - a.length)[0]; if (!l || l.length < 20) return; const [x, y] = l[l.length >> 1]; if (x < 40 || y < 40 || x > W - 200 || y > H - 40) return; daGhi.add(o.name); g.strokeText(o.name, x + 8, y - 8); g.fillText(o.name, x + 8, y - 8); });
  /* viền tối (vignette) cho chất phim tài liệu */
  const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(15,10,5,.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  /* địa danh lịch sử */
  diaDanh.forEach(dd => { const [x, y] = dd.p; g.fillStyle = dd.loai === 'thanh' ? '#7a1f1a' : '#2b2118'; g.beginPath(); if (dd.loai === 'thanh') g.rect(x - 9, y - 9, 18, 18); else g.arc(x, y, 8, 0, 7); g.fill(); g.strokeStyle = '#f4ead3'; g.lineWidth = 3; g.stroke(); });
  const nen3d = cv.toDataURL('image/jpeg', .92);   // nền cho bản đồ 3D: không chữ địa danh (nhãn nổi thay)
  diaDanh.forEach(dd => { const [x, y] = dd.p;
    g.font = '700 30px "Be Vietnam Pro", Arial, sans-serif'; g.lineWidth = 7; g.strokeStyle = 'rgba(244,234,211,.92)'; g.fillStyle = '#2b2118'; const tx = x + (dd.trai ? -16 - g.measureText(dd.ten).width : 16); g.strokeText(dd.ten, tx, y + 10); g.fillText(dd.ten, tx, y + 10); });
  const nen = cv.toDataURL('image/jpeg', .92);

  /* ---------- DÒ TUYẾN: đường ít tốn sức nhất trên lưới thô (dốc + vượt sông) ---------- */
  const F = 4, gw = Math.ceil(W / F), gh = Math.ceil(H / F), cost = new Float32Array(gw * gh);
  const wd = wg.getImageData(0, 0, W, H).data, isWater = (x, y) => { const i = (y * W + x) * 4; return Math.abs(wd[i] - 63) < 18 && Math.abs(wd[i + 1] - 111) < 18 && Math.abs(wd[i + 2] - 142) < 18; };
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const X = Math.min(W - 2, x * F), Y = Math.min(H - 2, y * F), e = E[Y * W + X];
    const sl = Math.hypot(E[Y * W + Math.min(W - 1, X + F)] - e, E[Math.min(H - 1, Y + F) * W + X] - e) / (F * mpp);   // độ dốc (m/m)
    cost[y * gw + x] = 1 + sl * 14 + (e > 400 ? (e - 400) / 150 : 0) + (isWater(X, Y) || e <= 0 ? 25 : 0);
  }
  function astar(a, b, thuy) {
    const sx = Math.round(a[0] / F), sy = Math.round(a[1] / F), ex = Math.round(b[0] / F), ey = Math.round(b[1] / F), N = gw * gh;
    const gS = new Float32Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), open = [[0, sy * gw + sx]]; gS[sy * gw + sx] = 0;
    const push = (f, i) => { open.push([f, i]); let k = open.length - 1; while (k > 0) { const p = (k - 1) >> 1; if (open[p][0] <= open[k][0]) break; [open[p], open[k]] = [open[k], open[p]]; k = p; } };
    const pop = () => { const top = open[0], last = open.pop(); if (open.length) { open[0] = last; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < open.length && open[l][0] < open[m][0]) m = l; if (r < open.length && open[r][0] < open[m][0]) m = r; if (m === k) break; [open[m], open[k]] = [open[k], open[m]]; k = m; } } return top; };
    const goal = ey * gw + ex, D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    while (open.length) {
      const [, cur] = pop(); if (cur === goal) break; const cx = cur % gw, cy = (cur - cx) / gw;
      for (const [dx, dy, dl] of D) { const nx2 = cx + dx, ny2 = cy + dy; if (nx2 < 0 || ny2 < 0 || nx2 >= gw || ny2 >= gh) continue; const ni = ny2 * gw + nx2;
        const c = thuy ? (cost[ni] >= 25 ? 1 : 6) : cost[ni], ng = gS[cur] + dl * c;
        if (ng < gS[ni]) { gS[ni] = ng; came[ni] = cur; push(ng + Math.hypot(nx2 - ex, ny2 - ey), ni); } }
    }
    const pts = []; for (let i = goal; i >= 0; i = came[i]) { pts.push([(i % gw) * F, Math.floor(i / gw) * F]); if (i === sy * gw + sx) break; }
    return pts.reverse();
  }
  const smooth = p => p.map((q, i) => { if (i === 0 || i === p.length - 1) return q; let sx = 0, sy = 0, n = 0; for (let k = -3; k <= 3; k++) { const r = p[Math.max(0, Math.min(p.length - 1, i + k))]; sx += r[0]; sy += r[1]; n++; } return [sx / n, sy / n]; });
  const tuyen = tuyenIn.map(t => { let all = []; for (let k = 0; k + 1 < t.P.length; k++) { const seg = t.cachDi === 'thang' ? [t.P[k], t.P[k + 1]] : astar(t.P[k], t.P[k + 1], t.cachDi === 'thuy'); all = all.concat(k ? seg.slice(1) : seg); } return { ...t, xy: smooth(all).filter((_, i, a) => i % 2 === 0 || i === a.length - 1) }; });
  /* ảnh xem trước: nền + tuyến */
  const col = { ta: '#c8352b', dich: '#1f4f86' };
  tuyen.forEach(t => { g.strokeStyle = col[t.ben] || '#333'; g.lineWidth = 9; g.setLineDash(t.ben === 'dich' ? [26, 14] : []); g.lineCap = g.lineJoin = 'round'; g.beginPath(); t.xy.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]);
    const [x1, y1] = t.xy[t.xy.length - 1], [x0, y0] = t.xy[Math.max(0, t.xy.length - 6)], an = Math.atan2(y1 - y0, x1 - x0); g.fillStyle = col[t.ben] || '#333'; g.beginPath(); g.moveTo(x1 + Math.cos(an) * 26, y1 + Math.sin(an) * 26); g.lineTo(x1 + Math.cos(an + 2.5) * 24, y1 + Math.sin(an + 2.5) * 24); g.lineTo(x1 + Math.cos(an - 2.5) * 24, y1 + Math.sin(an - 2.5) * 24); g.fill(); });
  return { nen, nen3d, xem: cv.toDataURL('image/jpeg', .9), tuyen: tuyen.map(t => ({ ten: t.ten, ben: t.ben, cachDi: t.cachDi || 'bo', xy: t.xy.map(([x, y]) => [Math.round(x), Math.round(y)]) })), emax: Math.round(emax), emin: Math.round(emin), docao };
}, { songDH: !geom.some(g => g.kind === 'song'), nguong: R.nguong_song || 0.0035, tiles, tx0, ty0, PX0, PY0, SX, SY, W, H, geom, diaDanh, tuyenIn, nuoc: !!R.bien_nuoc, mpp: 40075016 * Math.cos((nam + bac) / 2 * Math.PI / 180) / (256 * 2 ** Z * SX) });
await browser.close();

const save = (f, durl) => fs.writeFileSync(path.join(DIR, f), Buffer.from(durl.split(',')[1], 'base64'));
save('nen-2k.jpg', out.nen); save('nen-3d.jpg', out.nen3d); save('xem-truoc.jpg', out.xem); save('do-cao.png', out.docao);
// tuyến: tọa độ ảnh 2560×1440 + kinh/vĩ độ (để dùng lại ở mọi khung hình)
const unproj = ([x, y]) => [+x2lon(x / SX + PX0, Z).toFixed(5), +y2lat(y / SY + PY0, Z).toFixed(5)];
fs.writeFileSync(path.join(DIR, 'tuyen.json'), JSON.stringify({ id, ten: R.ten, khung: { rong: W, cao: H, tay, dong, nam, bac, zoom: Z, do_cao: { file: 'do-cao.png', thap: out.emin, cao: out.emax, met_moi_diem: +(40075016 * Math.cos((nam + bac) / 2 * Math.PI / 180) / (256 * 2 ** Z * SX)).toFixed(2) } },
  dia_danh: diaDanh.map(d => ({ ten: d.ten, loai: d.loai || '', xy: d.p.map(Math.round), lonlat: [d.lon, d.lat] })),
  nguon: '© OpenStreetMap contributors (ODbL); địa hình: Terrain Tiles trên AWS (SRTM, GMTED, ETOPO1…)',
  tuyen: out.tuyen.map(t => ({ ...t, lonlat: t.xy.map(unproj) })) }, null, 1));
console.log(`  ✔ maps/${id}/nen-2k.jpg · xem-truoc.jpg · tuyen.json (${out.tuyen.length} tuyến; đỉnh cao nhất ${out.emax} m)`);
