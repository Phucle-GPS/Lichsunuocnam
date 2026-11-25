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
/* CHẾ ĐỘ BẢN ĐỒ CỔ (che_do: "co"): KHÔNG dùng OpenStreetMap (toàn đối tượng hiện đại: hồ chứa, kênh đào, bờ biển ngày nay).
   Thay bằng: song_xua (sông thời đó, khai báo tay, hút về đáy thung lũng), muc_nuoc_co + bien_tai (bờ biển xưa: dâng nước
   loang từ phía biển), ho_xua (hồ thời đó). Nền vẽ kiểu bản đồ cổ (giấy, mực). */
const CO = R.che_do === 'co' || args.includes('--co');
let osm = { elements: [] };
if (!CO && !args.includes('--khong-osm')) {
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
const COX = CO ? { muc: R.muc_nuoc_co ?? null, bienTai: (R.bien_tai || []).map(proj), song: (R.song_xua || []).map(s => ({ ten: s.ten || '', rong: s.rong_m || 300, nhan: s.nhan !== false, hut: s.hut_thung_lung ?? 2500, P: s.diem.map(proj) })),
  ho: (R.ho_xua || []).map(h => ({ ten: h.ten || '', P: h.diem.map(proj) })), cuLao: (R.cu_lao || []).map(h => ({ ten: h.ten || '', P: h.diem.map(proj) })), suoi: R.suoi_dia_hinh !== false } : null;
const browser = await chromium.launch({ args: ['--js-flags=--max-old-space-size=6144'] }), page = await browser.newPage({ viewport: { width: 400, height: 300 } });
page.on('console', m => { if (m.text().startsWith('·')) console.log('  ' + m.text()); });   // tiến độ từng bước
page.on('crash', () => { console.log('✖ Trình duyệt dựng nền bị sập (thiếu bộ nhớ?)'); process.exit(1); });
await page.setContent('<canvas id="c"></canvas>');
const out = await page.evaluate(async ({ songDH, nguong, tiles, tx0, ty0, PX0, PY0, SX, SY, W, H, geom, diaDanh, tuyenIn, nuoc, mpp, COX }) => {
  /* độ cao toàn vùng ở độ phân giải ảnh */
  const nx = (Math.max(...tiles.map(t => t.x)) - tx0 + 1) * 256, ny = (Math.max(...tiles.map(t => t.y)) - ty0 + 1) * 256;
  const big = new OffscreenCanvas(nx, ny), bg = big.getContext('2d');
  for (const t of tiles) { const im = await createImageBitmap(await (await fetch('data:image/png;base64,' + t.b64)).blob()); bg.drawImage(im, (t.x - tx0) * 256, (t.y - ty0) * 256); }
  const px = bg.getImageData(0, 0, nx, ny).data, ox = PX0 - tx0 * 256, oy = PY0 - ty0 * 256;
  const elevAt = (X, Y) => { const i = (Math.max(0, Math.min(ny - 1, Y | 0)) * nx + Math.max(0, Math.min(nx - 1, X | 0))) * 4; return px[i] * 256 + px[i + 1] + px[i + 2] / 256 - 32768; };
  const E = new Float32Array(W * H);
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) E[y * W + x] = elevAt(ox + x / SX, oy + y / SY);
  /* lọc gai: dữ liệu địa hình có điểm nhiễu (vd. 5000 m giữa đồng bằng) → điểm lệch > 120 m so với trung bình 8 điểm quanh nó thì thay bằng trung bình */
  { let gai = 0; const C = E.slice(); for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; let s = 0; for (const d of [-W - 1, -W, -W + 1, -1, 1, W - 1, W, W + 1]) s += C[i + d]; s /= 8; if (Math.abs(C[i] - s) > 120) { E[i] = s; gai++; } }
    for (let i = 0; i < W * H; i++) if (!(E[i] > -11000 && E[i] < 9000)) { E[i] = 0; gai++; } console.log(`· lọc ${gai} điểm gai địa hình`); }
  const T0 = performance.now(), moc = s => console.log(`· ${s} (${((performance.now() - T0) / 1000).toFixed(1)} s)`); moc('đã đọc độ cao');
  /* ===== BẢN ĐỒ CỔ: vùng nước thời xưa (mask) + hạ phẳng mặt nước ===== */
  let MASK = null, KIEM = null, songVe = []; const R_BO = 7;
  if (COX) {
    MASK = new Uint8Array(W * H); KIEM = { song: [] };
    // 1. sông xưa: hút từng điểm về chỗ thấp nhất trong bán kính (đáy thung lũng) → nội suy Catmull-Rom → làm mượt
    const thap = (x, y, r) => { let bx = x, by = y, be = Infinity; for (let dy = -r; dy <= r; dy += 2) for (let dx = -r; dx <= r; dx += 2) { if (dx * dx + dy * dy > r * r) continue; const X = Math.round(x + dx), Y = Math.round(y + dy); if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const e = E[Y * W + X] + Math.hypot(dx, dy) * .02; if (e < be) { be = e; bx = X; by = Y; } } return [bx, by]; };
    const cr = (P, n = 10) => { const o = []; for (let i = 0; i < P.length - 1; i++) { const p0 = P[Math.max(0, i - 1)], p1 = P[i], p2 = P[i + 1], p3 = P[Math.min(P.length - 1, i + 2)];
      for (let k = 0; k < n; k++) { const t = k / n, t2 = t * t, t3 = t2 * t; o.push([0, 1].map(j => .5 * (2 * p1[j] + (-p0[j] + p2[j]) * t + (2 * p0[j] - 5 * p1[j] + 4 * p2[j] - p3[j]) * t2 + (-p0[j] + 3 * p1[j] - 3 * p2[j] + p3[j]) * t3))); } } o.push(P[P.length - 1]); return o; };
    const muot = (P, w = 4) => P.map((q, i) => { if (!i || i === P.length - 1) return q; let sx = 0, sy = 0, n = 0; for (let k = -w; k <= w; k++) { const r = P[Math.max(0, Math.min(P.length - 1, i + k))]; sx += r[0]; sy += r[1]; n++; } return [sx / n, sy / n]; });
    const eAt = (x, y) => E[Math.max(0, Math.min(H - 1, Math.round(y))) * W + Math.max(0, Math.min(W - 1, Math.round(x)))];
    /* dòng sông giữa 2 điểm = đường men đáy thung lũng: A* trên lưới 2 px, phí mỗi ô = 1 + (độ cao − mức thấp hơn của 2 đầu)/2 m
       → đường tự bám lòng chảo như nước chảy thật, không vắt qua đồi. Chỉ xét hộp bao quanh 2 điểm (+ lề) cho nhanh. */
    const thungLung = (a, b) => { const f = 2, le = 160, x0 = Math.max(0, Math.min(a[0], b[0]) - le), y0 = Math.max(0, Math.min(a[1], b[1]) - le), x1 = Math.min(W - 1, Math.max(a[0], b[0]) + le), y1 = Math.min(H - 1, Math.max(a[1], b[1]) + le);
      const gw = Math.floor((x1 - x0) / f) + 1, gh = Math.floor((y1 - y0) / f) + 1, N = gw * gh, nen = Math.min(eAt(a[0], a[1]), eAt(b[0], b[1]));
      const c = new Float32Array(N); for (let j = 0; j < gh; j++) for (let i = 0; i < gw; i++) c[j * gw + i] = 1 + Math.max(0, E[(y0 + j * f) * W + x0 + i * f] - nen) / 2;
      const id = (x, y) => Math.max(0, Math.min(gh - 1, Math.round((y - y0) / f))) * gw + Math.max(0, Math.min(gw - 1, Math.round((x - x0) / f))), s0 = id(a[0], a[1]), s1 = id(b[0], b[1]), ex = s1 % gw, ey = (s1 - ex) / gw;
      const gS = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), chot = new Uint8Array(N), CAP = N * 8 + 8, hk = new Float64Array(CAP), hv = new Int32Array(CAP); let hn = 0;
      const push = (k2, v) => { if (hn >= CAP) return; let k = hn++; hk[k] = k2; hv[k] = v; while (k) { const p = (k - 1) >> 1; if (hk[p] <= hk[k]) break; [hk[p], hk[k]] = [hk[k], hk[p]]; [hv[p], hv[k]] = [hv[k], hv[p]]; k = p; } };
      const pop = () => { const t = hv[0]; hn--; if (hn) { hk[0] = hk[hn]; hv[0] = hv[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hk[l] < hk[m]) m = l; if (r < hn && hk[r] < hk[m]) m = r; if (m === k) break; [hk[m], hk[k]] = [hk[k], hk[m]]; [hv[m], hv[k]] = [hv[k], hv[m]]; k = m; } } return t; };
      gS[s0] = 0; push(0, s0);
      while (hn) { const u = pop(); if (chot[u]) continue; chot[u] = 1; if (u === s1) break; const ux = u % gw, uy = (u - ux) / gw;
        for (const [dx, dy, dl] of [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]]) { const X = ux + dx, Y = uy + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; const v = Y * gw + X; if (chot[v]) continue;
          const ng = gS[u] + dl * c[v]; if (ng < gS[v]) { gS[v] = ng; came[v] = u; push(ng + Math.hypot(X - ex, Y - ey), v); } } }
      const o = []; for (let v = s1, n = 0; v >= 0 && n <= N; v = came[v], n++) { o.push([x0 + (v % gw) * f, y0 + Math.floor(v / gw) * f]); if (v === s0) break; }
      return o.length > 1 ? o.reverse() : [a, b]; };
    COX.song.forEach(s => { const r = Math.max(2, Math.round(s.hut / mpp)); let P = s.P.map(([x, y]) => s.hut ? thap(x, y, r) : [x, y]);
      if (s.hut) { let all = []; for (let k = 0; k + 1 < P.length; k++) { const seg = thungLung(P[k], P[k + 1]); all = all.concat(k ? seg.slice(1) : seg); } P = muot(muot(all, 3), 3); }
      else P = muot(muot(cr(P)));
      /* nước không chảy ngược dốc: đi xuôi dòng (điểm đầu = thượng nguồn), độ "vọt" = độ cao hiện tại − thấp nhất đã qua.
         Vọt lớn = lòng sông vắt qua đồi/núi → điểm sông khai báo sai. (bỏ 5% đầu/cuối: điểm có thể nằm ngoài khung) */
      const ev0 = P.map(([x, y]) => eAt(x, y)), ev = ev0.map((_, i) => { const w = ev0.slice(Math.max(0, i - 6), i + 7).sort((p, q) => p - q); return w[w.length >> 1]; }), a0 = Math.floor(P.length * .05), a1 = Math.ceil(P.length * .95); let mn = Infinity, vot = 0, iv = -1;
      for (let i = a0; i < a1; i++) { const p = P[i]; if (p[0] < 0 || p[1] < 0 || p[0] >= W || p[1] >= H) continue; mn = Math.min(mn, ev[i]); if (ev[i] - mn > vot) { vot = ev[i] - mn; iv = i; } }
      const ec = ev.slice().sort((a, b) => a - b);
      KIEM.song.push({ ten: s.ten, trung_vi: Math.round(ec[ec.length >> 1]), vot: Math.round(vot), cho_vot: iv >= 0 ? P[iv].map(Math.round) : null, rong_px: +(s.rong / mpp).toFixed(1) });
      songVe.push({ ...s, P, w: Math.max(5, s.rong / mpp) }); });
    // 2. vẽ sông + hồ vào mặt nạ
    const mc = new OffscreenCanvas(W, H), mg = mc.getContext('2d'); mg.fillStyle = '#fff'; mg.strokeStyle = '#fff'; mg.lineCap = mg.lineJoin = 'round';
    songVe.forEach(s => { mg.lineWidth = Math.max(6, s.w); mg.beginPath(); s.P.forEach(([x, y], k) => k ? mg.lineTo(x, y) : mg.moveTo(x, y)); mg.stroke(); });
    COX.ho.forEach(h => { mg.beginPath(); cr(h.P.concat([h.P[0]]), 8).forEach(([x, y], k) => k ? mg.lineTo(x, y) : mg.moveTo(x, y)); mg.closePath(); mg.fill(); });
    mg.fillStyle = '#000'; COX.cuLao.forEach(h => { mg.beginPath(); cr(h.P.concat([h.P[0]]), 8).forEach(([x, y], k) => k ? mg.lineTo(x, y) : mg.moveTo(x, y)); mg.closePath(); mg.fill(); });   // cù lao: đất nổi giữa sông
    const md = mg.getImageData(0, 0, W, H).data; for (let i = 0; i < W * H; i++) if (md[i * 4] > 127) MASK[i] = 1;
    // 3. biển xưa: loang từ các điểm "bien_tai" qua mọi điểm thấp hơn mực nước cổ (vùng trũng kín trong nội địa KHÔNG bị ngập)
    if (COX.bienTai.length && COX.muc != null) { const st = []; COX.bienTai.forEach(([x, y]) => { const i = Math.round(y) * W + Math.round(x); if (E[i] <= COX.muc) st.push(i); });
      const seen = new Uint8Array(W * H); st.forEach(i => seen[i] = 1);
      while (st.length) { const i = st.pop(); MASK[i] = 2; const x = i % W, y = (i - x) / W;
        for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < 0 || Y < 0 || X >= W || Y >= H) continue; const j = Y * W + X; if (seen[j] || E[j] > COX.muc) continue; seen[j] = 1; st.push(j); } }
      /* làm trơn đường bờ biển xưa: làm mờ hộp 2 lượt (bán kính ~7 px) rồi lấy ngưỡng → bỏ đảo vụn, vũng vụn của bãi triều */
      const r = R_BO, tmp = new Float32Array(W * H), A = new Float32Array(W * H); for (let i = 0; i < W * H; i++) A[i] = MASK[i] === 2 ? 1 : 0;
      for (let lan = 0; lan < 2; lan++) {
        for (let y = 0; y < H; y++) { let s = 0; const o = y * W; for (let x = -r; x <= r; x++) s += A[o + Math.max(0, Math.min(W - 1, x))]; for (let x = 0; x < W; x++) { tmp[o + x] = s / (2 * r + 1); s += A[o + Math.min(W - 1, x + r + 1)] - A[o + Math.max(0, x - r)]; } }
        for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.max(0, Math.min(H - 1, y)) * W + x]; for (let y = 0; y < H; y++) { A[y * W + x] = s / (2 * r + 1); s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } }
      }
      for (let i = 0; i < W * H; i++) { if (A[i] >= .5) MASK[i] = MASK[i] || 2; else if (MASK[i] === 2) MASK[i] = 0; }
      KIEM.bien_px = MASK.reduce((a, v) => a + (v === 2), 0); }
    // 3b. làm sạch toàn bộ mặt nạ (đóng + mở hình thái học bằng làm mờ hộp r=3 hai lượt, ngưỡng 0,5):
    //     bỏ chấm đất vụn giữa nước và vũng nước vụn trên đất → mặt nạ nước, bản đồ độ cao, kiểm thủy cùng một định nghĩa
    { const r = 3, A = new Float32Array(W * H), tmp = new Float32Array(W * H); for (let i = 0; i < W * H; i++) A[i] = MASK[i] ? 1 : 0;
      for (let lan = 0; lan < 2; lan++) {
        for (let y = 0; y < H; y++) { let s = 0; const o = y * W; for (let x = -r; x <= r; x++) s += A[o + Math.max(0, Math.min(W - 1, x))]; for (let x = 0; x < W; x++) { tmp[o + x] = s / (2 * r + 1); s += A[o + Math.min(W - 1, x + r + 1)] - A[o + Math.max(0, x - r)]; } }
        for (let x = 0; x < W; x++) { let s = 0; for (let y = -r; y <= r; y++) s += tmp[Math.max(0, Math.min(H - 1, y)) * W + x]; for (let y = 0; y < H; y++) { A[y * W + x] = s / (2 * r + 1); s += tmp[Math.min(H - 1, y + r + 1) * W + x] - tmp[Math.max(0, y - r) * W + x]; } } }
      let doi = 0; for (let i = 0; i < W * H; i++) { const w = A[i] >= .5; if (w && !MASK[i]) { MASK[i] = 1; doi++; } else if (!w && MASK[i]) { MASK[i] = 0; doi++; } } KIEM.lam_sach_px = doi; }
    // 4. hạ phẳng: mặt nước = 0 m, đất liền ≥ 2 m (mô hình 3D: nước phẳng, thuyền nằm đúng trên nước)
    for (let i = 0; i < W * H; i++) E[i] = MASK[i] ? 0 : Math.max(2, E[i]);
    moc('sông, hồ, biển xưa');
  }
  let emax = 0, emin = 1e9; for (const e of E) { if (e > emax) emax = e; if (e < emin) emin = e; }
  /* bản đồ độ cao 1024×576 (xám 8 bit, 0 = thấp nhất, 255 = cao nhất) để dựng địa hình 3D nổi khối */
  const hw = 1024, hh = 576, hc = new OffscreenCanvas(hw, hh), hg = hc.getContext('2d'), hd = hg.createImageData(hw, hh);
  /* bản đồ cổ: điểm độ cao nào có nước trong khối 3×3 quanh nó → coi là mặt nước (mỏm đất lẻ 1 điểm không chặn thuyền) */
  const eHM = (X, Y) => { const e = E[Y * W + X]; if (!MASK) return e; for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) { const xx = Math.max(0, Math.min(W - 1, X + dx)), yy = Math.max(0, Math.min(H - 1, Y + dy)); if (MASK[yy * W + xx]) return 0; } return e; };
  for (let y = 0; y < hh; y++) for (let x = 0; x < hw; x++) { const v = Math.round((eHM(Math.floor(x * W / hw), Math.floor(y * H / hh)) - emin) / Math.max(1, emax - emin) * 255); const i = (y * hw + x) * 4; hd.data[i] = hd.data[i + 1] = hd.data[i + 2] = v; hd.data[i + 3] = 255; }
  hg.putImageData(hd, 0, 0); const hb = await hc.convertToBlob({ type: 'image/png' }), docao = await new Promise(r => { const fr = new FileReader(); fr.onload = () => r(fr.result); fr.readAsDataURL(hb); });
  /* màu theo độ cao + đổ bóng núi (nguồn sáng tây bắc) */
  const cv = document.getElementById('c'); cv.width = W; cv.height = H; const g = cv.getContext('2d'), img = g.createImageData(W, H), d = img.data;
  const ramp = [[-50, [70, 110, 140]], [0, [96, 138, 160]], [1, [142, 158, 118]], [60, [158, 168, 120]], [200, [172, 164, 118]], [500, [160, 138, 100]], [900, [140, 116, 90]], [1500, [170, 160, 150]], [2500, [225, 222, 215]]];
  const tint = e => { for (let i = 1; i < ramp.length; i++) if (e < ramp[i][0]) { const [a, ca] = ramp[i - 1], [b, cb] = ramp[i], k = (e - a) / (b - a); return ca.map((c, j) => c + (cb[j] - c) * k); } return ramp[ramp.length - 1][1]; };
  const rampCo = [[0, [232, 220, 188]], [40, [226, 212, 176]], [150, [214, 194, 152]], [400, [196, 170, 128]], [800, [176, 148, 108]], [1500, [160, 138, 106]], [2500, [205, 196, 180]]];
  const tintCo = e => { for (let i = 1; i < rampCo.length; i++) if (e < rampCo[i][0]) { const [a, ca] = rampCo[i - 1], [b, cb] = rampCo[i], k = (e - a) / (b - a); return ca.map((c, j) => c + (cb[j] - c) * k); } return rampCo[rampCo.length - 1][1]; };
  const zf = 2.2;   // phóng đại độ dốc cho đổ bóng rõ
  for (let y = 0; y < H; y++) for (let x = 0; x < W; x++) {
    const i = y * W + x, e = E[i], ex = E[y * W + Math.min(W - 1, x + 1)] - E[y * W + Math.max(0, x - 1)], ey = E[Math.min(H - 1, y + 1) * W + x] - E[Math.max(0, y - 1) * W + x];
    const sx = -ex * zf / (2 * mpp), sy = -ey * zf / (2 * mpp), n = Math.hypot(sx, sy, 1), sh = Math.max(0, (sx * -.6 + sy * -.6 + 1 * .53) / n);
    if (COX) {   // bản đồ cổ: giấy dó, núi tô mực nâu nhạt, nước xanh xám; hạt giấy cố định theo tọa độ
      const hat = (((x * 73856093) ^ (y * 19349663)) >>> 0) % 13 - 6;
      if (MASK[i]) { d[i * 4] = 150 + hat * .5; d[i * 4 + 1] = 172 + hat * .5; d[i * 4 + 2] = 168 + hat * .5; }
      else { const c = tintCo(e), k = .66 + .46 * sh; d[i * 4] = Math.min(255, c[0] * k + hat); d[i * 4 + 1] = Math.min(255, c[1] * k + hat); d[i * 4 + 2] = Math.min(255, c[2] * k + hat * .8); }
      d[i * 4 + 3] = 255; continue;
    }
    const c = e <= 0 && nuoc ? [92, 134, 158] : tint(e), k = .55 + .6 * sh;
    d[i * 4] = Math.min(255, c[0] * k); d[i * 4 + 1] = Math.min(255, c[1] * k); d[i * 4 + 2] = Math.min(255, c[2] * k); d[i * 4 + 3] = 255;
  }
  g.putImageData(img, 0, 0);
  moc('tô màu + đổ bóng');
  if (COX) {
    /* đường bờ nét mực + các nét sóng song song bờ (lối vẽ bản đồ xưa) */
    const lc = new OffscreenCanvas(W, H), lg = lc.getContext('2d'), li = lg.createImageData(W, H); for (let i = 0; i < W * H; i++) { const v = MASK[i] ? 0 : 255; li.data[i * 4] = li.data[i * 4 + 1] = li.data[i * 4 + 2] = v; li.data[i * 4 + 3] = 255; } lg.putImageData(li, 0, 0);
    const bc = new OffscreenCanvas(W, H), bgx = bc.getContext('2d'); bgx.filter = 'blur(7px)'; bgx.drawImage(lc, 0, 0); const bl = bgx.getImageData(0, 0, W, H).data;
    const im2 = g.getImageData(0, 0, W, H), d2 = im2.data;
    for (let y = 1; y < H - 1; y++) for (let x = 1; x < W - 1; x++) { const i = y * W + x; if (!MASK[i]) continue;
      const bo = !MASK[i - 1] || !MASK[i + 1] || !MASK[i - W] || !MASK[i + W], v = bl[i * 4];   // v: mức "gần bờ" (0 xa bờ … 255 sát bờ)
      if (bo) { d2[i * 4] = 72; d2[i * 4 + 1] = 82; d2[i * 4 + 2] = 84; }
      else if (MASK[i] === 2 && ((v > 52 && v < 60) || (v > 18 && v < 23))) { d2[i * 4] -= 26; d2[i * 4 + 1] -= 22; d2[i * 4 + 2] -= 18; } }
    g.putImageData(im2, 0, 0); moc('đường bờ');
    /* suối nhỏ theo địa hình: nét mực mảnh, nhạt (dòng chảy tự nhiên – không phải công trình hiện đại) */
    if (COX.suoi) {
      const f = 4, gw2 = Math.ceil(W / f), gh2 = Math.ceil(H / f), N = gw2 * gh2, Z2 = new Float32Array(N);
      for (let y = 0; y < gh2; y++) for (let x = 0; x < gw2; x++) Z2[y * gw2 + x] = E[Math.min(H - 1, y * f) * W + Math.min(W - 1, x * f)];
      const done = new Uint8Array(N), hp = [], hpush = (z, i) => { hp.push([z, i]); let k = hp.length - 1; while (k) { const p = (k - 1) >> 1; if (hp[p][0] <= hp[k][0]) break; [hp[p], hp[k]] = [hp[k], hp[p]]; k = p; } },
        hpop = () => { const t = hp[0], l = hp.pop(); if (hp.length) { hp[0] = l; let k = 0; for (;;) { const a = 2 * k + 1, b = a + 1; let m = k; if (a < hp.length && hp[a][0] < hp[m][0]) m = a; if (b < hp.length && hp[b][0] < hp[m][0]) m = b; if (m === k) break; [hp[m], hp[k]] = [hp[k], hp[m]]; k = m; } } return t; };
      const order = new Int32Array(N); let oi = 0;
      for (let i = 0; i < N; i++) { const x = i % gw2, y = (i - x) / gw2; if (x === 0 || y === 0 || x === gw2 - 1 || y === gh2 - 1 || MASK[Math.min(H - 1, y * f) * W + Math.min(W - 1, x * f)]) { done[i] = 1; hpush(Z2[i], i); } }   // nước & mép = cửa thoát
      const DD = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]], down = new Int32Array(N).fill(-1);
      while (hp.length) { const [z, i] = hpop(); order[oi++] = i; const x = i % gw2, y = (i - x) / gw2;
        for (const [dx, dy] of DD) { const nx2 = x + dx, ny2 = y + dy; if (nx2 < 0 || ny2 < 0 || nx2 >= gw2 || ny2 >= gh2) continue; const j = ny2 * gw2 + nx2; if (done[j]) continue; done[j] = 1; if (Z2[j] <= z) Z2[j] = z + 1e-3; down[j] = i; hpush(Z2[j], j); } }
      const acc = new Float32Array(N).fill(1); for (let k = N - 1; k >= 0; k--) { const i = order[k]; if (down[i] >= 0) acc[down[i]] += acc[i]; }
      const thr = N * (nguong * 1.6) / 2; g.lineCap = 'round';
      for (let i = 0; i < N; i++) { if (acc[i] < thr || down[i] < 0) continue; const j = down[i], x = (i % gw2) * f, y = Math.floor(i / gw2) * f; if (MASK[Math.min(H - 1, y) * W + Math.min(W - 1, x)]) continue;
        g.strokeStyle = 'rgba(96,112,110,.32)'; g.lineWidth = Math.min(2.6, .8 + Math.log2(acc[i] / thr) * .5); g.beginPath(); g.moveTo(x + 1, y + 1); g.lineTo((j % gw2) * f + 1, Math.floor(j / gw2) * f + 1); g.stroke(); }
    }
  }
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
  if (COX) {   // tên sông xưa: chữ nghiêng nét mực, xoay theo dòng chảy, đặt chỗ thẳng nhất ở giữa sông
    g.font = 'italic 700 30px "Times New Roman", "Noto Serif", serif';   // phông có đủ chữ Việt (Georgia thiếu dấu) g.fillStyle = '#3b4c50'; g.strokeStyle = 'rgba(236,226,198,.85)'; g.lineWidth = 6;
    songVe.filter(s => s.nhan && s.ten).forEach(s => { const P = s.P, n = P.length; let best = n >> 1, bs = -1;
      for (let i = Math.floor(n * .25); i < n * .75; i++) { const a = P[Math.max(0, i - 15)], b = P[Math.min(n - 1, i + 15)], st = Math.hypot(b[0] - a[0], b[1] - a[1]); if (st > bs && P[i][0] > 120 && P[i][0] < W - 220 && P[i][1] > 60 && P[i][1] < H - 60) { bs = st; best = i; } }
      const a = P[Math.max(0, best - 15)], b = P[Math.min(n - 1, best + 15)]; let an = Math.atan2(b[1] - a[1], b[0] - a[0]); if (an > Math.PI / 2) an -= Math.PI; if (an < -Math.PI / 2) an += Math.PI;
      g.save(); g.translate(P[best][0], P[best][1]); g.rotate(an); g.textAlign = 'center'; g.strokeText(s.ten, 0, -s.w / 2 - 10); g.fillText(s.ten, 0, -s.w / 2 - 10); g.restore(); });
  }
  /* địa danh lịch sử */
  diaDanh.forEach(dd => { const [x, y] = dd.p; g.fillStyle = dd.loai === 'thanh' ? '#7a1f1a' : '#2b2118'; g.beginPath(); if (dd.loai === 'thanh') g.rect(x - 9, y - 9, 18, 18); else g.arc(x, y, 8, 0, 7); g.fill(); g.strokeStyle = '#f4ead3'; g.lineWidth = 3; g.stroke(); });
  /* nền cho bản đồ 3D: KHÔNG viền tối (vùng bao ngoài lặp đối xứng ảnh này – viền tối sẽ thành vệt ranh) và không chữ địa danh (nhãn nổi thay) */
  const nen3d = cv.toDataURL('image/jpeg', .92);
  /* viền tối (vignette) chỉ cho ảnh 2D xem trước; bản đồ cổ: viền nâu giấy cũ */
  const vg = g.createRadialGradient(W / 2, H / 2, H * .35, W / 2, H / 2, H * .95); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, COX ? 'rgba(92,62,28,.42)' : 'rgba(15,10,5,.45)'); g.fillStyle = vg; g.fillRect(0, 0, W, H);
  diaDanh.forEach(dd => { const [x, y] = dd.p;
    g.font = '700 30px "Be Vietnam Pro", Arial, sans-serif'; g.lineWidth = 7; g.strokeStyle = 'rgba(244,234,211,.92)'; g.fillStyle = '#2b2118'; const tx = x + (dd.trai ? -16 - g.measureText(dd.ten).width : 16); g.strokeText(dd.ten, tx, y + 10); g.fillText(dd.ten, tx, y + 10); });
  const nen = cv.toDataURL('image/jpeg', .92);

  /* ---------- DÒ TUYẾN: đường ít tốn sức nhất trên lưới thô (dốc + vượt sông) ---------- */
  moc('vẽ nền xong, dò tuyến');
  const F = 4, gw = Math.ceil(W / F), gh = Math.ceil(H / F), cost = new Float32Array(gw * gh);
  const wd = wg.getImageData(0, 0, W, H).data, isWater = COX ? (x, y) => !!MASK[y * W + x] : (x, y) => { const i = (y * W + x) * 4; return Math.abs(wd[i] - 63) < 18 && Math.abs(wd[i + 1] - 111) < 18 && Math.abs(wd[i + 2] - 142) < 18; };
  for (let y = 0; y < gh; y++) for (let x = 0; x < gw; x++) {
    const X = Math.min(W - 2, x * F), Y = Math.min(H - 2, y * F), e = E[Y * W + X];
    const sl = Math.hypot(E[Y * W + Math.min(W - 1, X + F)] - e, E[Math.min(H - 1, Y + F) * W + X] - e) / (F * mpp);   // độ dốc (m/m)
    let nuocO = isWater(X, Y) || e <= 0; if (COX && !nuocO) for (let dy = 0; dy < F && !nuocO; dy++) for (let dx = 0; dx < F && !nuocO; dx++) nuocO = isWater(Math.min(W - 1, x * F + dx), Math.min(H - 1, y * F + dy));   // ô có nước (sông hẹp vẫn liền mạch)
    cost[y * gw + x] = 1 + sl * 14 + (e > 400 ? (e - 400) / 150 : 0) + (nuocO ? 25 : 0);
  }
  /* đầu/cuối tuyến thủy chưa nằm trên nước → kéo về ô nước gần nhất */
  const veNuoc = ([x, y]) => { const cx = Math.round(x / F), cy = Math.round(y / F); for (let r = 0; r < 60; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue; const X = cx + dx, Y = cy + dy; if (X < 0 || Y < 0 || X >= gw || Y >= gh) continue; if (cost[Y * gw + X] >= 25) return [X * F, Y * F]; } return [x, y]; };
  function astar(a, b, thuy) {
    if (thuy && COX) { a = veNuoc(a); b = veNuoc(b); }
    const cl = (v, m) => Math.max(0, Math.min(m - 1, v));
    const sx = cl(Math.round(a[0] / F), gw), sy = cl(Math.round(a[1] / F), gh), ex = cl(Math.round(b[0] / F), gw), ey = cl(Math.round(b[1] / F), gh), N = gw * gh, start = sy * gw + sx, goal = ey * gw + ex;
    /* A* trên mảng số cố định: hàng đợi nhị phân (khóa Float64 + chỉ số Int32), ô đã chốt không xét lại → bộ nhớ có giới hạn */
    const gS = new Float64Array(N).fill(Infinity), came = new Int32Array(N).fill(-1), chot = new Uint8Array(N), CAP = N * 8 + 16;
    const hk = new Float64Array(CAP), hv = new Int32Array(CAP); let hn = 0;
    const push = (f, i) => { if (hn >= CAP) return; let k = hn++; hk[k] = f; hv[k] = i; while (k > 0) { const p = (k - 1) >> 1; if (hk[p] <= hk[k]) break; const tf = hk[p], ti = hv[p]; hk[p] = hk[k]; hv[p] = hv[k]; hk[k] = tf; hv[k] = ti; k = p; } };
    const pop = () => { const top = hv[0]; hn--; if (hn > 0) { hk[0] = hk[hn]; hv[0] = hv[hn]; let k = 0; for (;;) { const l = 2 * k + 1, r = l + 1; let m = k; if (l < hn && hk[l] < hk[m]) m = l; if (r < hn && hk[r] < hk[m]) m = r; if (m === k) break; const tf = hk[m], ti = hv[m]; hk[m] = hk[k]; hv[m] = hv[k]; hk[k] = tf; hv[k] = ti; k = m; } } return top; };
    const D = [[1, 0, 1], [-1, 0, 1], [0, 1, 1], [0, -1, 1], [1, 1, 1.414], [1, -1, 1.414], [-1, 1, 1.414], [-1, -1, 1.414]];
    gS[start] = 0; push(0, start);
    while (hn > 0) {
      const cur = pop(); if (chot[cur]) continue; chot[cur] = 1; if (cur === goal) break; const cx = cur % gw, cy = (cur - cx) / gw;
      for (const [dx, dy, dl] of D) { const nx2 = cx + dx, ny2 = cy + dy; if (nx2 < 0 || ny2 < 0 || nx2 >= gw || ny2 >= gh) continue; const ni = ny2 * gw + nx2; if (chot[ni]) continue;
        const cc = cost[ni], c = thuy ? (cc >= 25 ? 1 : COX ? 500 : 6) : (cc > 0 ? cc : 1), ng = gS[cur] + dl * c;   // bản đồ cổ: thuyền gần như không thể lên cạn
        if (ng < gS[ni]) { gS[ni] = ng; came[ni] = cur; push(ng + Math.hypot(nx2 - ex, ny2 - ey), ni); } }
    }
    const pts = []; for (let i = goal, n = 0; i >= 0 && n <= N; i = came[i], n++) { pts.push([(i % gw) * F, Math.floor(i / gw) * F]); if (i === start) break; }
    if (pts.length < 2) return [a, b];   // không tới được: nối thẳng (bước kiểm chứng sẽ báo nếu thuyền lên cạn)
    return pts.reverse();
  }
  const smooth = p => p.map((q, i) => { if (i === 0 || i === p.length - 1) return q; let sx = 0, sy = 0, n = 0; for (let k = -3; k <= 3; k++) { const r = p[Math.max(0, Math.min(p.length - 1, i + k))]; sx += r[0]; sy += r[1]; n++; } return [sx / n, sy / n]; });
  moc('lưới chi phí');
  const tuyen = tuyenIn.map(t => { let all = []; for (let k = 0; k + 1 < t.P.length; k++) { const seg = t.cachDi === 'thang' ? [t.P[k], t.P[k + 1]] : astar(t.P[k], t.P[k + 1], t.cachDi === 'thuy'); moc(`tuyến "${t.ten}" đoạn ${k + 1}: ${seg.length} điểm`); all = all.concat(k ? seg.slice(1) : seg); } return { ...t, xy: smooth(all).filter((_, i, a) => i % 2 === 0 || i === a.length - 1) }; });
  if (COX) {   // KIỂM CHỨNG TUYẾN THỦY: hút từng điểm về điểm ảnh nước gần nhất (≤ 10 px), rồi đếm điểm vẫn nằm trên cạn
    const ganNuoc = ([x, y], r) => { x = Math.round(x); y = Math.round(y); for (let k = 0; k <= r; k++) for (let dy = -k; dy <= k; dy++) for (let dx = -k; dx <= k; dx++) { if (Math.max(Math.abs(dx), Math.abs(dy)) !== k) continue; const X = x + dx, Y = y + dy; if (X >= 0 && Y >= 0 && X < W && Y < H && MASK[Y * W + X]) return [X, Y]; } return null; };
    KIEM.tuyen = tuyen.map(t => { if (t.cachDi !== 'thuy') return { ten: t.ten, cachDi: t.cachDi || 'bo' };
      t.xy = t.xy.map(p => ganNuoc(p, 10) || p); const tren_can = t.xy.filter(p => !ganNuoc(p, 2)).length; return { ten: t.ten, cachDi: 'thuy', diem: t.xy.length, tren_can }; });
  }
  /* ảnh xem trước: nền + tuyến */
  const col = { ta: '#c8352b', dich: '#1f4f86' };
  tuyen.forEach(t => { g.strokeStyle = col[t.ben] || '#333'; g.lineWidth = 9; g.setLineDash(t.ben === 'dich' ? [26, 14] : []); g.lineCap = g.lineJoin = 'round'; g.beginPath(); t.xy.forEach(([x, y], k) => k ? g.lineTo(x, y) : g.moveTo(x, y)); g.stroke(); g.setLineDash([]);
    const [x1, y1] = t.xy[t.xy.length - 1], [x0, y0] = t.xy[Math.max(0, t.xy.length - 6)], an = Math.atan2(y1 - y0, x1 - x0); g.fillStyle = col[t.ben] || '#333'; g.beginPath(); g.moveTo(x1 + Math.cos(an) * 26, y1 + Math.sin(an) * 26); g.lineTo(x1 + Math.cos(an + 2.5) * 24, y1 + Math.sin(an + 2.5) * 24); g.lineTo(x1 + Math.cos(an - 2.5) * 24, y1 + Math.sin(an - 2.5) * 24); g.fill(); });
  /* mặt nạ nước 640×360 (1 = nước) – để công cụ viết kịch bản kiểm điểm đặt thuyền/quân */
  let matNuoc = null; if (MASK) { const a = []; for (let y = 0; y < 360; y++) for (let x = 0; x < 640; x++) { let w = 0; for (let dy = 0; dy < 4; dy++) for (let dx = 0; dx < 4; dx++) w += MASK[(y * 4 + dy) * W + x * 4 + dx] ? 1 : 0; a.push(w === 16 ? 1 : 0); } matNuoc = a.join(''); }   // ô là nước khi CẢ 16 điểm là nước (mỏm đá nhỏ hơn 1 ô cũng không lọt)
  return { matNuoc, nen, nen3d, xem: cv.toDataURL('image/jpeg', .9), tuyen: tuyen.map(t => ({ ten: t.ten, ben: t.ben, cachDi: t.cachDi || 'bo', xy: t.xy.map(([x, y]) => [Math.round(x), Math.round(y)]) })), emax: Math.round(emax), emin: Math.round(emin), docao, KIEM };
}, { songDH: !CO && !geom.some(g => g.kind === 'song'), nguong: R.nguong_song || 0.0035, tiles, tx0, ty0, PX0, PY0, SX, SY, W, H, geom, diaDanh, tuyenIn, nuoc: !!R.bien_nuoc, mpp: 40075016 * Math.cos((nam + bac) / 2 * Math.PI / 180) / (256 * 2 ** Z * SX), COX });
await browser.close();

const save = (f, durl) => fs.writeFileSync(path.join(DIR, f), Buffer.from(durl.split(',')[1], 'base64'));
save('nen-2k.jpg', out.nen); save('nen-3d.jpg', out.nen3d); save('xem-truoc.jpg', out.xem); save('do-cao.png', out.docao);
if (out.matNuoc) fs.writeFileSync(path.join(DIR, 'nuoc.bin'), Buffer.from(out.matNuoc.split('').map(Number)));   // 640×360 byte, 1 = nước (ô 4×4 px có nước)
// tuyến: tọa độ ảnh 2560×1440 + kinh/vĩ độ (để dùng lại ở mọi khung hình)
const unproj = ([x, y]) => [+x2lon(x / SX + PX0, Z).toFixed(5), +y2lat(y / SY + PY0, Z).toFixed(5)];
fs.writeFileSync(path.join(DIR, 'tuyen.json'), JSON.stringify({ id, ten: R.ten, khung: { rong: W, cao: H, tay, dong, nam, bac, zoom: Z, do_cao: { file: 'do-cao.png', thap: out.emin, cao: out.emax, met_moi_diem: +(40075016 * Math.cos((nam + bac) / 2 * Math.PI / 180) / (256 * 2 ** Z * SX)).toFixed(2) } },
  dia_danh: diaDanh.map(d => ({ ten: d.ten, loai: d.loai || '', xy: d.p.map(Math.round), lonlat: [d.lon, d.lat] })),
  nguon: CO ? 'Bản đồ cổ dựng lại: địa hình Terrain Tiles trên AWS (SRTM, GMTED, ETOPO1…); sông, hồ, bờ biển thời xưa khai báo theo sử liệu (maps/' + id + '/region.json) – không dùng dữ liệu bản đồ hiện đại'
    : '© OpenStreetMap contributors (ODbL); địa hình: Terrain Tiles trên AWS (SRTM, GMTED, ETOPO1…)', che_do: CO ? 'co' : 'hien-dai', kiem_chung: out.KIEM || undefined,
  tuyen: out.tuyen.map(t => ({ ...t, lonlat: t.xy.map(unproj) })) }, null, 1));
console.log(`  ✔ maps/${id}/nen-2k.jpg · xem-truoc.jpg · tuyen.json (${out.tuyen.length} tuyến; đỉnh cao nhất ${out.emax} m)`);
let hong = 0;
if (out.KIEM) {
  console.log('  KIỂM CHỨNG BẢN ĐỒ CỔ:');
  const lim = R.canh_bao_vot_m || 20;
  out.KIEM.song.forEach(s => { const sai = s.vot > lim; if (sai) hong++;
    const ll = s.cho_vot ? unproj(s.cho_vot) : null;
    console.log(`    sông ${s.ten || '(không tên)'}: rộng ${s.rong_px}px · lòng sông trung vị ${s.trung_vi} m · chảy ngược dốc lớn nhất ${s.vot} m${sai ? `  ✖ VẮT QUA ĐỒI tại điểm ảnh (${s.cho_vot}) ≈ ${ll[0]}, ${ll[1]} – sửa điểm sông` : ' ✔'}`); });
  if (out.KIEM.bien_px != null) console.log(`    biển xưa: ${out.KIEM.bien_px} điểm ảnh (mực nước cổ ${R.muc_nuoc_co} m)`);
  out.KIEM.tuyen.forEach(t => { if (t.cachDi !== 'thuy') return; if (t.tren_can) hong++; console.log(`    tuyến thủy "${t.ten}": ${t.diem} điểm · ${t.tren_can ? '✖ ' + t.tren_can + ' điểm TRÊN CẠN' : '✔ toàn bộ trên mặt nước'}`); });
}
if (hong) { console.log('✖ Bản đồ cổ chưa đạt (sông vắt qua đồi hoặc tuyến thủy đi trên cạn) – sửa song_xua/tuyen trong region.json rồi chạy lại.'); process.exitCode = 1; }
