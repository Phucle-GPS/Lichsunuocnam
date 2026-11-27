#!/usr/bin/env node
/* SINH KỊCH BẢN BẢN ĐỒ cho các trận (Hai Bà Trưng 40, Bạch Đằng 938, Bạch Đằng 1288, Rạch Gầm 1785, Đống Đa 1789, Như Nguyệt 1077, Đông Bộ Đầu 1258, Tây Kết 1285) – Xưởng film Lịch sử Việt Nam
   node tools/sinh-kich-ban-ban-do.mjs [id]   → maps/<id>/kich-ban-ban-do.json. Mỗi mốc bám từng câu lời dẫn; đường thuyền hút vào lòng nước,
   đoạn chạm đất thay bằng đường qua ô nước liền kề; kiểm lại trước khi ghi (thẩm quyền cuối: tools/kiem-thuy.mjs). */
// Sinh maps/<id>/kich-ban-ban-do.json cho 5 trận – bám từng câu lời dẫn (mốc từ moc-cau.mjs); tự kiểm thuyền trên nước, quân trên cạn
import fs from 'node:fs'; import path from 'node:path'; import { fileURLToPath } from 'node:url';
const ROOT = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'maps') + '/';
const only = process.argv[2];
function moTran(id) {
  const T = JSON.parse(fs.readFileSync(ROOT + id + '/tuyen.json', 'utf8')), NB = fs.readFileSync(ROOT + id + '/nuoc.bin'), k = T.khung;
  const nuoc = (x, y) => NB[Math.max(0, Math.min(359, Math.floor(y / 4))) * 640 + Math.max(0, Math.min(639, Math.floor(x / 4)))] === 1;
  const lon2x = (lon, z) => (lon + 180) / 360 * 256 * 2 ** z, lat2y = (lat, z) => { const s = Math.sin(lat * Math.PI / 180); return (0.5 - Math.log((1 + s) / (1 - s)) / (4 * Math.PI)) * 256 * 2 ** z; };
  const PX0 = lon2x(k.tay, k.zoom), PY0 = lat2y(k.bac, k.zoom), SX = k.rong / (lon2x(k.dong, k.zoom) - PX0), SY = k.cao / (lat2y(k.nam, k.zoom) - PY0);
  const P = (lon, lat) => [Math.round((lon2x(lon, k.zoom) - PX0) * SX), Math.round((lat2y(lat, k.zoom) - PY0) * SY)];
  const R = i => T.tuyen[i].xy, DD = Object.fromEntries(T.dia_danh.map(d => [d.ten, d.xy]));
  const cum = pts => { const c = [0]; for (let i = 1; i < pts.length; i++) c.push(c[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1])); return c; };
  const at = (pts, u) => { const c = cum(pts), L = c[c.length - 1], d = Math.max(0, Math.min(1, u)) * L; let i = 1; while (i < c.length - 1 && c[i] < d) i++; const t = (d - c[i - 1]) / Math.max(1e-6, c[i] - c[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * t, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * t].map(Math.round); };
  const uNear = (pts, p) => { let b = 0, bd = 1e18; for (let j = 0; j <= 400; j++) { const q = at(pts, j / 400), e = (q[0] - p[0]) ** 2 + (q[1] - p[1]) ** 2; if (e < bd) { bd = e; b = j / 400; } } return b; };
  const sub = (pts, u0, u1, n = 30) => Array.from({ length: n + 1 }, (_, j) => at(pts, u0 + (u1 - u0) * j / n));
  const nrm = (pts, u) => { const a = at(pts, u - .01), b = at(pts, u + .01), dx = b[0] - a[0], dy = b[1] - a[1], L = Math.hypot(dx, dy) || 1; return [-dy / L, dx / L]; };
  const nuaRong = (p, n) => { let a = 0, b = 0; while (a < 300 && nuoc(p[0] + n[0] * a, p[1] + n[1] * a)) a++; while (b < 300 && nuoc(p[0] - n[0] * b, p[1] - n[1] * b)) b++; return [a, b]; };   // nước về 2 phía
  const ganNuoc = (p, r = 80) => { for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (nuoc(x, y)) return [x, y]; } throw new Error(id + ': không tìm thấy nước gần ' + p); };
  const ganDat = (p, r = 120) => { for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = p[0] + Math.cos(a / 32 * 6.283) * d, y = p[1] + Math.sin(a / 32 * 6.283) * d; if (!nuoc(x, y) && !nuoc(x + 6, y) && !nuoc(x - 6, y) && !nuoc(x, y + 6) && !nuoc(x, y - 6)) return [Math.round(x), Math.round(y)]; } throw new Error(id + ': không tìm thấy đất gần ' + p); };
  /* qua sông: tại điểm p trên sông, theo pháp tuyến n → [điểm nước sát bờ A, điểm nước sát bờ B, đất bờ A, đất bờ B] */
  const quaSong = (p, n) => { const [a, b] = nuaRong(p, n); return { nuocA: [p[0] + n[0] * (a - 4), p[1] + n[1] * (a - 4)].map(Math.round), nuocB: [p[0] - n[0] * (b - 4), p[1] - n[1] * (b - 4)].map(Math.round),
    datA: ganDat([p[0] + n[0] * (a + 22), p[1] + n[1] * (a + 22)]), datB: ganDat([p[0] - n[0] * (b + 22), p[1] - n[1] * (b + 22)]) }; };
  /* lòng nước sâu: điểm và 4 điểm cách 5 px quanh nó đều là nước (không sát bờ) */
  const sau = (x, y) => nuoc(x, y) && nuoc(x + 5, y) && nuoc(x - 5, y) && nuoc(x, y + 5) && nuoc(x, y - 5);
  /* rất sâu: cách bờ / đảo nhỏ ≥ 2 ô (8 px) theo cả 8 hướng – dùng trước tiên (vùng biển nhiều đảo đá) */
  const sau2 = (x, y) => sau(x, y) && [[8, 0], [-8, 0], [0, 8], [0, -8], [6, 6], [-6, 6], [6, -6], [-6, -6]].every(([dx, dy]) => nuoc(x + dx, y + dy));
  const veLong = (p, r = 30) => { for (let d = 0; d <= Math.min(r, 14); d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (sau2(x, y)) return [x, y]; }
    for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (sau(x, y)) return [x, y]; }
    for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (nuoc(x, y) && nuoc(x + 2, y) && nuoc(x - 2, y) && nuoc(x, y + 2) && nuoc(x, y - 2)) return [x, y]; }   // rạch hẹp
    throw new Error(id + ': không có lòng nước gần ' + p); };
  /* đường thuyền: lấy đoạn tuyến (hoặc mảng điểm), chia dày, hút từng điểm vào lòng nước, bỏ điểm trùng */
  /* đoạn a→b cắt qua đất? → chèn điểm giữa đã hút vào lòng nước, đệ quy tới khi cả đoạn trên nước */
  const lienNuoc = (a, b, sau = 0) => { const n = Math.max(4, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2)), cham = []; for (let j = 1; j < n; j++) { const x = a[0] + (b[0] - a[0]) * j / n, y = a[1] + (b[1] - a[1]) * j / n; if (!nuoc(x, y) || !nuoc(Math.round(x), Math.round(y))) cham.push(j); }
    if (!cham.length) return [b]; return quaO(a, b); };
  /* đường qua các ô nước liền kề (BFS 4 hướng trên lưới 640×360): nối tâm ô kề nhau → luôn nằm trọn trên nước */
  const quaO = (a, b, chat = 2) => { const ca = [Math.floor(a[0] / 4), Math.floor(a[1] / 4)], cb = [Math.floor(b[0] / 4), Math.floor(b[1] / 4)], le = 80;
    const x0 = Math.max(0, Math.min(ca[0], cb[0]) - le), y0 = Math.max(0, Math.min(ca[1], cb[1]) - le), x1 = Math.min(639, Math.max(ca[0], cb[0]) + le), y1 = Math.min(359, Math.max(ca[1], cb[1]) + le), gw = x1 - x0 + 1;
    const o1 = (x, y) => x >= 0 && y >= 0 && x < 640 && y < 360 && NB[y * 640 + x] === 1, giua = (x, y) => o1(x, y) && o1(x + 1, y) && o1(x - 1, y) && o1(x, y + 1) && o1(x, y - 1);
    const giua2 = (x, y) => { for (let dy = -2; dy <= 2; dy++) for (let dx = -2; dx <= 2; dx++) if (!o1(x + dx, y + dy)) return false; return true; };   // cách bờ ≥ 2 ô
    const W8 = (x, y) => (x === ca[0] && y === ca[1]) || (x === cb[0] && y === cb[1]) ? o1(x, y) : chat === 2 ? giua2(x, y) : chat ? giua(x, y) : o1(x, y), key = (x, y) => (y - y0) * gw + (x - x0), tu = new Map([[key(...ca), -1]]), hang = [ca];
    for (let h = 0; h < hang.length; h++) { const [x, y] = hang[h]; if (x === cb[0] && y === cb[1]) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < x0 || Y < y0 || X > x1 || Y > y1 || !W8(X, Y) || tu.has(key(X, Y))) continue; tu.set(key(X, Y), key(x, y)); hang.push([X, Y]); } }
    if (!tu.has(key(...cb)) && chat) return quaO(a, b, chat - 1);   // không thông qua ô giữa nước → nới dần: cách bờ 2 ô → 1 ô → sát bờ
    if (!tu.has(key(...cb))) throw new Error(id + ': hai điểm thuyền không thông nước ' + a + ' → ' + b);
    const o = []; for (let k = key(...cb); k !== -1; k = tu.get(k)) { const cx = x0 + (k % gw), cy = y0 + Math.floor(k / gw); o.push([cx * 4 + 2, cy * 4 + 2]); }   // tâm ô (điểm ảnh)
    return o.reverse().slice(1, -1).concat([b]); };
  const thuy = (src, u0 = 0, u1 = 1, n = 80) => { const pts = Array.isArray(src) ? src : R(src); const o = []; sub(pts, u0, u1, n).forEach(p => { const q = veLong(p); const l = o[o.length - 1]; if (!l || l[0] !== q[0] || l[1] !== q[1]) o.push(q); });
    const kq = [o[0]]; for (let i = 1; i < o.length; i++) kq.push(...lienNuoc(kq[kq.length - 1], o[i])); return kq; };
  return { T, nuoc, P, R, DD, at, uNear, sub, nrm, nuaRong, ganNuoc, ganDat, quaSong, thuy, veLong };
}
/* kiểm: đường thuyền (mảng điểm hoặc số tuyến) phải nằm trên nước; đoàn quân bộ chỉ cảnh báo */
function kiem(id, H, kb) {
  const loi = [];
  const ok = (x, y) => H.nuoc(x, y);   // lọc sơ bộ; thẩm quyền cuối là tools/kiem-thuy.mjs trên máy dựng 3D
  kb.doan_quan.forEach(q => { if (q.phuong_tien !== 'thuyen') return; const goc = typeof q.duong === 'number' ? H.sub(H.R(q.duong), q.tu ?? 0, q.den ?? 1, 60) : q.duong, pts = H.sub(goc, 0, 1, 200);   // lấy mẫu dày cả đoạn nối giữa các điểm
    const sai = pts.filter(p => !ok(p[0], p[1])); if (sai.length) loi.push(`thuyền "${q.ten}": ${sai.length}/${pts.length} điểm sát/ trên cạn, vd. ${sai[0]}`);
    if (q.tu === 1 || (q.tu ?? 0) >= (q.den ?? 1)) loi.push(`thuyền "${q.ten}": tu ≥ den – đoàn thuyền sẽ không hiện`); });
  (kb.coc || []).forEach((c, i) => { const pts = [c.tu, c.den]; if (pts.some(p => !H.nuoc(p[0], p[1]))) loi.push(`bãi cọc ${i}: đầu mút không nằm trên nước`); });
  if (loi.length) { console.log('✖ ' + id + '\n  ' + loi.join('\n  ')); process.exitCode = 1; return false; }
  return true;
}
const ghi = (id, kb) => { const H = moTran(id); if (!kiem(id, H, kb)) return; fs.writeFileSync(ROOT + id + '/kich-ban-ban-do.json', JSON.stringify(kb, null, 1) + '\n'); console.log(`✔ ${id}: ${kb.doan_quan.length} đạo quân, ${kb.mui_ten.length} mũi tên, ${(kb.nhan || []).length} nhãn – thuyền đều trên nước`); };
const CHUNG = { ghi_chu: 'Kịch bản bản đồ chiến dịch 3D (hyperframes/_chung/bando3d.js) – sinh bằng máy, bám từng câu lời dẫn. Thời gian = giây theo đồng hồ cảnh bản đồ (bắt đầu ở đoạn giọng 3). Tọa độ = điểm ảnh trên nen-2k.jpg (2560×1440).', phong_dai_do_cao: 2.6, ti_le_nguoi: 4.4, nghieng_toi_thieu: 46 };

/* ==================== BẠCH ĐẰNG 938 ==================== */
if (!only || only === 'bach-dang-938') { const id = 'bach-dang-938', H = moTran(id), { R, at, uNear, sub, nrm, nuaRong, DD, thuy } = H;
  const BC = DD['Bãi cọc'], CUA = DD['Cửa biển Bạch Đằng'], uc0 = uNear(R(0), BC), uc1 = uNear(R(1), BC), uc2 = uNear(R(2), BC);
  const C0 = H.veLong(at(R(0), uc0)), n0 = nrm(R(0), uc0), [ha, hb] = nuaRong(C0, n0);
  const cocTu = [C0[0] + n0[0] * (ha - 7), C0[1] + n0[1] * (ha - 7)].map(Math.round), cocDen = [C0[0] - n0[0] * (hb - 7), C0[1] - n0[1] * (hb - 7)].map(Math.round);
  const bo = s => H.ganDat([C0[0] + n0[0] * s, C0[1] + n0[1] * s]), bo2 = (u, s) => { const p = at(R(0), u), n = nrm(R(0), u); return H.ganDat([p[0] + n[0] * s, p[1] + n[1] * s]); };
  const pb = [bo2(uc0 + .05, ha + 30), bo2(uc0 + .05, -(hb + 30)), bo2(uc0 - .04, ha + 30), bo2(uc0 - .04, -(hb + 30))];
  const huongBien = [CUA[0] - C0[0], CUA[1] - C0[1]];
  const kb = { ...CHUNG, chu_co_ta: 'NGÔ', ti_le_thuyen: .6,
    may_quay: [[0, 1520, 1100, 760, 66, 0], [6.5, 1420, 1010, 700, 64, -4], [10.5, 1360, 940, 560, 60, -8], [14.4, 1520, 1080, 470, 58, -12], [20, C0[0] + 90, C0[1] + 150, 600, 62, -10],
      [24.8, C0[0], C0[1], 330, 55, -20], [29.5, C0[0] + 5, C0[1] + 10, 340, 56, -22], [32.3, C0[0] - 25, C0[1] - 40, 430, 57, -20], [37.3, C0[0] - 40, C0[1] - 60, 450, 58, -18],
      [41, C0[0] - 25, C0[1] - 40, 430, 57, -20], [44.5, C0[0], C0[1], 360, 56, -22], [48.6, C0[0] + 15, C0[1] + 20, 340, 56, -24], [51, C0[0] + 20, C0[1] + 25, 360, 57, -24]],
    may_quay_sau: [[0, C0[0] - 260, C0[1] + 170, 720, 64, 0], [14.9, C0[0] - 210, C0[1] + 130, 640, 62, -8]],
    doan_quan: [
      { ten: 'Thủy quân Nam Hán vào cửa sông', ben: 'dich', tuong: true, co: 'HÁN', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .022, duong: thuy(0, 0, uc0 - .07), t0: .5, t1: 30, an_sau: 32.9 },
      { ten: 'Nam Hán vượt qua bãi cọc', ben: 'dich', tuong: true, co: 'HÁN', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .022, duong: thuy(0, uc0 - .07, 1), t0: 32.9, t1: 37.6, an_sau: 38.6 },
      { ten: 'Thuyền nhẹ ra khiêu chiến', ben: 'ta', tuong: true, co: 'NGÔ', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .03, duong: thuy(2, .3, Math.min(.98, uc2 + .03)), t0: 30.5, t1: 33.6, an_sau: 34 },
      { ten: 'Thuyền nhẹ giả thua, nhử địch', ben: 'ta', tuong: true, co: 'NGÔ', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .03, duong: thuy(2, Math.min(.98, uc2 + .03), .12), t0: 34, t1: 38.2, an_sau: 38.6 },
      { ten: 'Quân ta từ thượng nguồn đổ ra', ben: 'ta', tuong: true, co: 'NGÔ', phuong_tien: 'thuyen', thuyen: 10, gian_cach: .022, duong: thuy(2, .05, Math.max(.1, uc2 - .06)), t0: 38.7, t1: 44 },
      { ten: 'Nam Hán tháo chạy ra biển', ben: 'dich', tuong: true, co: 'HÁN', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .022, duong: thuy(1, 0, Math.min(.95, uc1 + .05)), t0: 38.7, cho: .3, t1: 44.4, dam_tai: 44.6, ti_le_dam: .8, chay: true, nga_tai: 48.8 }],
    coc: [{ tu: cocTu, den: cocDen, be_rong: 34, so: 70, huong_nghieng: huongBien, t0: 24.8, t_ngap: 29.5, t_lo: 37.3, lo_trong: 2.5 }],
    mui_ten: [
      { duong: 0, ben: 'dich', net: 'dut', t0: .5, t1: 37.6, an_sau: 38.6 },
      { duong: 2, ben: 'ta', bat_dau: .05, den: Math.max(.1, uc2 - .04), t0: 38.7, t1: 44, day: 13 },
      { duong: 1, ben: 'dich', net: 'dut', den: Math.min(.97, uc1 + .07), t0: 38.9, t1: 44.6 },
      ...pb.map((p, i) => ({ duong: [p, at(R(0), uc0 + (i < 2 ? .05 : -.04))], ben: 'ta', t0: 39 + i * .25, t1: 40.2 + i * .25, day: 11 }))],
    phuc_binh: pb.map((p, i) => ({ xy: p, ben: 'ta', t0: 38.8 + i * .25 })),
    lua: [{ xy: C0, ban_kinh: 55, t0: 45, t1: 51, ngon: 7 }, { xy: at(R(1), Math.min(.95, uc1 + .04)), ban_kinh: 40, t0: 45.6, t1: 51, ngon: 5 }],
    co_cam: [{ xy: bo(ha + 40), ben: 'ta', t0: 50.2 }, { xy: H.ganDat([CUA[0] - 40, CUA[1] - 30]), ben: 'ta', t0: 50.6 }],
    nhan: [
      { xy: [1700, 1240], chu: 'Lưu Hoằng Tháo · thủy quân Nam Hán theo đường biển', ben: 'dich', t0: 1, t1: 7 },
      { xy: [760, 200], chu: 'Ngô Quyền giết Kiều Công Tiễn', ben: 'ta', t0: 7.2, t1: 10.5 },
      { xy: [CUA[0] - 60, CUA[1] - 50], chu: 'Cửa sông Bạch Đằng – nơi quyết chiến', ben: 'ta', t0: 9.8, t1: 14 },
      { xy: at(R(0), .2), chu: 'Thuyền lớn, quân đông', ben: 'dich', t0: 14.4, t1: 19 },
      { xy: [C0[0] + 60, C0[1] + 120], chu: 'Ngô Quyền nắm quy luật thủy triều', ben: 'ta', t0: 16.6, t1: 23.8 },
      { xy: C0, chu: 'Đóng cọc gỗ đầu bịt sắt nhọn', ben: 'ta', t0: 25, t1: 29.4 },
      { xy: C0, chu: 'Triều lên – cọc bị che lấp', t0: 29.6, t1: 32.2 },
      { xy: at(R(2), .45), chu: 'Thuyền nhẹ khiêu chiến rồi giả thua', ben: 'ta', t0: 32.4, t1: 37.2 },
      { xy: C0, chu: 'Triều rút – bãi cọc nhô lên', t0: 37.4, t1: 40 },
      { xy: at(R(2), .3), chu: 'Quân ta từ thượng nguồn và hai bờ đổ ra', ben: 'ta', t0: 40.2, t1: 43.7 },
      { xy: C0, chu: 'Thuyền giặc va cọc, vỡ đắm vô số', ben: 'dich', t0: 44, t1: 48.5 },
      { xy: [C0[0] + 30, C0[1] + 50], chu: 'Lưu Hoằng Tháo tử trận', ben: 'dich', t0: 48.8, t1: 51 }] };
  ghi(id, kb); }

/* ==================== BẠCH ĐẰNG 1288 ==================== */
if (!only || only === 'bach-dang-1288') { const id = 'bach-dang-1288', H = moTran(id), { R, at, uNear, sub, nrm, nuaRong, DD, thuy } = H;
  const BC = DD['Bãi cọc Bạch Đằng'], VK = DD['Vạn Kiếp'], VD = DD['Vân Đồn'], CUA = DD['Cửa biển Bạch Đằng'], uc0 = uNear(R(0), BC), uc2 = uNear(R(2), BC);
  const C0 = H.veLong(at(R(0), uc0)), n0 = nrm(R(0), uc0), [ha, hb] = nuaRong(C0, n0);
  const cocTu = [C0[0] + n0[0] * (ha - 3), C0[1] + n0[1] * (ha - 3)].map(Math.round), cocDen = [C0[0] - n0[0] * (hb - 3), C0[1] - n0[1] * (hb - 3)].map(Math.round);
  const bo2 = (u, s) => { const p = at(R(0), u), n = nrm(R(0), u); return H.ganDat([p[0] + n[0] * s, p[1] + n[1] * s]); };
  const pb = [bo2(uc0 - .03, ha + 26), bo2(uc0 - .03, -(hb + 26)), bo2(uc0 - .09, ha + 26), bo2(uc0 - .09, -(hb + 26))];
  const huongBien = [CUA[0] - C0[0], CUA[1] - C0[1]], uDen = uc0 + .03, tuBien = sub(R(0), 1, Math.min(1, uc0 + .14));
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .5,
    may_quay: [[0, 1250, 700, 780, 68, 0], [6.5, 1100, 820, 640, 64, -4], [10.5, C0[0] + 40, C0[1], 460, 58, -10], [13.6, 1900, 700, 560, 60, -6], [15.5, VD[0] - 80, VD[1] + 150, 380, 56, -10],
      [19.1, 700, 560, 620, 62, -6], [22.9, 420, 480, 460, 58, -10], [23.9, C0[0], C0[1], 340, 55, -18], [27.7, C0[0] - 40, C0[1] - 40, 380, 56, -20], [32.2, C0[0] - 60, C0[1] - 70, 420, 57, -18],
      [36, C0[0] - 40, C0[1] - 40, 440, 58, -18], [39.4, C0[0] - 10, C0[1] - 10, 400, 57, -20], [43.2, C0[0], C0[1], 340, 56, -22], [46.7, C0[0] + 10, C0[1] + 10, 360, 57, -22], [50.5, C0[0] + 20, C0[1] + 20, 400, 58, -22]],
    may_quay_sau: [[0, C0[0] - 280, C0[1] + 60, 700, 64, 0], [10.8, C0[0] - 230, C0[1] + 30, 640, 62, -8]],
    doan_quan: [
      { ten: 'Thuyền lương Trương Văn Hổ', ben: 'dich', tuong: true, co: 'HỔ', phuong_tien: 'thuyen', lon: true, thuyen: 6, gian_cach: .05, duong: thuy(1, 0, .72), t0: 13, t1: 17.2, dam_tai: 17.3, ti_le_dam: .9, chay: true, nga_tai: 18.6, an_sau: 23 },
      { ten: 'Trần Khánh Dư chặn đánh ở Vân Đồn', ben: 'ta', tuong: true, co: 'DƯ', phuong_tien: 'thuyen', thuyen: 5, gian_cach: .1, duong: thuy(1, .86, .74), t0: 14, t1: 17.2, an_sau: 23 },
      { ten: 'Thuyền Ô Mã Nhi rút về biển', ben: 'dich', tuong: true, co: 'Ô', phuong_tien: 'thuyen', lon: true, thuyen: 10, gian_cach: .016, duong: thuy(0, .2, uc0 - .05), t0: 19, cho: 4, t1: 34.5, an_sau: 39.5 },
      { ten: 'Thuyền nhẹ khiêu chiến', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .05, duong: thuy(0, Math.min(1, uc0 + .12), uc0 - .02), t0: 32.2, t1: 34.4, an_sau: 34.8 },
      { ten: 'Thuyền nhẹ lui, nhử địch', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .05, duong: thuy(0, uc0 - .02, Math.min(1, uc0 + .16)), t0: 34.8, t1: 37, an_sau: 37.4 },
      { ten: 'Thuyền nhẹ từ thượng nguồn đổ ra', ben: 'ta', tuong: true, co: 'HƯNG ĐẠO', phuong_tien: 'thuyen', thuyen: 9, gian_cach: .05, duong: thuy(2, 0, Math.max(.2, uc2 - .1)), t0: 36, t1: 40 },
      { ten: 'Thuyền nhẹ từ cửa biển đánh lên', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 6, gian_cach: .04, duong: thuy(tuBien), t0: 37.4, t1: 40.5 },
      { ten: 'Thuyền giặc dồn vào bãi cọc', ben: 'dich', tuong: true, co: 'Ô', phuong_tien: 'thuyen', lon: true, thuyen: 10, gian_cach: .016, duong: thuy(0, uc0 - .05, uDen), t0: 39.5, t1: 43, dam_tai: 43.2, ti_le_dam: .6, chay: true, an_sau: 47 },
      { ten: 'Hơn 400 chiến thuyền bị thu', ben: 'ta', phuong_tien: 'thuyen', lon: true, thuyen: 5, gian_cach: .018, duong: thuy(0, uDen - .01, uDen, 6), t0: 47, t1: 47.1 }],
    coc: [{ tu: cocTu, den: cocDen, be_rong: 30, so: 80, huong_nghieng: huongBien, t0: 24, t_ngap: 28.5, t_lo: 35.6, lo_trong: 2.5 }],
    mui_ten: [
      { duong: sub(R(0), 1, 0), ben: 'dich', net: 'dut', t0: .6, t1: 6.2, an_sau: 13 },
      { duong: [[VK[0] + 260, 0], [VK[0] + 120, VK[1] - 140], VK], ben: 'dich', net: 'dut', t0: 1.2, t1: 6.2, an_sau: 13 },
      { duong: 1, ben: 'dich', net: 'dut', den: .72, t0: 13, t1: 17, an_sau: 23 },
      { duong: sub(R(1), .9, .76), ben: 'ta', t0: 14, t1: 17, day: 12, an_sau: 23 },
      { duong: 0, ben: 'dich', net: 'dut', tu: .2, den: uDen, t0: 23, t1: 43 },
      { duong: 2, ben: 'ta', den: Math.max(.2, uc2 - .08), t0: 36, t1: 40, day: 13 },
      { duong: tuBien, ben: 'ta', t0: 37.4, t1: 40.5, day: 13 },
      ...pb.map((p, i) => ({ duong: [p, at(R(0), uc0 - (i < 2 ? .03 : .09))], ben: 'ta', t0: 39.5 + i * .25, t1: 40.7 + i * .25, day: 11 }))],
    phuc_binh: pb.map((p, i) => ({ xy: p, ben: 'ta', t0: 39.4 + i * .25 })),
    lua: [{ xy: VD, ban_kinh: 45, t0: 17.4, t1: 22.5, ngon: 6 }, { xy: C0, ban_kinh: 55, t0: 43.5, t1: 50.5, ngon: 7 }, { xy: at(R(0), uc0 - .05), ban_kinh: 40, t0: 44.2, t1: 50.5, ngon: 5 }],
    co_cam: [{ xy: H.ganDat([VD[0] + 20, VD[1] + 10]), ben: 'ta', t0: 18.5 }, { xy: H.ganDat([C0[0] + n0[0] * (ha + 40), C0[1] + n0[1] * (ha + 40)]), ben: 'ta', t0: 45.4 }, { xy: H.ganDat([CUA[0] - 40, CUA[1] - 40]), ben: 'ta', t0: 48 }],
    nhan: [
      { xy: [VK[0] + 160, VK[1] - 120], chu: 'Quân Nguyên chia hai đường thủy bộ (lần thứ ba, 1287)', ben: 'dich', t0: 1.4, t1: 6.6 },
      { xy: [C0[0] + 40, C0[1] - 40], chu: 'Sông Bạch Đằng · 9 tháng 4 năm 1288', ben: 'ta', t0: 7, t1: 12.6 },
      { xy: [VD[0] - 40, VD[1] - 60], chu: 'Trần Khánh Dư đánh tan thuyền lương Trương Văn Hổ', ben: 'ta', t0: 14.2, t1: 19 },
      { xy: [VK[0] + 120, VK[1] + 40], chu: 'Thiếu lương – quân Nguyên ở Vạn Kiếp tính đường rút', ben: 'dich', t0: 19.4, t1: 22.9 },
      { xy: C0, chu: 'Bãi cọc lớn ở cửa sông', ben: 'ta', t0: 24.2, t1: 27.7 },
      { xy: at(R(0), uc0 - .1), chu: 'Ô Mã Nhi rút qua Bạch Đằng lúc nước lên', ben: 'dich', t0: 27.9, t1: 32.2 },
      { xy: [C0[0] + 30, C0[1] + 40], chu: 'Khiêu chiến, nhử địch – nước triều rút', ben: 'ta', t0: 32.4, t1: 36 },
      { xy: at(R(2), .4), chu: 'Thuyền nhẹ từ khắp nơi đổ ra', ben: 'ta', t0: 36.2, t1: 39.4 },
      { xy: pb[0], chu: 'Phục binh hai bờ đánh xuống', ben: 'ta', t0: 39.6, t1: 43 },
      { xy: C0, chu: 'Thuyền giặc dồn vào bãi cọc, đắm và bị đốt', ben: 'dich', t0: 43.3, t1: 46.6 },
      { xy: [C0[0] + 20, C0[1] + 60], chu: 'Ô Mã Nhi bị bắt sống · hơn 400 chiến thuyền bị thu', ben: 'ta', t0: 45.5, t1: 50.4 }] };
  ghi(id, kb); }

/* ==================== RẠCH GẦM – XOÀI MÚT 1785 ==================== */
if (!only || only === 'rach-gam-1785') { const id = 'rach-gam-1785', H = moTran(id), { R, at, uNear, sub, P, DD, ganNuoc, ganDat, thuy } = H;
  const RG = DD['Rạch Gầm'], XM = DD['Xoài Mút'], MT = DD['Mỹ Tho'], uX = uNear(R(0), P(106.255, 10.344)), uR = uNear(R(0), P(106.212, 10.349));
  const lach = (a, b) => { const A = P(...a), B = P(...b); return Array.from({ length: 21 }, (_, j) => ganNuoc([A[0] + (B[0] - A[0]) * j / 20, A[1] + (B[1] - A[1]) * j / 20], 12)); };   // đi trong rạch nhỏ
  const rachGam = lach([106.207, 10.39], [106.212, 10.352]), rachXM = lach([106.261, 10.39], [106.256, 10.346]);
  const NT = ganDat(P(106.18, 10.343)), TS = ganDat(P(106.345, 10.3405)), bacRG = ganDat([at(R(0), uR - .03)[0], at(R(0), uR - .03)[1] - 60]), namRG = ganDat([at(R(0), uR + .02)[0], at(R(0), uR + .02)[1] + 70]);
  const bacXM = ganDat([at(R(0), uX - .02)[0] + 30, at(R(0), uX - .02)[1] - 60]), namXM = ganDat([at(R(0), uX)[0], at(R(0), uX)[1] + 70]);
  const pb = [bacRG, namRG, bacXM, namXM], dao = [NT, TS], uLang = .14, lang = ganDat([at(R(0), uLang)[0], at(R(0), uLang)[1] - 75]), lang2 = ganDat([at(R(0), uLang + .05)[0], at(R(0), uLang + .05)[1] + 80]);
  const mtBen = sub(R(1), 0, 0.02, 2), tsDen = sub(R(1), 0, .98);
  const kb = { ...CHUNG, chu_co_ta: 'TÂY SƠN', ti_le_thuyen: .6,
    may_quay: [[0, 1200, 760, 760, 68, 0], [2.1, 700, 780, 560, 62, -4], [6.7, 1800, 680, 600, 62, -4], [11, 900, 770, 520, 60, -6], [16.5, lang[0] + 40, lang[1] + 70, 420, 58, -8], [20.3, MT[0] - 60, 720, 420, 58, -10],
      [22.7, 1400, 700, 520, 60, -8], [27.4, 1300, 720, 470, 60, -10], [30.6, 1250, 730, 430, 58, -12], [35.3, 1350, 690, 400, 57, -14], [38.8, 1450, 700, 470, 58, -10], [42.3, 1420, 720, 420, 57, -12], [47, 1440, 720, 440, 58, -12]],
    may_quay_sau: [[0, 1050, 820, 640, 64, 0], [8.9, 1100, 800, 600, 62, -6]],
    doan_quan: [
      { ten: 'Thủy binh Xiêm xuôi sông Tiền', ben: 'dich', tuong: true, co: 'XIÊM', phuong_tien: 'thuyen', lon: true, thuyen: 12, gian_cach: .022, duong: thuy(0, 0, .3), t0: 2.2, t1: 28, an_sau: 30.6 },
      { ten: 'Xiêm vào khúc Rạch Gầm – Xoài Mút', ben: 'dich', tuong: true, co: 'XIÊM', phuong_tien: 'thuyen', lon: true, thuyen: 12, gian_cach: .022, duong: thuy(0, .3, uX - .02), t0: 30.6, t1: 37, dam_tai: 42.8, ti_le_dam: .85, chay: true, nga_tai: 45.5 },
      { ten: 'Thủy binh Tây Sơn ở Mỹ Tho', ben: 'ta', tuong: true, co: 'HUỆ', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .04, duong: thuy(1, 0, .02, 4), t0: 20.3, t1: 21, an_sau: 38.8 },
      { ten: 'Thuyền nhẹ nhử địch', ben: 'ta', phuong_tien: 'thuyen', thuyen: 4, gian_cach: .06, duong: thuy(0, uX + .02, .55), t0: 30.6, t1: 33, an_sau: 33.2 },
      { ten: 'Thuyền nhẹ lui về', ben: 'ta', phuong_tien: 'thuyen', thuyen: 4, gian_cach: .06, duong: thuy(0, .55, Math.min(.99, uX + .04)), t0: 33.2, t1: 35.6, an_sau: 36 },
      { ten: 'Thuyền Tây Sơn ra từ rạch Gầm', ben: 'ta', phuong_tien: 'thuyen', thuyen: 4, gian_cach: .12, duong: thuy(rachGam, 0, 1, 30), t0: 35.5, t1: 38.5 },
      { ten: 'Thuyền Tây Sơn ra từ rạch Xoài Mút', ben: 'ta', phuong_tien: 'thuyen', thuyen: 4, gian_cach: .12, duong: thuy(rachXM, 0, 1, 30), t0: 35.8, t1: 38.8 },
      { ten: 'Tây Sơn chặn đầu', ben: 'ta', tuong: true, co: 'HUỆ', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .04, duong: thuy(1, .02, .96), t0: 38.8, t1: 42.3 },
      { ten: 'Tây Sơn khóa đuôi', ben: 'ta', phuong_tien: 'thuyen', thuyen: 5, gian_cach: .05, duong: thuy(0, uR - .12, uR - .02), t0: 41, t1: 43.5 }],
    mui_ten: [
      { duong: 0, ben: 'dich', net: 'dut', den: uX - .01, t0: 2.2, t1: 37 },
      { duong: [[2560, 560], [2300, 590], MT], ben: 'ta', t0: 7, t1: 11, day: 13 },
      { duong: 1, ben: 'ta', den: .98, t0: 38.8, t1: 42.3, day: 13 },
      { duong: rachGam, ben: 'ta', t0: 35.5, t1: 37.5, day: 11 }, { duong: rachXM, ben: 'ta', t0: 35.8, t1: 37.8, day: 11 },
      ...dao.map((p, i) => ({ duong: [p, at(R(0), i ? uX + .03 : uR - .04)], ben: 'ta', t0: 39 + i * .4, t1: 40.4 + i * .4, day: 11 })),
      ...pb.map((p, i) => ({ duong: [p, at(R(0), i < 2 ? uR : uX - .01)], ben: 'ta', t0: 35.6 + i * .3, t1: 36.8 + i * .3, day: 10 })),
      { duong: 2, ben: 'dich', net: 'dut', t0: 46.2, t1: 46.9 }],
    phuc_binh: [...pb.map((p, i) => ({ xy: p, ben: 'ta', t0: 35.4 + i * .3 })), ...dao.map((p, i) => ({ xy: p, ben: 'ta', t0: 38.9 + i * .4 }))],
    lua: [{ xy: lang, ban_kinh: 40, t0: 16.6, t1: 23, ngon: 5 }, { xy: lang2, ban_kinh: 34, t0: 17.4, t1: 23, ngon: 4 },
      { xy: at(R(0), uX - .06), ban_kinh: 55, t0: 43, t1: 47, ngon: 7 }, { xy: at(R(0), uX - .13), ban_kinh: 50, t0: 43.6, t1: 47, ngon: 6 }],
    co_cam: [{ xy: ganDat([MT[0], MT[1] + 30]), ben: 'ta', t0: 20.5 }, { xy: ganDat([XM[0], XM[1] + 90]), ben: 'ta', t0: 46 }],
    nhan: [
      { xy: [520, 700], chu: 'Nguyễn Ánh cầu viện Xiêm', ben: 'dich', t0: .6, t1: 2.2 },
      { xy: at(R(0), .06), chu: 'Hàng vạn quân Xiêm sang chiếm miền Tây Gia Định', ben: 'dich', t0: 2.4, t1: 6.7 },
      { xy: [2250, 560], chu: 'Nguyễn Huệ từ Quy Nhơn vào Nam', ben: 'ta', t0: 7.2, t1: 11 },
      { xy: at(R(0), .14), chu: 'Năm vạn quân · ba trăm chiến thuyền', ben: 'dich', t0: 12.2, t1: 16.5 },
      { xy: lang, chu: 'Đi đến đâu cướp phá đến đó', ben: 'dich', t0: 16.7, t1: 20.3 },
      { xy: MT, chu: 'Nguyễn Huệ đóng quân ở Mỹ Tho', ben: 'ta', t0: 20.5, t1: 22.7 },
      { xy: [(RG[0] + XM[0]) / 2, 640], chu: 'Trận địa Rạch Gầm – Xoài Mút', ben: 'ta', t0: 22.9, t1: 27.4 },
      { xy: at(R(0), .45), chu: 'Đêm 18 rạng sáng 19 tháng 1 năm 1785', t0: 27.6, t1: 30.6 },
      { xy: at(R(0), .5), chu: 'Nhử thủy binh Xiêm vào trận địa', ben: 'ta', t0: 30.8, t1: 35.2 },
      { xy: bacRG, chu: 'Mai phục trên bờ đổ ra', ben: 'ta', t0: 35.6, t1: 38.8 },
      { xy: NT, chu: 'Từ cù lao đánh tạt sườn', ben: 'ta', t0: 39, t1: 42.3 },
      { xy: at(R(0), uX - .08), chu: 'Chặn đầu khóa đuôi – thuyền giặc bốc cháy', ben: 'ta', t0: 42.5, t1: 47 }] };
  ghi(id, kb); }

/* ==================== NGỌC HỒI – ĐỐNG ĐA 1789 ==================== */
if (!only || only === 'dong-da-1789') { const id = 'dong-da-1789', H = moTran(id), { R, at, uNear, sub, DD, nuoc, ganDat, ganNuoc, thuy } = H;
  const TD = DD['Tam Điệp'], HH = DD['Hà Hồi'], NH = DD['Ngọc Hồi'], KT = DD['Khương Thượng'], TL = DD['Thăng Long'], CP = DD['Cầu phao Nhị Hà'];
  const uHH = uNear(R(0), HH), uNH = uNear(R(0), NH);
  const cau = sub(R(2), 0, 1, 60).filter(p => nuoc(p[0], p[1])); if (cau.length < 3) throw new Error('đường tháo chạy không cắt qua sông Nhị Hà');   // khúc qua sông = cầu phao
  const vongHH = [0, 1, 2, 3].map(i => ganDat([HH[0] + Math.cos(i * 1.57 + .4) * 40, HH[1] + Math.sin(i * 1.57 + .4) * 30]));
  const kb = { ...CHUNG, chu_co_ta: 'TÂY SƠN',
    may_quay: [[0, 1380, 1250, 560, 62, 0], [7.9, 1370, 1300, 360, 56, -8], [13.8, 1340, 1000, 640, 64, -4], [14.8, TL[0] + 10, TL[1] + 30, 320, 55, -10], [18.5, TL[0] + 10, TL[1] + 40, 340, 56, -12],
      [22.3, 1380, 1150, 420, 57, -8], [26, 1360, 900, 520, 60, -6], [27, HH[0], HH[1] + 20, 300, 55, -10], [31, HH[0], HH[1], 300, 55, -12], [33.9, NH[0], NH[1] + 20, 300, 55, -10],
      [38.5, NH[0], NH[1], 290, 55, -12], [40.8, KT[0] - 20, KT[1] + 20, 300, 55, -10], [44.5, KT[0], KT[1], 290, 55, -12], [46.4, CP[0], CP[1] + 10, 280, 54, -12], [50, CP[0] + 20, CP[1] - 5, 260, 54, -14], [53.5, CP[0] + 20, CP[1], 280, 55, -14]],
    may_quay_sau: [[0, TL[0] - 330, TL[1] + 220, 520, 62, 0], [13.2, TL[0] - 290, TL[1] + 190, 470, 60, -6]],
    doan_quan: [
      { ten: 'Đại quân Quang Trung', ben: 'ta', tuong: true, cuoi: 'voi', co: 'QUANG TRUNG', voi: 4, linh: 15, ngua: 2, gian_cach: .012, duong: 0, tu: 0, den: 0, t0: .5, t1: 1, an_sau: 18.4 },
      { ten: 'Đại quân tiến ra Bắc', ben: 'ta', tuong: true, cuoi: 'voi', co: 'QUANG TRUNG', voi: 4, linh: 15, ngua: 2, gian_cach: .012, duong: 0, tu: 0, den: uHH - .03, t0: 18.5, t1: 27 , an_sau: 33.8 },
      { ten: 'Đánh đồn Ngọc Hồi', ben: 'ta', tuong: true, cuoi: 'voi', co: 'QUANG TRUNG', voi: 4, linh: 15, ngua: 2, gian_cach: .012, duong: 0, tu: uHH - .03, den: uNH + .01, t0: 33.9, t1: 39.5, an_sau: 46.3 },
      { ten: 'Vào Thăng Long', ben: 'ta', tuong: true, cuoi: 'voi', co: 'QUANG TRUNG', voi: 4, linh: 15, ngua: 2, gian_cach: .012, duong: 0, tu: uNH + .01, den: .97, t0: 46.4, t1: 53.4 },
      { ten: 'Quân Thanh ở Thăng Long', ben: 'dich', tuong: true, co: 'TÔN', linh: 12, ngua: 3, gian_cach: .05, duong: [ganDat([TL[0] - 30, TL[1] + 30]), TL], tu: 0, den: 1, t0: 14.8, t1: 15.4, an_sau: 46.4 },
      { ten: 'Đồn Hà Hồi', ben: 'dich', linh: 6, gian_cach: .15, duong: [ganDat([HH[0], HH[1] + 20]), HH], t0: 0, t1: .2, an_sau: 31.3 },
      { ten: 'Đồn Ngọc Hồi', ben: 'dich', linh: 9, gian_cach: .12, duong: [ganDat([NH[0], NH[1] + 20]), NH], t0: 0, t1: .2, nga_tai: 38.6, an_sau: 44 },
      { ten: 'Đô đốc Long đánh Khương Thượng', ben: 'ta', tuong: true, co: 'LONG', linh: 10, ngua: 2, gian_cach: .02, duong: 1, tu: .55, den: .98, t0: 40.8, t1: 43.6 },
      { ten: 'Sầm Nghi Đống ở Khương Thượng', ben: 'dich', tuong: true, co: 'SẦM', linh: 6, gian_cach: .15, duong: [ganDat([KT[0] - 20, KT[1] + 10]), KT], t0: 0, t1: .2, nga_tai: 44.4, an_sau: 49 },
      { ten: 'Cầu phao Nhị Hà', ben: 'dich', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .2, duong: thuy(cau, 0, 1, 20), tu: 0, den: 1, t0: -2, t1: -1, ngang: 2, dam_tai: 49.8, ti_le_dam: 1 },
      { ten: 'Tôn Sĩ Nghị tháo chạy qua cầu phao', ben: 'dich', tuong: true, co: 'TÔN', linh: 12, ngua: 3, gian_cach: .03, duong: 2, tu: 0, den: .9, t0: 46.5, t1: 51.5 },
      { ten: 'Quân Thanh chết đuối', ben: 'dich', linh: 9, gian_cach: .05, duong: cau.length > 1 ? cau : 2, tu: .1, den: .9, t0: 49, t1: 50.4, nga_tai: 50.4 }],
    mui_ten: [
      { duong: [[TD[0] + 40, 1440], TD], ben: 'ta', t0: .5, t1: 6, day: 14 },
      { duong: 0, ben: 'ta', den: uHH - .02, t0: 18.6, t1: 27, day: 14 },
      { duong: 0, ben: 'ta', bat_dau: uHH - .02, den: uNH + .01, t0: 33.9, t1: 39.5, day: 14 },
      { duong: 1, ben: 'ta', t0: 40.8, t1: 43.6, day: 13 },
      { duong: 2, ben: 'dich', net: 'dut', t0: 46.5, t1: 51.5 },
      { duong: 0, ben: 'ta', bat_dau: uNH + .01, den: .97, t0: 46.4, t1: 53.4, day: 14 }],
    phuc_binh: vongHH.map((p, i) => ({ xy: p, ben: 'ta', t0: 27.4 + i * .3, huong_toi: HH })),
    lua: [{ xy: NH, ban_kinh: 48, t0: 38, t1: 45, ngon: 6 }, { xy: KT, ban_kinh: 45, t0: 43.4, t1: 50, ngon: 6 }],
    co_cam: [{ xy: ganDat([HH[0] + 15, HH[1] - 10]), ben: 'ta', t0: 31.3 }, { xy: ganDat([NH[0] + 15, NH[1] - 10]), ben: 'ta', t0: 40.2 }, { xy: ganDat([KT[0] + 15, KT[1] - 10]), ben: 'ta', t0: 45.2 }, { xy: ganDat([TL[0] - 10, TL[1] + 15]), ben: 'ta', t0: 52.5 }],
    nhan: [
      { xy: [TD[0] + 60, TD[1] - 80], chu: 'Từ Phú Xuân hành quân thần tốc', ben: 'ta', t0: .6, t1: 4 },
      { xy: [TD[0] + 60, TD[1] - 80], chu: 'Tuyển thêm quân ở Nghệ An, Thanh Hóa', ben: 'ta', t0: 4.2, t1: 7.9 },
      { xy: TD, chu: 'Tam Điệp: cho quân ăn Tết trước', ben: 'ta', t0: 8, t1: 10.4 },
      { xy: [TD[0], TD[1] - 60], chu: 'Hẹn mùng 7 vào Thăng Long mở tiệc', ben: 'ta', t0: 10.5, t1: 13.8 },
      { xy: TL, chu: 'Tôn Sĩ Nghị · 29 vạn quân Thanh, mải ăn Tết', ben: 'dich', t0: 15, t1: 21.5 },
      { xy: at(R(0), .15), chu: 'Mười vạn quân Tây Sơn · voi chiến · vua cưỡi voi chỉ huy', ben: 'ta', t0: 21.8, t1: 26 },
      { xy: HH, chu: 'Đêm mùng 3: vây đồn Hà Hồi – địch xin hàng', ben: 'ta', t0: 27.2, t1: 33.6 },
      { xy: NH, chu: 'Mờ sáng mùng 5: đánh đồn Ngọc Hồi · mộc ván bọc rơm ướt', ben: 'ta', t0: 34, t1: 40.6 },
      { xy: KT, chu: 'Đô đốc Long đánh Khương Thượng', ben: 'ta', t0: 40.9, t1: 43.4 },
      { xy: [KT[0], KT[1] + 40], chu: 'Sầm Nghi Đống thắt cổ tự tử', ben: 'dich', t0: 43.5, t1: 46.3 },
      { xy: CP, chu: 'Tôn Sĩ Nghị tháo chạy – cầu phao sập', ben: 'dich', t0: 46.6, t1: 51 },
      { xy: [CP[0] + 10, CP[1] + 40], chu: 'Quân giặc chết đuối rất nhiều', ben: 'dich', t0: 51, t1: 53.5 }] };
  ghi(id, kb); }

/* ==================== NHƯ NGUYỆT 1077 ==================== */
if (!only || only === 'nhu-nguyet-1077') { const id = 'nhu-nguyet-1077', H = moTran(id), { R, at, uNear, sub, DD, nuoc, ganDat, ganNuoc, quaSong } = H;
  const PT = DD['Phòng tuyến Như Nguyệt'], TLg = DD['Thăng Long'], CL = DD['Ải Chi Lăng'];
  // điểm sông Như Nguyệt gần phòng tuyến: tìm nước gần điểm giữa 2 bờ tuyến vượt sông; pháp tuyến = hướng vượt sông
  const R1 = R(1), giua = ganNuoc([(R1[0][0] + R1[R1.length - 1][0]) / 2, (R1[0][1] + R1[R1.length - 1][1]) / 2], 40);
  const huong = [R1[R1.length - 1][0] - R1[0][0], R1[R1.length - 1][1] - R1[0][1]], Lh = Math.hypot(...huong) || 1, nb = [-huong[0] / Lh, -huong[1] / Lh];   // nb: chỉ về bờ bắc
  const QS = quaSong(giua, nb), giua2 = ganNuoc([giua[0] - 40, giua[1] - 30], 30), QS2 = quaSong(giua2, nb);
  const bacTrai = ganDat([QS.datA[0] + nb[0] * 40, QS.datA[1] + nb[1] * 40]), trai = ganDat([QS.datA[0] + nb[0] * 70 + 40, QS.datA[1] + nb[1] * 70 - 20]);
  const bo_nam = [0, 1, 2, 3].map(i => ganDat([QS.datB[0] - nb[0] * 10 + (i - 1.5) * 34 * nb[1], QS.datB[1] - nb[1] * 10 - (i - 1.5) * 34 * nb[0]]));
  const cocTu = ganNuoc([QS.nuocB[0] + 35 * nb[1], QS.nuocB[1] - 35 * nb[0]], 45), cocDen = ganNuoc([QS.nuocB[0] - 35 * nb[1], QS.nuocB[1] + 35 * nb[0]], 45);
  const qua = (A, B) => sub([A, B], 0, 1, 12).filter(p => nuoc(p[0], p[1]) && nuoc(p[0] + 2, p[1]) && nuoc(p[0] - 2, p[1]) && nuoc(p[0], p[1] + 2) && nuoc(p[0], p[1] - 2));
  const kb = { ...CHUNG, chu_co_ta: 'LÝ', ti_le_thuyen: .3,
    may_quay: [[0, 1250, 700, 780, 70, 0], [5, 1450, 400, 600, 64, -6], [10.5, 1400, 520, 640, 64, -6], [13.4, PT[0] + 60, PT[1] - 20, 400, 58, -10], [17.2, 1000, 900, 520, 60, -8], [22, QS.datA[0] + 60, QS.datA[1] - 40, 340, 56, -12],
      [25.1, giua[0], giua[1], 260, 54, -14], [31.9, giua[0], giua[1], 250, 54, -16], [36.8, giua[0] - 10, giua[1] + 10, 250, 54, -16], [41.3, QS.datA[0] + 40, QS.datA[1] - 40, 300, 55, -12], [45.9, giua[0] + 10, giua[1] - 10, 270, 54, -14], [51.7, giua[0] + 40, giua[1] - 40, 330, 56, -14]],
    may_quay_sau: [[0, giua[0] - 300, giua[1] - 60, 640, 64, 0], [14, giua[0] - 260, giua[1] - 90, 600, 62, -6]],   // phòng tuyến lệch phải, cao hơn khối chữ
    doan_quan: [
      { ten: 'Quân Tống tiến xuống', ben: 'dich', tuong: true, co: 'QUÁCH', linh: 15, ngua: 6, gian_cach: .012, duong: 0, tu: 0, den: 1, t0: 10.5, t1: 23.5, an_sau: 51 },
      { ten: 'Dân phu, quân lương', ben: 'dich', linh: 12, ngua: 2, gian_cach: .012, duong: 0, tu: 0, den: .93, t0: 12.5, t1: 25.5, an_sau: 51 },
      { ten: 'Quân Lý giữ bờ nam', ben: 'ta', tuong: true, co: 'LÝ', linh: 9, gian_cach: .2, duong: [bo_nam[0], bo_nam[3]], t0: 25.2, t1: 25.8 },
      { ten: 'Bè quân Tống vượt sông', ben: 'dich', phuong_tien: 'thuyen', thuyen: 4, gian_cach: .25, ngang: 0, duong: qua(QS.nuocA, QS.nuocB), t0: 32, t1: 34.6, an_sau: 35 },
      { ten: 'Quân Tống chọc thủng phòng tuyến', ben: 'dich', linh: 6, gian_cach: .1, duong: [QS.datB, ganDat([QS.datB[0] - nb[0] * 40, QS.datB[1] - nb[1] * 40])], t0: 34.6, t1: 36.6, nga_tai: 37.8, an_sau: 40 },
      { ten: 'Bè quân Tống chạy về', ben: 'dich', phuong_tien: 'thuyen', thuyen: 2, gian_cach: .4, ngang: 0, duong: qua(QS2.nuocB, QS2.nuocA), t0: 37.8, t1: 40.2, an_sau: 40.6 },
      { ten: 'Quân Tống mệt mỏi, bệnh tật', ben: 'dich', linh: 8, gian_cach: .1, duong: [trai, ganDat([trai[0] + 30, trai[1] - 20])], t0: 41.2, t1: 41.6, nga_tai: 43.2, an_sau: 51 },
      { ten: 'Thuyền Lý vượt sông', ben: 'ta', phuong_tien: 'thuyen', thuyen: 5, gian_cach: .2, ngang: 0, duong: qua(QS2.nuocB, QS2.nuocA), t0: 45.9, t1: 48 },
      { ten: 'Lý Thường Kiệt tấn công bờ bắc', ben: 'ta', tuong: true, co: 'LÝ', linh: 12, ngua: 4, gian_cach: .03, duong: [QS2.datA, bacTrai, ganDat([bacTrai[0] + 60 * nb[0] + 40, bacTrai[1] + 60 * nb[1]])], t0: 48, t1: 51.6 }],
    coc: [{ tu: cocTu, den: cocDen, be_rong: 10, so: 40, huong_nghieng: nb, t0: 27.2, ti_le: .32 }],
    mui_ten: [
      { duong: [TLg, ...sub(R(0), 1, 0, 20), [1800, 0]], ben: 'ta', t0: .5, t1: 5, day: 14, an_sau: 10.4 },
      { duong: 0, ben: 'dich', net: 'dut', t0: 10.5, t1: 23.5 },
      { duong: [QS.nuocA, QS.datB], ben: 'dich', net: 'dut', t0: 32.2, t1: 35, an_sau: 40 },
      ...bo_nam.slice(1, 3).map((p, i) => ({ duong: [p, QS.datB], ben: 'ta', t0: 36.9 + i * .3, t1: 38 + i * .3, day: 11, an_sau: 44 })),
      { duong: [QS2.datB, QS2.datA, bacTrai], ben: 'ta', t0: 46, t1: 51, day: 14 },
      { duong: sub(R(0), 1, .6, 20), ben: 'dich', net: 'dut', t0: 49.6, t1: 51.7 }],
    phuc_binh: bo_nam.map((p, i) => ({ xy: p, ben: 'ta', t0: 25.3 + i * .3, huong_toi: QS.datA })),
    lua: [],
    co_cam: [{ xy: bacTrai, ben: 'ta', t0: 51 }],
    nhan: [
      { xy: [1700, 170], chu: 'Cuối 1075: quân Lý đánh sang Khâm Châu, Liêm Châu', ben: 'ta', t0: .8, t1: 5.2 },
      { xy: [1700, 170], chu: 'Đầu 1076: vây hơn 40 ngày, Ung Châu thất thủ', ben: 'ta', t0: 5.4, t1: 10.4 },
      { xy: at(R(0), .1), chu: 'Đầu 1077: quân Tống kéo sang báo thù', ben: 'dich', t0: 10.6, t1: 13.4 },
      { xy: PT, chu: 'Bị chặn ở sông Như Nguyệt', ben: 'ta', t0: 13.6, t1: 16.2 },
      { xy: at(R(0), .78), chu: 'Quách Quỳ, Triệu Tiết · 10 vạn quân', ben: 'dich', t0: 17.4, t1: 22 },
      { xy: at(R(0), .88), chu: '1 vạn ngựa · 20 vạn dân phu', ben: 'dich', t0: 22.1, t1: 25 },
      { xy: bo_nam[1], chu: 'Lý Thường Kiệt cho đắp lũy', ben: 'ta', t0: 25.2, t1: 27.1 },
      { xy: QS.nuocB, chu: 'Cọc tre dày đặc dọc bờ nam', ben: 'ta', t0: 27.3, t1: 31 },
      { xy: QS.nuocA, chu: 'Quân Tống đóng bè vượt sông', ben: 'dich', t0: 32, t1: 36.6 },
      { xy: QS.datB, chu: 'Bị đánh bật trở lại · cầm chân hàng tháng', ben: 'ta', t0: 36.9, t1: 41.2 },
      { xy: trai, chu: 'Mệt mỏi, thiếu lương, bệnh tật', ben: 'dich', t0: 41.4, t1: 45.8 },
      { xy: bacTrai, chu: 'Lý Thường Kiệt tấn công sang bờ bắc – địch thua to', ben: 'ta', t0: 46.1, t1: 51.6 }] };
  ghi(id, kb); }

/* ==================== KHỞI NGHĨA HAI BÀ TRƯNG 40 (Mê Linh → Luy Lâu) ==================== */
if (!only || only === 'luy-lau-40') { const id = 'luy-lau-40', H = moTran(id), { R, at, sub, DD, ganDat } = H;
  const ML = DD['Mê Linh'], LL = DD['Luy Lâu'];
  const g = p => ganDat(p), quanh = (c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .75]));
  const thanh4 = [[600, 300], [1900, 380], [2150, 1000], [900, 1120], [420, 900], [1700, 1260], [1300, 330], [2320, 700]].map(g);   // "hạ được 65 thành trì" (đoạn giọng 4)
  const thanh5 = [[1150, 1010], [1850, 640], [700, 700], [1450, 1180], [2000, 240], [500, 1250]].map(g);                          // "65 thành trì được giải phóng" (đoạn giọng 5)
  const vay = quanh(LL, 70, 6, .3), daiPhu = [g([1950, 500]), g([1000, 1060]), g([2050, 1080])];
  const kb = { ...CHUNG, chu_co_ta: 'TRƯNG',
    may_quay: [[0, ML[0] + 120, ML[1] + 60, 440, 58, -6], [3.3, ML[0] + 320, ML[1] + 150, 560, 60, -4], [5.6, LL[0] - 60, LL[1] - 20, 460, 58, -8], [8.2, 1420, 880, 820, 68, 0], [11.9, 1400, 860, 820, 68, 0],
      [16.2, 1300, 760, 780, 68, 2], [18.2, LL[0], LL[1], 360, 56, -10], [21, LL[0] + 10, LL[1] - 10, 360, 56, -12], [23.2, 1180, 690, 520, 60, -6], [26, 1450, 820, 600, 62, -4],
      [28.4, LL[0], LL[1], 330, 55, -12], [30.6, LL[0] + 60, LL[1] - 50, 400, 57, -14], [33, LL[0] + 180, LL[1] - 160, 500, 60, -10], [35.6, 1330, 740, 780, 68, 0], [38.2, ML[0] + 60, ML[1] + 40, 420, 58, -6], [40.4, ML[0] + 60, ML[1] + 30, 400, 57, -8]],
    may_quay_sau: [[0, 1150, 760, 760, 64, 0], [8.3, 1180, 740, 700, 62, -6]],
    doan_quan: [
      { ten: 'Trưng Trắc phất cờ ở Mê Linh', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG', voi: 3, linh: 14, ngua: 2, gian_cach: .014, duong: 0, tu: 0, den: .38, t0: .5, t1: 6.8, an_sau: 22 },
      { ten: 'Trưng Nhị', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG NHỊ', voi: 2, linh: 9, ngua: 2, gian_cach: .014, duong: 0, tu: 0, den: .2, t0: 1.6, t1: 6.8, an_sau: 22 },
      { ten: 'Nghĩa quân kéo về Luy Lâu', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG', voi: 3, linh: 14, ngua: 2, gian_cach: .014, duong: 0, tu: .38, den: .9, t0: 22, t1: 27.4 },
      { ten: 'Trưng Nhị kéo về Luy Lâu', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG NHỊ', voi: 2, linh: 9, ngua: 2, gian_cach: .014, duong: 0, tu: .2, den: .72, t0: 22, t1: 27.4 },
      { ten: 'Lạc tướng phía đông', ben: 'ta', tuong: true, co: 'LẠC', linh: 8, ngua: 1, gian_cach: .02, duong: 1, tu: .45, den: .9, t0: 24.7, t1: 28.4 },
      { ten: 'Lạc tướng Cửu Chân', ben: 'ta', tuong: true, co: 'LẠC', linh: 8, ngua: 1, gian_cach: .02, duong: 2, tu: .5, den: .92, t0: 25, t1: 28.6 },
      { ten: 'Lạc tướng Nhật Nam', ben: 'ta', tuong: true, co: 'LẠC', linh: 6, gian_cach: .025, duong: 3, tu: .4, den: .88, t0: 25.3, t1: 28.8 },
      { ten: 'Thái thú Tô Định ở Luy Lâu', ben: 'dich', tuong: true, co: 'TÔ', linh: 8, ngua: 2, gian_cach: .1, duong: [g([LL[0] + 25, LL[1] + 20]), LL], t0: 0, t1: .2, an_sau: 29.8 },
      { ten: 'Quân Hán giữ thành', ben: 'dich', linh: 7, gian_cach: .12, duong: [g([LL[0] - 30, LL[1] + 30]), g([LL[0] - 10, LL[1] + 10])], t0: 0, t1: .2, nga_tai: 30.4, an_sau: 33.5 },
      { ten: 'Tô Định bỏ thành chạy trốn', ben: 'dich', tuong: true, co: 'TÔ', linh: 4, ngua: 2, gian_cach: .03, duong: 4, tu: 0, den: .6, t0: 29.8, t1: 34 , an_sau: 35.6 }],
    mui_ten: [
      { duong: 0, ben: 'ta', den: .4, t0: .5, t1: 6.8, day: 14 },
      { duong: 1, ben: 'ta', t0: 7, t1: 10.6, day: 12 },
      { duong: 2, ben: 'ta', t0: 7.4, t1: 11, day: 12 },
      { duong: 3, ben: 'ta', t0: 7.8, t1: 11.4, day: 12 },
      { duong: 4, ben: 'dich', net: 'dut', t0: 17.2, t1: 20.8, an_sau: 21.8 },
      { duong: 0, ben: 'ta', bat_dau: .4, den: .95, t0: 22, t1: 27.4, day: 14 },
      { duong: 4, ben: 'dich', net: 'dut', t0: 29.8, t1: 34 }],
    phuc_binh: [...daiPhu.map((p, i) => ({ xy: p, ben: 'ta', t0: 8.2 + i * .4, huong_toi: LL })), ...vay.map((p, i) => ({ xy: p, ben: 'ta', t0: 27.2 + i * .2, huong_toi: LL }))],
    lua: [{ xy: LL, ban_kinh: 45, t0: 28.4, t1: 34.5, ngon: 6 }],
    co_cam: [...thanh4.map((p, i) => ({ xy: p, ben: 'ta', t0: 13.1 + i * .4 })), { xy: g([LL[0] + 12, LL[1] - 12]), ben: 'ta', t0: 32.4 }, ...thanh5.map((p, i) => ({ xy: p, ben: 'ta', t0: 33 + i * .45 })), { xy: g([ML[0] + 14, ML[1] - 14]), ben: 'ta', t0: 37 }],
    nhan: [
      { xy: ML, chu: 'Mùa xuân năm 40 · Hai Bà phất cờ ở Mê Linh', ben: 'ta', t0: .6, t1: 3.2 },
      { xy: LL, chu: 'Luy Lâu – trị sở đô hộ quận Giao Chỉ', ben: 'dich', t0: 3.5, t1: 6.7 },
      { xy: [1500, 470], chu: 'Lạc tướng khắp nơi đồng loạt hưởng ứng', ben: 'ta', t0: 7.2, t1: 11.8 },
      { xy: at(R(1), .5), chu: 'Từ Hợp Phố', ben: 'ta', t0: 7.6, t1: 11.8 },
      { xy: at(R(2), .55), chu: 'Từ Cửu Chân', ben: 'ta', t0: 8, t1: 11.8 },
      { xy: at(R(3), .5), chu: 'Từ Nhật Nam', ben: 'ta', t0: 8.4, t1: 11.8 },
      { xy: [1900, 920], chu: 'Theo sử sách: hạ được 65 thành trì', ben: 'ta', t0: 13, t1: 16.4 },
      { xy: LL, chu: 'Tô Định bỏ ấn tín, cắt tóc cạo râu trốn về nước', ben: 'dich', t0: 16.8, t1: 21 },
      { xy: at(R(0), .6), chu: 'Từ Mê Linh, nghĩa quân kéo về Luy Lâu', ben: 'ta', t0: 22.2, t1: 24.6 },
      { xy: at(R(1), .7), chu: 'Hào kiệt các nơi nổi dậy hưởng ứng', ben: 'ta', t0: 24.8, t1: 27 },
      { xy: LL, chu: 'Vây chặt trị sở Luy Lâu', ben: 'ta', t0: 27.3, t1: 29.6 },
      { xy: at(R(4), .35), chu: 'Thái thú Tô Định bỏ thành chạy trốn', ben: 'dich', t0: 29.9, t1: 32.6 },
      { xy: [1900, 920], chu: '65 thành trì được giải phóng', ben: 'ta', t0: 32.9, t1: 36.4 },
      { xy: ML, chu: 'Trưng Trắc được tôn làm vua, đóng đô ở Mê Linh', ben: 'ta', t0: 36.8, t1: 40.3 }] };
  ghi(id, kb); }

/* ==================== ĐÔNG BỘ ĐẦU 1258 ==================== */
if (!only || only === 'dong-bo-dau-1258') { const id = 'dong-bo-dau-1258', H = moTran(id), { R, at, sub, DD, ganDat, nuaRong } = H;
  /* sông Hồng hẹp, nhiều khúc cong: đẩy từng điểm đường thuyền vào GIỮA dòng (cân nước hai bên theo pháp tuyến) */
  const thuy = (...a) => { const o = H.thuy(...a); return o.map((p, i) => { const q = o[Math.max(0, i - 3)], r = o[Math.min(o.length - 1, i + 3)], dx = r[0] - q[0], dy = r[1] - q[1], L = Math.hypot(dx, dy) || 1, m = [-dy / L, dx / L], [u, v] = nuaRong(p, m); return [Math.round(p[0] + m[0] * (u - v) / 2), Math.round(p[1] + m[1] * (u - v) / 2)]; }); };
  const QH = DD['Quy Hóa'], BLN = DD['Bình Lệ Nguyên'], TL = DD['Thăng Long'], DBD = DD['Bến Đông Bộ Đầu'];
  const trai = ganDat([DBD[0] - 30, DBD[1] + 8]), boBo = ganDat([DBD[0] + 25, DBD[1] + 40]);   // trại Mông Cổ ở bến; chỗ thủy quân ta đổ bộ
  const qhPB = [.8, .86, .92].map((u, i) => { const p = at(R(3), u); return ganDat([p[0] + (i % 2 ? 55 : -50), p[1] + (i % 2 ? -35 : 40)]); });   // dân binh Quy Hóa hai bên đường rút
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .34,
    may_quay: [[0, 900, 340, 760, 66, 0], [4.9, 1100, 480, 700, 64, -4], [7.7, BLN[0], BLN[1] + 40, 440, 58, -8], [11.6, 1620, 850, 480, 58, -8], [14.4, TL[0], TL[1], 380, 56, -10],
      [18.1, 1820, 1140, 560, 60, -6], [21.4, 1810, 1120, 540, 60, -6], [25.5, 1830, 1180, 600, 62, -4], [29, 1780, 1060, 480, 58, -8], [31.6, DBD[0], DBD[1], 340, 55, -14],
      [35.3, DBD[0] - 20, DBD[1] - 10, 360, 56, -14], [38.7, 1150, 560, 720, 64, -4], [42.7, 950, 400, 640, 62, -6]],
    may_quay_sau: [[0, DBD[0] - 350, DBD[1] - 160, 760, 64, 0], [7.9, DBD[0] - 320, DBD[1] - 180, 700, 62, -6]],
    doan_quan: [
      { ten: 'Ngột Lương Hợp Thai theo sông Thao tiến xuống', ben: 'dich', tuong: true, co: 'NGỘT', linh: 14, ngua: 6, gian_cach: .012, duong: 0, t0: .5, t1: 9, an_sau: 11.4 },
      { ten: 'Quân Trần chặn đánh ở Bình Lệ Nguyên', ben: 'ta', tuong: true, co: 'TRẦN', linh: 10, ngua: 3, gian_cach: .1, duong: [ganDat([BLN[0] + 45, BLN[1] + 55]), ganDat([BLN[0] + 18, BLN[1] + 22])], t0: 7.6, t1: 8.8, an_sau: 10.2 },
      { ten: 'Quân Trần chủ động rút lui', ben: 'ta', tuong: true, co: 'TRẦN', linh: 10, ngua: 3, gian_cach: .03, duong: 1, tu: .06, den: .98, t0: 10.2, t1: 13.4, an_sau: 13.7 },
      { ten: 'Thủy quân Trần rút xuôi sông Hồng', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 6, gian_cach: .016, ngang: 4, duong: thuy(2, .02, .8), t0: 13.6, t1: 18.5, an_sau: 26.5 },
      { ten: 'Quân Mông Cổ vào Thăng Long', ben: 'dich', tuong: true, co: 'NGỘT', linh: 14, ngua: 6, gian_cach: .02, duong: 1, t0: 11.4, t1: 16, an_sau: 22 },
      { ten: 'Quân Mông Cổ đóng ở bến Đông Bộ Đầu', ben: 'dich', tuong: true, co: 'NGỘT', linh: 12, ngua: 5, gian_cach: .05, duong: [TL, trai], t0: 22, t1: 24, nga_tai: 34.2, an_sau: 37 },
      { ten: 'Vua Trần Thái Tông ngược sông Hồng', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .014, ngang: 4, duong: thuy(2, .8, .08), t0: 26.6, t1: 31.6 },
      { ten: 'Quân ta đổ bộ tập kích', ben: 'ta', tuong: true, co: 'TRẦN', linh: 12, ngua: 3, gian_cach: .05, duong: [boBo, ganDat([trai[0] + 12, trai[1] + 6])], t0: 31.6, t1: 33.8 },
      { ten: 'Ngột Lương Hợp Thai tháo chạy về Vân Nam', ben: 'dich', tuong: true, co: 'NGỘT', linh: 8, ngua: 4, gian_cach: .012, duong: 3, t0: 35.3, t1: 42.5 }],
    mui_ten: [
      { duong: 0, ben: 'dich', net: 'dut', t0: .5, t1: 9, an_sau: 22 },
      { duong: 1, ben: 'dich', net: 'dut', t0: 11.4, t1: 16, an_sau: 22 },
      { duong: sub(R(2), .02, .8), ben: 'ta', t0: 13.6, t1: 18.5, day: 12, an_sau: 26.4 },
      { duong: sub(R(2), .8, .04), ben: 'ta', t0: 26.6, t1: 31.6, day: 14 },
      { duong: [boBo, trai], ben: 'ta', t0: 31.7, t1: 33.4, day: 12 },
      { duong: 3, ben: 'dich', net: 'dut', t0: 35.3, t1: 42.5 },
      ...qhPB.map((p, i) => ({ duong: [p, at(R(3), [.8, .86, .92][i])], ben: 'ta', t0: 39 + i * .3, t1: 40.2 + i * .3, day: 11 }))],
    phuc_binh: qhPB.map((p, i) => ({ xy: p, ben: 'ta', t0: 38.8 + i * .3 })),
    lua: [{ xy: ganDat([BLN[0] + 8, BLN[1] + 10]), ban_kinh: 34, t0: 8.6, t1: 11.5, ngon: 4 }, { xy: trai, ban_kinh: 50, t0: 32.6, t1: 40, ngon: 6 }, { xy: at(R(3), .86), ban_kinh: 40, t0: 39.6, t1: 42.7, ngon: 5 }],
    co_cam: [{ xy: ganDat([DBD[0] + 10, DBD[1] - 14]), ben: 'ta', t0: 36.6 }, { xy: ganDat([TL[0] - 14, TL[1] + 14]), ben: 'ta', t0: 37.6 }],
    nhan: [
      { xy: at(R(0), .25), chu: 'Từ Vân Nam, Ngột Lương Hợp Thai theo sông Thao tiến xuống', ben: 'dich', t0: .6, t1: 4.8 },
      { xy: at(R(0), .62), chu: 'Ngày 17 tháng 1 năm 1258', t0: 5, t1: 7.5 },
      { xy: BLN, chu: 'Chặn đánh ở Bình Lệ Nguyên rồi chủ động rút lui', ben: 'ta', t0: 7.8, t1: 11.4 },
      { xy: TL, chu: 'Bỏ trống kinh thành Thăng Long', ben: 'ta', t0: 11.7, t1: 14.2 },
      { xy: TL, chu: 'Thành trống, không lương thực', ben: 'dich', t0: 14.5, t1: 18 },
      { xy: at(R(2), .78), chu: 'Thái sư Trần Thủ Độ tâu vua', ben: 'ta', t0: 18.2, t1: 21.2 },
      { xy: at(R(2), .78), chu: '"Đầu thần chưa rơi xuống đất, xin bệ hạ đừng lo"', ben: 'ta', t0: 21.4, t1: 25.3 },
      { xy: at(R(2), .55), chu: 'Đêm 28 tháng 1 · vua và thái tử Trần Hoảng ngược sông Hồng', ben: 'ta', t0: 25.6, t1: 30.3 },
      { xy: DBD, chu: 'Rạng sáng 29: tập kích bến Đông Bộ Đầu', ben: 'ta', t0: 30.6, t1: 35 },
      { xy: at(R(3), .3), chu: 'Địch tháo chạy theo đường cũ về Vân Nam', ben: 'dich', t0: 35.4, t1: 38.6 },
      { xy: QH, chu: 'Dân binh Quy Hóa chặn đánh tơi bời', ben: 'ta', t0: 38.8, t1: 42.6 }] };
  ghi(id, kb); }

/* ==================== TÂY KẾT – VẠN KIẾP 1285 ==================== */
if (!only || only === 'tay-ket-1285') { const id = 'tay-ket-1285', H = moTran(id), { R, at, sub, nrm, nuaRong, DD, ganDat } = H;
  const thuy = (...a) => { const o = H.thuy(...a); return o.map((p, i) => { const q = o[Math.max(0, i - 3)], r = o[Math.min(o.length - 1, i + 3)], dx = r[0] - q[0], dy = r[1] - q[1], L = Math.hypot(dx, dy) || 1, m = [-dy / L, dx / L], [u, v] = nuaRong(p, m); return [Math.round(p[0] + m[0] * (u - v) / 2), Math.round(p[1] + m[1] * (u - v) / 2)]; }); };   // đường thuyền giữa dòng
  const TL = DD['Thăng Long'], VK = DD['Vạn Kiếp'], TK = DD['Tây Kết'];
  const uPB = .9, C = H.veLong(at(R(2), uPB)), n = nrm(R(2), uPB), [ha, hb] = nuaRong(C, n);
  const bo = (u, s) => { const p = at(R(2), u), m = nrm(R(2), u); return ganDat([p[0] + m[0] * s, p[1] + m[1] * s]); };
  const tkPB = [bo(.88, ha + 28), bo(.88, -(hb + 28)), bo(.95, ha + 28), bo(.95, -(hb + 28))];   // mai phục hai bờ Tây Kết
  const goc = ganDat([1300, 760]), tkDong = ganDat([C[0] + n[0] * (ha + 70), C[1] + n[1] * (ha + 70)]);   // nơi Hưng Đạo Vương chia quân; cánh nam dừng ở bờ đông Tây Kết
  const vkPB = [0, 1, 2].map(i => ganDat([VK[0] + Math.cos(i * 2.1 + .3) * 55, VK[1] + Math.sin(i * 2.1 + .3) * 40]));
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .5,
    may_quay: [[0, TL[0] + 80, TL[1] + 30, 520, 60, -6], [3.4, 1150, 980, 720, 64, -4], [8.6, 1200, 820, 780, 68, 0], [11.4, TK[0] + 40, TK[1] + 60, 480, 58, -8], [14.2, 1300, 650, 560, 60, -6],
      [17.1, VK[0] - 40, VK[1] + 50, 420, 57, -10], [19.8, TK[0] + 20, TK[1] + 60, 420, 57, -10], [23.7, TK[0] + 30, TK[1] + 60, 360, 55, -12], [27.3, 1100, 900, 560, 60, -8], [28.2, 1250, 600, 620, 62, -6],
      [31.6, VK[0] - 10, VK[1] + 30, 380, 56, -12], [34.5, 1620, 400, 480, 58, -10], [39.2, 1720, 280, 560, 60, -8]],
    may_quay_sau: [[0, 850, 960, 790, 64, 0], [8.3, 870, 940, 740, 62, -6]],
    doan_quan: [
      { ten: 'Thoát Hoan ở Thăng Long', ben: 'dich', tuong: true, co: 'THOÁT', linh: 12, ngua: 4, gian_cach: .08, duong: [ganDat([TL[0] + 30, TL[1] + 30]), ganDat([TL[0] + 12, TL[1] + 6])], t0: 0, t1: .2, an_sau: 27.5 },
      { ten: 'Thủy quân Toa Đô ngược sông Hồng', ben: 'dich', tuong: true, co: 'TOA', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .016, ngang: 5, duong: thuy(2, .04, .74), t0: 3.4, t1: 19.6, an_sau: 19.8 },
      { ten: 'Toa Đô lọt vào trận mai phục', ben: 'dich', tuong: true, co: 'TOA', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .016, ngang: 5, duong: thuy(2, .74, .97), t0: 19.8, t1: 22.2, dam_tai: 22.4, ti_le_dam: .85, chay: true, nga_tai: 23.8 },
      { ten: 'Ô Mã Nhi lẻn ra biển', ben: 'dich', tuong: true, co: 'Ô', phuong_tien: 'thuyen', lon: true, thuyen: 2, gian_cach: .04, ngang: 4, duong: thuy(2, .72, .05), t0: 24.6, t1: 29, an_sau: 29.4 },
      { ten: 'Cánh quân đón đánh ở Tây Kết', ben: 'ta', tuong: true, co: 'TRẦN', linh: 12, ngua: 3, gian_cach: .03, duong: [goc, ganDat([(goc[0] + tkDong[0]) / 2 + 40, (goc[1] + tkDong[1]) / 2]), tkDong], t0: 11.4, t1: 14 },
      { ten: 'Hưng Đạo Vương chặn ở Vạn Kiếp', ben: 'ta', tuong: true, co: 'HƯNG ĐẠO', linh: 14, ngua: 4, gian_cach: .03, duong: [goc, ganDat([(goc[0] + VK[0]) / 2, (goc[1] + VK[1]) / 2 + 20]), ganDat([VK[0] - 10, VK[1] + 28])], t0: 14.2, t1: 17 },
      { ten: 'Thoát Hoan tháo chạy qua Vạn Kiếp', ben: 'dich', tuong: true, co: 'THOÁT', linh: 12, ngua: 4, gian_cach: .015, duong: 0, t0: 27.5, t1: 31.6, an_sau: 34.4 },
      { ten: 'Lý Hằng trúng tên độc', ben: 'dich', tuong: true, co: 'LÝ HẰNG', linh: 6, ngua: 1, gian_cach: .1, duong: [ganDat([VK[0] - 90, VK[1] + 10]), ganDat([VK[0] - 55, VK[1] + 4])], t0: 31.6, t1: 32.2, nga_tai: 32.8, an_sau: 37 },
      { ten: 'Thoát Hoan chui ống đồng chạy về nước', ben: 'dich', tuong: true, co: 'THOÁT', linh: 6, ngua: 2, gian_cach: .02, duong: 1, t0: 34.5, t1: 39.1 }],
    mui_ten: [
      { duong: 0, ben: 'dich', net: 'dut', den: .45, t0: .5, t1: 3.3, an_sau: 8.6 },
      { duong: sub(R(2), 0, .74), ben: 'dich', net: 'dut', t0: 3.4, t1: 19.6 },
      { duong: [goc, tkDong], ben: 'ta', t0: 9, t1: 11.2, day: 13, an_sau: 27 },
      { duong: [goc, VK], ben: 'ta', t0: 9.2, t1: 11.4, day: 13, an_sau: 27 },
      ...tkPB.map((p, i) => ({ duong: [p, at(R(2), i < 2 ? .88 : .95)], ben: 'ta', t0: 20.2 + i * .25, t1: 21.4 + i * .25, day: 11 })),
      { duong: sub(R(2), .72, 0), ben: 'dich', net: 'dut', t0: 24.6, t1: 29 },
      { duong: 0, ben: 'dich', net: 'dut', t0: 27.5, t1: 31.6 },
      ...vkPB.map((p, i) => ({ duong: [p, at(R(0), .93)], ben: 'ta', t0: 31.4 + i * .25, t1: 32.6 + i * .25, day: 11 })),
      { duong: 1, ben: 'dich', net: 'dut', t0: 34.5, t1: 39.1 }],
    phuc_binh: [...tkPB.map((p, i) => ({ xy: p, ben: 'ta', t0: 20 + i * .25 })), ...vkPB.map((p, i) => ({ xy: p, ben: 'ta', t0: 31.2 + i * .25, huong_toi: at(R(0), .93) }))],
    lua: [{ xy: C, ban_kinh: 50, t0: 22.4, t1: 28, ngon: 6 }, { xy: at(R(2), .86), ban_kinh: 40, t0: 23, t1: 28, ngon: 5 }, { xy: ganDat([VK[0] - 60, VK[1] + 6]), ban_kinh: 44, t0: 32.2, t1: 39, ngon: 6 }],
    co_cam: [{ xy: tkDong, ben: 'ta', t0: 26.4 }, { xy: ganDat([VK[0] + 14, VK[1] - 12]), ben: 'ta', t0: 36 }, { xy: ganDat([TL[0] - 12, TL[1] + 14]), ben: 'ta', t0: 37 }],
    nhan: [
      { xy: TL, chu: 'Mất Thăng Long, Thoát Hoan tính đường rút về phía bắc', ben: 'dich', t0: .6, t1: 3.3 },
      { xy: at(R(2), .3), chu: 'Toa Đô không hay biết, vẫn ngược sông Hồng định hội quân', ben: 'dich', t0: 3.6, t1: 8.8 },
      { xy: goc, chu: 'Hưng Đạo Vương bố trí quân chặn hai ngả', ben: 'ta', t0: 9.1, t1: 11.3 },
      { xy: TK, chu: 'Một cánh đón đánh đạo quân phía nam ở Tây Kết', ben: 'ta', t0: 11.5, t1: 14 },
      { xy: VK, chu: 'Cánh kia chặn đường rút ở Vạn Kiếp – bên sông Lục Đầu', ben: 'ta', t0: 14.3, t1: 19.6 },
      { xy: tkPB[0], chu: 'Mai phục ở Tây Kết đánh tan đạo quân phía nam', ben: 'ta', t0: 20.2, t1: 23.5 },
      { xy: C, chu: 'Toa Đô bị chém đầu', ben: 'dich', t0: 23.8, t1: 25.4 },
      { xy: at(R(2), .45), chu: 'Ô Mã Nhi lẻn ra biển trốn về', ben: 'dich', t0: 25.6, t1: 27.6 },
      { xy: at(R(0), .5), chu: 'Thoát Hoan tháo chạy qua Vạn Kiếp', ben: 'dich', t0: 28.3, t1: 31.6 },
      { xy: [VK[0] - 70, VK[1] + 8], chu: 'Phó tướng Lý Hằng trúng tên độc tử trận', ben: 'dich', t0: 32, t1: 34.4 },
      { xy: at(R(1), .45), chu: 'Tương truyền Thoát Hoan chui vào ống đồng chạy về nước', ben: 'dich', t0: 34.6, t1: 39 }] };
  ghi(id, kb); }

/* ==================== LÃNG BẠC 43 ==================== */
if (!only || only === 'lang-bac-43') { const id = 'lang-bac-43', H = moTran(id), { R, at, DD, ganDat } = H;
  const LB = DD['Lãng Bạc'], ML = DD['Mê Linh'], CK = DD['Cấm Khê'], HM = DD['Đền Hát Môn'], DN = DD['Đền Đồng Nhân'];
  const quanh = (c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .75]));
  const kb = { ...CHUNG, chu_co_ta: 'TRƯNG',
    may_quay: [[0, 1900, 660, 640, 62, 0], [4.7, 1560, 660, 480, 58, -4], [10.2, LB[0] + 40, LB[1], 380, 56, -8], [12.5, 1700, 660, 520, 60, -6], [19.1, 1500, 670, 600, 62, -4],
      [20.1, (LB[0] + ML[0]) / 2, LB[1], 480, 58, -6], [23.1, LB[0], LB[1], 330, 55, -10], [27.5, LB[0] - 40, LB[1] + 10, 360, 56, -12], [32.1, (CK[0] + LB[0]) / 2, 720, 620, 62, -4], [33.1, HM[0] + 120, HM[1] + 80, 380, 56, -8], [38.5, HM[0] + 120, HM[1] + 90, 360, 56, -10]],
    may_quay_sau: [[0, (HM[0] + DN[0]) / 2 + 300, (HM[1] + DN[1]) / 2 - 40, 640, 64, 0], [11.7, (HM[0] + DN[0]) / 2 + 270, (HM[1] + DN[1]) / 2 - 60, 600, 62, -6]],
    doan_quan: [
      { ten: 'Mã Viện tiến vào Lãng Bạc', ben: 'dich', tuong: true, co: 'MÃ', linh: 15, ngua: 5, gian_cach: .016, duong: 0, tu: 0, den: 1, t0: .5, t1: 9.6 },
      { ten: 'Hai Bà nghênh chiến', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG', voi: 3, linh: 14, ngua: 2, gian_cach: .02, duong: 1, tu: 0, den: .96, t0: 20.1, t1: 23.4, an_sau: 27.5 },
      { ten: 'Nghĩa quân lui về Cấm Khê', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRƯNG', voi: 2, linh: 10, gian_cach: .02, duong: 2, tu: 0, den: 1, t0: 27.6, t1: 32.2, an_sau: 36.8 }],
    mui_ten: [
      { duong: 0, ben: 'dich', net: 'dut', t0: .5, t1: 9.6 },
      { duong: 1, ben: 'ta', t0: 20.1, t1: 23.4, day: 14 },
      { duong: 2, ben: 'ta', t0: 27.6, t1: 32.2, day: 13 },
      { duong: 2, ben: 'dich', net: 'dut', den: .7, t0: 29, t1: 33 }],
    phuc_binh: quanh(LB, 55, 4, .5).map((p, i) => ({ xy: p, ben: 'ta', t0: 23.3 + i * .25, huong_toi: LB })),
    lua: [{ xy: LB, ban_kinh: 48, t0: 23.6, t1: 30, ngon: 6 }],
    co_cam: [{ xy: ganDat([LB[0] + 14, LB[1] - 12]), ben: 'dich', t0: 28.4 }],
    nhan: [
      { xy: at(R(0), .35), chu: 'Mã Viện theo đường ven biển tiến vào', ben: 'dich', t0: .6, t1: 4.6 },
      { xy: LB, chu: 'Lãng Bạc – thường xác định ở Tiên Du, Bắc Ninh (còn nhiều ý kiến)', t0: 4.8, t1: 10.2 },
      { xy: at(R(0), .5), chu: 'Theo Hậu Hán thư: khoảng 2 vạn quân, hơn 2.000 thuyền xe', ben: 'dich', t0: 11.3, t1: 16.6 },
      { xy: at(R(0), .75), chu: 'Đạo quân tinh nhuệ của nhà Hán', ben: 'dich', t0: 16.7, t1: 19.1 },
      { xy: at(R(1), .5), chu: 'Hai Bà đem quân nghênh chiến ở Lãng Bạc', ben: 'ta', t0: 20.2, t1: 23.1 },
      { xy: LB, chu: 'Trận đánh diễn ra ác liệt', ben: 'ta', t0: 23.2, t1: 27.5 },
      { xy: CK, chu: 'Nghĩa quân lui về Cấm Khê, tiếp tục chiến đấu', ben: 'ta', t0: 27.7, t1: 32.1 },
      { xy: HM, chu: 'Truyền thuyết: Hai Bà gieo mình xuống dòng Hát Giang, giữ trọn khí tiết', ben: 'ta', t0: 33.2, t1: 38.5 }] };
  ghi(id, kb); }

/* ==================== BỒ ĐIỀN 248 (khởi nghĩa Bà Triệu) ==================== */
if (!only || only === 'bo-dien-248') { const id = 'bo-dien-248', H = moTran(id), { R, at, DD, ganDat } = H;
  const NN = DD['Núi Nưa'], BD = DD['Căn cứ Bồ Điền'], NT = DD['Núi Tùng'], TP = DD['Thành Tư Phố'];
  const quanh = (c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .75]));
  const nui = [ganDat([BD[0] - 120, BD[1] + 60]), ganDat([BD[0] - 60, BD[1] + 130]), ganDat([at(R(2), .55)[0] - 70, at(R(2), .55)[1]]), ganDat([at(R(2), .55)[0] + 80, at(R(2), .55)[1] + 20])];
  const kb = { ...CHUNG, chu_co_ta: 'TRIỆU',
    may_quay: [[0, NN[0] + 60, NN[1] - 80, 420, 58, -4], [1.3, (NN[0] + TP[0]) / 2 + 40, 900, 620, 62, -4], [5.3, BD[0] - 60, BD[1] + 30, 420, 57, -8], [8.1, at(R(2), .4)[0], at(R(2), .4)[1] + 60, 520, 60, -6],
      [14.7, BD[0] - 30, BD[1] - 40, 440, 58, -8], [18.2, BD[0] - 60, BD[1] + 30, 400, 57, -10], [22.5, BD[0], BD[1], 340, 55, -12], [25.9, BD[0] + 10, BD[1] - 10, 330, 55, -12], [29.7, NT[0], NT[1] + 10, 300, 54, -14], [34.3, NT[0], NT[1] + 10, 320, 55, -14]],
    may_quay_sau: [[0, BD[0] - 330, BD[1] + 120, 640, 64, 0], [8, BD[0] - 300, BD[1] + 100, 600, 62, -6]],
    doan_quan: [
      { ten: 'Bà Triệu khởi nghĩa từ núi Nưa', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRIỆU', voi: 3, linh: 14, ngua: 2, gian_cach: .016, duong: 0, tu: 0, den: .85, t0: .5, t1: 5.2, an_sau: 7.2 },
      { ten: 'Lấy Bồ Điền làm căn cứ', ben: 'ta', tuong: true, cuoi: 'voi', co: 'TRIỆU', voi: 3, linh: 14, ngua: 2, gian_cach: .02, duong: 1, tu: 0, den: 1, t0: 5.3, t1: 7.2, nga_tai: 30.6 },
      { ten: 'Lục Dận đem quân sang', ben: 'dich', tuong: true, co: 'LỤC', linh: 15, ngua: 4, gian_cach: .02, duong: 2, tu: 0, den: .82, t0: 8.1, t1: 14.6 }],
    mui_ten: [
      { duong: 0, ben: 'ta', t0: .5, t1: 5.2, day: 14 },
      { duong: 1, ben: 'ta', t0: 5.3, t1: 7.2, day: 13 },
      { duong: 2, ben: 'dich', net: 'dut', den: .9, t0: 8.1, t1: 14.6 },
      ...nui.map((p, i) => ({ duong: [p, at(R(2), .55 + i * .08)], ben: 'ta', t0: 16 + i * .6, t1: 17.4 + i * .6, day: 11 }))],
    phuc_binh: [...nui.map((p, i) => ({ xy: p, ben: 'ta', t0: 15.8 + i * .6, huong_toi: at(R(2), .6) })), ...quanh(BD, 75, 6, .3).map((p, i) => ({ xy: p, ben: 'dich', t0: 22.6 + i * .25, huong_toi: BD }))],
    lua: [{ xy: at(R(2), .62), ban_kinh: 40, t0: 17.4, t1: 22.4, ngon: 5 }, { xy: BD, ban_kinh: 46, t0: 26, t1: 34, ngon: 6 }],
    co_cam: [...[.3, .5, .7, .95].map((u, i) => ({ xy: ganDat(at(R(0), u)), ben: 'ta', t0: 1.8 + i * .9 })), { xy: ganDat([TP[0] + 12, TP[1] - 10]), ben: 'ta', t0: 3.2 }],
    nhan: [
      { xy: NN, chu: 'Từ núi Nưa, nghĩa quân Bà Triệu khởi nghĩa', ben: 'ta', t0: .5, t1: 1.6 },
      { xy: at(R(0), .6), chu: 'Đánh chiếm nhiều thành ấp ở Cửu Chân rồi Giao Chỉ', ben: 'ta', t0: 1.7, t1: 5.3 },
      { xy: BD, chu: 'Lấy Bồ Điền làm căn cứ', ben: 'ta', t0: 5.4, t1: 7.1 },
      { xy: at(R(2), .3), chu: 'Nhà Ngô sai Lục Dận đem khoảng 8.000 quân sang', ben: 'dich', t0: 8.2, t1: 12.4 },
      { xy: at(R(2), .6), chu: 'Vừa đánh vừa dùng của cải mua chuộc', ben: 'dich', t0: 12.5, t1: 14.7 },
      { xy: nui[2], chu: 'Dựa vào núi rừng Cửu Chân, đánh nhiều trận', ben: 'ta', t0: 15.8, t1: 20.4 },
      { xy: at(R(2), .8), chu: 'Mua chuộc, chia rẽ rồi dồn quân vây Bồ Điền', ben: 'dich', t0: 20.6, t1: 25.9 },
      { xy: BD, chu: 'Cuộc chiến kéo dài nhiều tháng', ben: 'ta', t0: 26, t1: 29.6 },
      { xy: NT, chu: 'Bà Triệu hy sinh trên núi Tùng khi mới 23 tuổi', ben: 'ta', t0: 29.8, t1: 34.2 }] };
  ghi(id, kb); }

/* ==================== VẠN XUÂN 542 (khởi nghĩa Lý Bí) ==================== */
if (!only || only === 'van-xuan-542') { const id = 'van-xuan-542', H = moTran(id), { R, at, DD, ganDat } = H;
  const LB = DD['Thành Long Biên'], HP = DD['Hướng Hợp Phố'], CD = DD['Hướng Cửu Đức'];
  const quanh = (c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .75]));
  const ba = [0, 1, 2], hd = (i, t0, t1, an) => ({ ten: 'Nghĩa quân ' + ['phía tây', 'phía bắc', 'phía nam'][i], ben: 'ta', tuong: i === 0, co: 'LÝ BÍ', linh: 10, ngua: 2, gian_cach: .018, duong: i, tu: 0, den: .97, t0, t1, an_sau: an });
  const kb = { ...CHUNG, chu_co_ta: 'VẠN XUÂN',
    may_quay: [[0, LB[0], LB[1] + 40, 480, 58, -4], [3.7, (LB[0] + HP[0]) / 2, (LB[1] + HP[1]) / 2 + 60, 640, 62, -4], [7.1, HP[0] - 120, HP[1] + 90, 440, 58, -6], [10.3, (LB[0] + HP[0]) / 2 + 100, (LB[1] + HP[1]) / 2, 560, 60, -4],
      [17.4, HP[0] - 100, HP[1] + 80, 420, 57, -6], [20.3, LB[0], LB[1] + 30, 420, 57, -6], [23.7, LB[0] + 80, LB[1] - 30, 420, 57, -8], [27.6, (LB[0] + HP[0]) / 2 + 120, (LB[1] + HP[1]) / 2, 560, 60, -4],
      [32.8, (LB[0] + CD[0]) / 2, (LB[1] + CD[1]) / 2, 600, 62, -4], [36.1, LB[0], LB[1] + 20, 360, 56, -8], [41.9, LB[0], LB[1] + 10, 340, 55, -10]],
    may_quay_sau: [[0, LB[0] - 300, LB[1] + 160, 620, 64, 0], [6.7, LB[0] - 270, LB[1] + 140, 580, 62, -6]],
    doan_quan: [
      ...ba.map(i => hd(i, .5, 3.6, 10)),
      { ten: 'Tiêu Tư bỏ chạy', ben: 'dich', tuong: true, co: 'TIÊU', linh: 6, ngua: 3, gian_cach: .03, duong: 3, tu: 0, den: .55, t0: 1.6, t1: 6.5, an_sau: 9 },
      { ten: 'Quân Lương kéo sang', ben: 'dich', tuong: true, co: 'LƯƠNG', linh: 14, ngua: 4, gian_cach: .05, duong: 4, tu: 0, den: 1, t0: 10.4, t1: 14.2, nga_tai: 16.2, an_sau: 20 },
      ...ba.map(i => ({ ...hd(i, 20.3, 23.6), ten: hd(i).ten + ' vây Long Biên' })),
      { ten: 'Tiêu Tư mang của cải trốn về phương Bắc', ben: 'dich', tuong: true, co: 'TIÊU', linh: 6, ngua: 3, gian_cach: .03, duong: 3, tu: 0, den: .9, t0: 23.7, t1: 27.5, an_sau: 28 },
      { ten: 'Phạm Tu đánh Lâm Ấp', ben: 'ta', tuong: true, co: 'PHẠM TU', linh: 10, ngua: 3, gian_cach: .02, duong: 5, tu: 0, den: .95, t0: 32.8, t1: 36 }],
    mui_ten: [
      ...ba.map(i => ({ duong: i, ben: 'ta', t0: .5, t1: 3.6, day: 13, an_sau: 10 })),
      { duong: 3, ben: 'dich', net: 'dut', den: .6, t0: 1.6, t1: 6.5, an_sau: 9 },
      { duong: 4, ben: 'dich', net: 'dut', t0: 4, t1: 7, an_sau: 9.5 },
      { duong: [ganDat([HP[0] - 260, HP[1] + 160]), ganDat([HP[0] - 90, HP[1] + 60])], ben: 'ta', t0: 6.4, t1: 8.6, day: 14, an_sau: 9.5 },
      { duong: 4, ben: 'dich', net: 'dut', t0: 10.4, t1: 14.2 },
      { duong: [ganDat([HP[0] - 280, HP[1] + 170]), ganDat([HP[0] - 100, HP[1] + 70])], ben: 'ta', t0: 13.4, t1: 15.4, day: 14 },
      ...ba.map(i => ({ duong: i, ben: 'ta', t0: 20.3, t1: 23.6, day: 13 })),
      { duong: 3, ben: 'dich', net: 'dut', t0: 23.7, t1: 27.5 },
      { duong: 5, ben: 'ta', t0: 32.8, t1: 36, day: 14 }],
    phuc_binh: quanh(LB, 60, 6, .2).map((p, i) => ({ xy: p, ben: 'ta', t0: 20.4 + i * .2, huong_toi: LB })),
    lua: [{ xy: ganDat([HP[0] - 110, HP[1] + 70]), ban_kinh: 42, t0: 7.4, t1: 9.4, ngon: 5 }, { xy: ganDat([HP[0] - 120, HP[1] + 80]), ban_kinh: 50, t0: 14.6, t1: 19.5, ngon: 6 }, { xy: ganDat([HP[0] - 110, HP[1] + 70]), ban_kinh: 44, t0: 29.6, t1: 33, ngon: 5 }],
    co_cam: [{ xy: ganDat([LB[0] + 14, LB[1] - 12]), ben: 'ta', t0: 3.2 }, { xy: ganDat([CD[0] + 20, CD[1] - 30]), ben: 'ta', t0: 35.4 }, { xy: ganDat([LB[0] - 18, LB[1] + 14]), ben: 'ta', t0: 36.6 }],
    nhan: [
      { xy: LB, chu: 'Nghĩa quân Lý Bí chiếm thành Long Biên', ben: 'ta', t0: .5, t1: 3.6 },
      { xy: at(R(3), .4), chu: 'Thứ sử Tiêu Tư bỏ chạy', ben: 'dich', t0: 1.8, t1: 4.6 },
      { xy: HP, chu: 'Nhà Lương hai lần sai quân sang – trận lớn nhất ở Hợp Phố', ben: 'ta', t0: 3.8, t1: 9.3 },
      { xy: at(R(4), .5), chu: 'Theo sử cũ: đầu năm 543 quân Lương kéo sang lần nữa', ben: 'dich', t0: 10.4, t1: 14.1 },
      { xy: HP, chu: 'Bị đón đánh tan tác ở Hợp Phố – mười phần chết bảy tám', ben: 'ta', t0: 14.2, t1: 19.3 },
      { xy: LB, chu: 'Nghĩa quân từ nhiều ngả kéo về vây Long Biên', ben: 'ta', t0: 20.4, t1: 23.6 },
      { xy: at(R(3), .5), chu: 'Tiêu Tư khiếp sợ, đem của cải trốn về phương Bắc', ben: 'dich', t0: 23.8, t1: 27.6 },
      { xy: HP, chu: 'Năm 543: quân Lương sang báo thù, lại bị đánh bại ở Hợp Phố', ben: 'ta', t0: 27.7, t1: 32.7 },
      { xy: at(R(5), .7), chu: 'Phạm Tu đánh tan quân Lâm Ấp ở Cửu Đức', ben: 'ta', t0: 32.9, t1: 36 },
      { xy: LB, chu: 'Xuân 544: Lý Bí lên ngôi Lý Nam Đế · quốc hiệu Vạn Xuân', ben: 'ta', t0: 36.2, t1: 41.6 }] };
  ghi(id, kb); }

/* ==================== DẠ TRẠCH 550 (Triệu Quang Phục) ==================== */
if (!only || only === 'da-trach-550') { const id = 'da-trach-550', H = moTran(id), { R, at, DD, ganDat, thuy } = H;
  const DT = DD['Đầm Dạ Trạch'], BN = DD['Bãi nổi'], LB = DD['Thành Long Biên'], C = at(R(0), 0);
  const quanh = (c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .78]));
  const tam = [(BN[0] + DT[0]) / 2, BN[1] - 20], vong = quanh([BN[0] + 30, BN[1] - 20], 165, 7, .4), traiDong = ganDat(at(R(0), 1)), traiBac = ganDat(at(R(1), 1));
  const ra0 = thuy(0), ve0 = thuy(0, 1, 0), ra1 = thuy(1), ve1 = thuy(1, 1, 0);
  const kb = { ...CHUNG, chu_co_ta: 'TRIỆU',
    may_quay: [[0, tam[0], tam[1], 520, 62, -4], [4.1, tam[0], tam[1], 360, 56, -8], [9.1, BN[0] + 20, BN[1] - 20, 330, 55, -10], [14, BN[0] + 40, BN[1] - 20, 300, 54, -12], [18, tam[0], tam[1] - 40, 460, 60, -6],
      [21.7, BN[0] + 30, BN[1] - 20, 320, 55, -12], [26.3, BN[0] + 40, BN[1] - 30, 320, 55, -12], [31, (BN[0] + LB[0]) / 2 + 60, 620, 720, 66, 0], [35.3, (BN[0] + LB[0]) / 2, 600, 720, 66, 0], [39.8, LB[0], LB[1] + 60, 420, 58, -6]],
    may_quay_sau: [[0, BN[0] - 300, BN[1] - 150, 620, 64, 0], [7.5, BN[0] - 270, BN[1] - 170, 580, 62, -6]],
    doan_quan: [
      { ten: 'Nghĩa quân trên bãi nổi', ben: 'ta', tuong: true, co: 'TRIỆU', linh: 9, gian_cach: .25, duong: [ganDat([BN[0] - 14, BN[1] + 4]), ganDat([BN[0] + 14, BN[1] - 4])], t0: 0, t1: .2, an_sau: 35.2 },
      { ten: 'Thuyền độc mộc đêm đánh úp (đông)', ben: 'ta', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .25, ngang: 0, duong: ra0, t0: 14, t1: 16.6, an_sau: 17 },
      { ten: 'Thuyền độc mộc đánh úp trại đông', ben: 'ta', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .25, ngang: 0, duong: ra0, t0: 21.8, t1: 24, an_sau: 24.6 },
      { ten: 'Thuyền rút vào đầm (đông)', ben: 'ta', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .25, ngang: 0, duong: ve0, t0: 26.4, t1: 28.6, an_sau: 29 },
      { ten: 'Thuyền độc mộc đánh úp trại bắc', ben: 'ta', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .25, ngang: 0, duong: ra1, t0: 22.4, t1: 24.6, an_sau: 25.2 },
      { ten: 'Thuyền rút vào đầm (bắc)', ben: 'ta', phuong_tien: 'thuyen', thuyen: 3, gian_cach: .25, ngang: 0, duong: ve1, t0: 27, t1: 29.2, an_sau: 29.6 },
      { ten: 'Trần Bá Tiên vây đầm', ben: 'dich', tuong: true, co: 'BÁ TIÊN', linh: 9, ngua: 3, gian_cach: .3, duong: [ganDat([DT[0] + 80, DT[1] - 90]), ganDat([DT[0] + 120, DT[1] - 110])], t0: 18, t1: 18.4, an_sau: 31 },
      { ten: 'Trần Bá Tiên rút về nước', ben: 'dich', tuong: true, co: 'BÁ TIÊN', linh: 9, ngua: 3, gian_cach: .03, duong: 2, tu: 0, den: 1, t0: 31.1, t1: 35.2 },
      { ten: 'Triệu Quang Phục đánh lấy Long Biên', ben: 'ta', tuong: true, co: 'TRIỆU', linh: 14, ngua: 3, gian_cach: .02, duong: 3, tu: 0, den: .97, t0: 35.3, t1: 39.4 }],
    mui_ten: [
      { duong: ra0, ben: 'ta', t0: 14, t1: 16.4, day: 10, an_sau: 18 }, { duong: ra0, ben: 'ta', t0: 21.8, t1: 24, day: 10, an_sau: 30 }, { duong: ra1, ben: 'ta', t0: 22.4, t1: 24.6, day: 10, an_sau: 30 },
      { duong: 2, ben: 'dich', net: 'dut', t0: 31.1, t1: 35.2 }, { duong: 3, ben: 'ta', t0: 35.3, t1: 39.4, day: 14 }],
    phuc_binh: vong.map((p, i) => ({ xy: p, ben: 'dich', t0: 18.1 + i * .2, huong_toi: BN })),
    lua: [{ xy: traiDong, ban_kinh: 34, t0: 24.2, t1: 29, ngon: 5 }, { xy: traiBac, ban_kinh: 30, t0: 24.8, t1: 29, ngon: 4 }, { xy: ganDat([LB[0] + 20, LB[1] + 30]), ban_kinh: 40, t0: 38.4, t1: 39.8, ngon: 5 }],
    co_cam: [{ xy: ganDat([BN[0] + 6, BN[1] - 16]), ben: 'ta', t0: 9.4 }, { xy: ganDat([LB[0] + 12, LB[1] + 14]), ben: 'ta', t0: 39.2 }],
    nhan: [
      { xy: DT, chu: 'Đầm Dạ Trạch – vùng Khoái Châu, Hưng Yên ngày nay', ben: 'ta', t0: .5, t1: 4 },
      { xy: BN, chu: 'Lau sậy um tùm, bùn lầy hiểm trở, bãi nổi ở giữa', ben: 'ta', t0: 4.2, t1: 8.1 },
      { xy: BN, chu: 'Theo sử cũ: khoảng hai vạn nghĩa quân', ben: 'ta', t0: 9.2, t1: 12 },
      { xy: ra0[ra0.length - 1], chu: 'Ngày tắt khói lửa, đêm dùng thuyền độc mộc đánh úp', ben: 'ta', t0: 12.2, t1: 17 },
      { xy: [DT[0] + 100, DT[1] - 100], chu: 'Trần Bá Tiên vây đầm nhưng không sao tiến vào được', ben: 'dich', t0: 18.1, t1: 21.6 },
      { xy: traiDong, chu: 'Đêm đánh úp, cướp lương, giết giặc rồi rút vào đầm', ben: 'ta', t0: 21.8, t1: 28.4 },
      { xy: BN, chu: 'Cuộc chiến kéo dài nhiều năm', ben: 'ta', t0: 28.6, t1: 31 },
      { xy: at(R(2), .5), chu: 'Năm 550: nhà Lương có loạn, Trần Bá Tiên phải về nước', ben: 'dich', t0: 31.1, t1: 35.2 },
      { xy: LB, chu: 'Triệu Quang Phục tung quân đánh lớn, giành lại thành Long Biên', ben: 'ta', t0: 35.4, t1: 39.6 }] };
  ghi(id, kb); }

const vongQuanh = (H, c, r, n, lech = 0) => Array.from({ length: n }, (_, i) => H.ganDat([c[0] + Math.cos(i / n * 6.283 + lech) * r, c[1] + Math.sin(i / n * 6.283 + lech) * r * .75]));

/* ==================== VẠN AN 722 (Mai Thúc Loan) ==================== */
if (!only || only === 'van-an-722') { const id = 'van-an-722', H = moTran(id), { R, at, DD, ganDat } = H;
  const VA = DD['Thành Vạn An (Hoan Châu)'], DC = DD['Diễn Châu'], AC = DD['Ái Châu'], TB = DD['Phủ thành Tống Bình'];
  const kb = { ...CHUNG, chu_co_ta: 'MAI',
    may_quay: [[0, VA[0] + 60, VA[1] - 120, 520, 60, -4], [4.4, at(R(0), .55)[0], at(R(0), .55)[1], 900, 70, 0], [6.1, TB[0], TB[1] + 200, 460, 58, -6], [10, TB[0] + 160, TB[1] + 220, 520, 60, -4],
      [16.5, (VA[0] + AC[0]) / 2 + 80, (VA[1] + AC[1]) / 2, 700, 66, 0], [20, TB[0], TB[1] + 220, 420, 57, -6], [23.2, TB[0] + 60, TB[1] + 200, 420, 57, -8], [26.4, at(R(0), .5)[0] + 100, at(R(0), .5)[1], 900, 70, 0], [29.3, TB[0] + 200, TB[1] + 230, 520, 60, -4], [33, TB[0] + 180, TB[1] + 230, 500, 60, -6]],
    may_quay_sau: [[0, VA[0] - 260, VA[1] - 500, 900, 68, 0], [7.4, VA[0] - 240, VA[1] - 520, 860, 66, -4]],
    doan_quan: [
      { ten: 'Mai Thúc Loan tiến ra Bắc', ben: 'ta', tuong: true, co: 'MAI', linh: 15, ngua: 3, gian_cach: .012, duong: 0, tu: 0, den: .97, t0: .5, t1: 6, an_sau: 16.4 },
      { ten: 'Dương Tư Húc đem 10 vạn quân', ben: 'dich', tuong: true, co: 'DƯƠNG', linh: 15, ngua: 5, gian_cach: .03, duong: 2, tu: 0, den: .7, t0: 10.9, t1: 15.4, an_sau: 16.4 },
      { ten: 'Nghĩa quân và hào kiệt Diễn, Ái', ben: 'ta', tuong: true, co: 'MAI', linh: 15, ngua: 3, gian_cach: .012, duong: 0, tu: 0, den: .97, t0: 16.5, t1: 22.4 },
      { ten: 'Quang Sở Khách bỏ chạy', ben: 'dich', tuong: true, co: 'QUANG', linh: 6, ngua: 2, gian_cach: .04, duong: 1, tu: 0, den: .95, t0: 23.2, t1: 26.4, an_sau: 27 },
      { ten: 'Nhà Đường dồn đại quân sang', ben: 'dich', tuong: true, co: 'ĐƯỜNG', linh: 15, ngua: 5, gian_cach: .03, duong: 2, tu: 0, den: .75, t0: 29.3, t1: 33 }],
    mui_ten: [{ duong: 0, ben: 'ta', t0: .5, t1: 6, day: 14 }, { duong: 2, ben: 'dich', net: 'dut', den: .7, t0: 10.9, t1: 15.4, an_sau: 16.4 }, { duong: 1, ben: 'dich', net: 'dut', t0: 23.2, t1: 26.4 }, { duong: 2, ben: 'dich', net: 'dut', den: .75, t0: 29.3, t1: 33 }],
    phuc_binh: [...[DC, AC].map((p, i) => ({ xy: ganDat([p[0] + 50, p[1]]), ben: 'ta', t0: 17.2 + i * .9, huong_toi: TB })), ...vongQuanh(H, TB, 55, 5, .3).map((p, i) => ({ xy: p, ben: 'ta', t0: 21.6 + i * .2, huong_toi: TB }))],
    lua: [{ xy: TB, ban_kinh: 40, t0: 5, t1: 9, ngon: 5 }, { xy: TB, ban_kinh: 42, t0: 21.8, t1: 26, ngon: 5 }],
    co_cam: [{ xy: ganDat([TB[0] + 14, TB[1] + 16]), ben: 'ta', t0: 6.4 }, { xy: ganDat([DC[0] + 18, DC[1] - 10]), ben: 'ta', t0: 18 }, { xy: ganDat([AC[0] + 18, AC[1] - 10]), ben: 'ta', t0: 19 }, { xy: ganDat([TB[0] - 14, TB[1] + 18]), ben: 'ta', t0: 26.6 }],
    nhan: [
      { xy: VA, chu: 'Nghĩa quân Mai Thúc Loan từ Hoan Châu tiến ra Bắc', ben: 'ta', t0: .5, t1: 4.4 },
      { xy: TB, chu: 'Đánh chiếm phủ thành Tống Bình – trung tâm An Nam đô hộ phủ', ben: 'ta', t0: 4.6, t1: 9 },
      { xy: at(R(2), .4), chu: 'Theo sử Đường: Dương Tư Húc đem khoảng 10 vạn quân sang', ben: 'dich', t0: 10, t1: 15.5 },
      { xy: DC, chu: 'Hào kiệt các châu Diễn, Ái cùng hưởng ứng', ben: 'ta', t0: 16.6, t1: 20.6 },
      { xy: TB, chu: 'Phủ thành Tống Bình bị vây đánh', ben: 'ta', t0: 20.8, t1: 23.2 },
      { xy: at(R(1), .5), chu: 'Đô hộ Quang Sở Khách bỏ chạy về nước', ben: 'dich', t0: 23.3, t1: 26.4 },
      { xy: AC, chu: 'Mai Thúc Loan làm chủ đất nước một thời gian', ben: 'ta', t0: 26.5, t1: 29.3 },
      { xy: at(R(2), .5), chu: 'Nhà Đường dồn đại quân sang đàn áp', ben: 'dich', t0: 29.4, t1: 32.8 }] };
  ghi(id, kb); }

/* ==================== TỐNG BÌNH 791 (Phùng Hưng) ==================== */
if (!only || only === 'tong-binh-791') { const id = 'tong-binh-791', H = moTran(id), { R, at, DD, ganDat } = H;
  const DL = DD['Đường Lâm'], TB = DD['Phủ thành Tống Bình'];
  const kb = { ...CHUNG, chu_co_ta: 'PHÙNG',
    may_quay: [[0, DL[0] + 120, DL[1] + 60, 460, 58, -4], [3.9, (DL[0] + TB[0]) / 2, (DL[1] + TB[1]) / 2 + 40, 640, 62, -4], [7.7, TB[0] - 30, TB[1], 360, 56, -8], [13.9, (DL[0] + TB[0]) / 2 + 200, (DL[1] + TB[1]) / 2 + 80, 620, 62, -4],
      [16.3, TB[0] - 40, TB[1] - 10, 380, 57, -8], [23, TB[0], TB[1], 320, 55, -10], [28.8, TB[0], TB[1], 340, 55, -12], [34, TB[0] - 10, TB[1] + 10, 360, 56, -12]],
    may_quay_sau: [[0, TB[0] - 360, TB[1] - 80, 620, 64, 0], [6.7, TB[0] - 330, TB[1] - 100, 580, 62, -6]],
    doan_quan: [
      { ten: 'Phùng Hưng từ Đường Lâm', ben: 'ta', tuong: true, co: 'PHÙNG', linh: 15, ngua: 3, gian_cach: .016, duong: 0, tu: 0, den: .93, t0: .5, t1: 6.6, an_sau: 13.8 },
      { ten: 'Đô hộ Cao Chính Bình', ben: 'dich', tuong: true, co: 'CAO', linh: 8, ngua: 2, gian_cach: .2, duong: [ganDat([TB[0] + 20, TB[1] + 10]), TB], t0: 0, t1: .2, nga_tai: 11, an_sau: 13.6 },
      { ten: 'Phùng Hưng vây chặt phủ thành', ben: 'ta', tuong: true, co: 'PHÙNG', linh: 15, ngua: 3, gian_cach: .016, duong: 0, tu: 0, den: .93, t0: 14, t1: 19.3, an_sau: 22.9 },
      { ten: 'Cánh quân phía nam', ben: 'ta', tuong: true, co: 'ĐỖ', linh: 8, gian_cach: .04, duong: 1, tu: 0, den: .92, t0: 14.4, t1: 19 },
      { ten: 'Cánh quân phía bắc', ben: 'ta', linh: 8, gian_cach: .04, duong: 2, tu: 0, den: .92, t0: 14.8, t1: 19.2 },
      { ten: 'Cao Chính Bình lâm bệnh', ben: 'dich', tuong: true, co: 'CAO', linh: 8, ngua: 2, gian_cach: .2, duong: [ganDat([TB[0] + 20, TB[1] + 10]), TB], t0: 14, t1: 14.2, nga_tai: 21.4, an_sau: 23 },
      { ten: 'Phùng Hưng vào thành', ben: 'ta', tuong: true, co: 'PHÙNG', linh: 12, ngua: 2, gian_cach: .2, duong: [ganDat([TB[0] - 30, TB[1] + 10]), TB], t0: 23, t1: 25.5 }],
    mui_ten: [{ duong: 0, ben: 'ta', t0: .5, t1: 6.6, day: 14 }, { duong: 0, ben: 'ta', t0: 14, t1: 19.3, day: 14 }, { duong: 1, ben: 'ta', t0: 14.4, t1: 19, day: 12 }, { duong: 2, ben: 'ta', t0: 14.8, t1: 19.2, day: 12 }],
    phuc_binh: [...vongQuanh(H, TB, 60, 5, .2).map((p, i) => ({ xy: p, ben: 'ta', t0: 7.8 + i * .25, huong_toi: TB })), ...vongQuanh(H, TB, 70, 6, .7).map((p, i) => ({ xy: p, ben: 'ta', t0: 16.5 + i * .2, huong_toi: TB }))],
    lua: [], co_cam: [{ xy: ganDat([TB[0] + 12, TB[1] - 14]), ben: 'ta', t0: 24.4 }],
    nhan: [
      { xy: DL, chu: 'Từ Đường Lâm, nghĩa quân Phùng Hưng tiến về', ben: 'ta', t0: .5, t1: 3.9 },
      { xy: TB, chu: 'Phủ thành Tống Bình – trụ sở đô hộ Cao Chính Bình', ben: 'dich', t0: 4, t1: 6.7 },
      { xy: TB, chu: 'Theo sử cũ: nghĩa quân vây thành', ben: 'ta', t0: 7.8, t1: 10 },
      { xy: [TB[0] + 30, TB[1] + 50], chu: 'Cao Chính Bình lo sợ sinh bệnh mà chết', ben: 'dich', t0: 10.1, t1: 12.9 },
      { xy: at(R(1), .4), chu: 'Theo kế của mưu sĩ Đỗ Anh Hàn', ben: 'ta', t0: 14, t1: 16.3 },
      { xy: TB, chu: 'Kéo về vây chặt phủ thành Tống Bình', ben: 'ta', t0: 16.4, t1: 19.4 },
      { xy: [TB[0] + 30, TB[1] + 50], chu: 'Viên đô hộ lo sợ, lâm bệnh mà chết', ben: 'dich', t0: 19.5, t1: 23 },
      { xy: TB, chu: 'Phùng Hưng vào thành, sắp đặt việc cai trị', ben: 'ta', t0: 23.1, t1: 25.8 },
      { xy: TB, chu: 'Nhân dân tôn ông là Bố Cái Đại Vương – người cha người mẹ của dân', ben: 'ta', t0: 26, t1: 33.4 }] };
  ghi(id, kb); }

/* ==================== CHI LĂNG – BẠCH ĐẰNG 981 (Lê Hoàn) ==================== */
if (!only || only === 'chi-lang-981') { const id = 'chi-lang-981', H = moTran(id), { R, at, uNear, nrm, nuaRong, DD, ganDat, thuy, veLong } = H;
  const LS = DD['Lạng Sơn'], CL = DD['Ải Chi Lăng'], BC = DD['Bãi cọc Bạch Đằng'], CUA = DD['Cửa biển Bạch Đằng'];
  const C0 = veLong(BC, 60), n0 = [0.8, -0.6], [ha, hb] = nuaRong(C0, n0);
  const cocTu = [C0[0] + n0[0] * Math.max(2, ha - 6), C0[1] + n0[1] * Math.max(2, ha - 6)].map(Math.round), cocDen = [C0[0] - n0[0] * Math.max(2, hb - 6), C0[1] - n0[1] * Math.max(2, hb - 6)].map(Math.round);
  const pbCL = vongQuanh(H, CL, 50, 5, .5);
  const kb = { ...CHUNG, chu_co_ta: 'LÊ', ti_le_thuyen: .45,
    may_quay: [[0, LS[0] + 40, LS[1] + 120, 440, 58, -4], [3.5, CUA[0] - 60, CUA[1] - 140, 440, 58, -6], [7.6, C0[0], C0[1] - 20, 320, 55, -10], [11.1, CL[0] + 60, CL[1] - 20, 420, 58, -6],
      [14.2, C0[0] + 10, C0[1] + 10, 320, 55, -10], [19.2, (LS[0] + CL[0]) / 2, (LS[1] + CL[1]) / 2 + 40, 420, 57, -6], [23.6, CL[0], CL[1], 320, 55, -10], [27.7, CL[0], CL[1], 300, 54, -12],
      [30.6, (CL[0] + C0[0]) / 2, (CL[1] + C0[1]) / 2, 900, 70, 0], [36.4, (CL[0] + C0[0]) / 2, (CL[1] + C0[1]) / 2 - 40, 880, 70, 0]],
    may_quay_sau: [[0, (CL[0] + C0[0]) / 2 - 200, (CL[1] + C0[1]) / 2, 900, 68, 0], [7.2, (CL[0] + C0[0]) / 2 - 180, (CL[1] + C0[1]) / 2 - 20, 860, 66, -4]],
    doan_quan: [
      { ten: 'Quân bộ Hầu Nhân Bảo', ben: 'dich', tuong: true, co: 'HẦU', linh: 15, ngua: 5, gian_cach: .02, duong: 0, tu: 0, den: .5, t0: .5, t1: 3.5, an_sau: 19.1 },
      { ten: 'Thủy quân Lưu Trừng', ben: 'dich', tuong: true, co: 'LƯU', phuong_tien: 'thuyen', lon: true, thuyen: 7, gian_cach: .05, ngang: 0, duong: thuy(1, 0, .95), t0: 3.5, t1: 9, an_sau: 30.5 },
      { ten: 'Hầu Nhân Bảo bị nhử vào sâu', ben: 'dich', tuong: true, co: 'HẦU', linh: 15, ngua: 5, gian_cach: .02, duong: 0, tu: .5, den: 1, t0: 19.2, t1: 27.6, nga_tai: 29.4, an_sau: 32 },
      { ten: 'Thủy quân Tống rút chạy', ben: 'dich', tuong: true, co: 'LƯU', phuong_tien: 'thuyen', lon: true, thuyen: 7, gian_cach: .05, ngang: 0, duong: thuy(3, 0, .85), t0: 30.6, t1: 35.8 },
      { ten: 'Bộ binh Tống rút chạy', ben: 'dich', linh: 10, ngua: 2, gian_cach: .03, duong: 2, tu: .05, den: .7, t0: 30.8, t1: 35.6 },
      { ten: 'Quân ta truy kích', ben: 'ta', tuong: true, co: 'LÊ HOÀN', linh: 12, ngua: 3, gian_cach: .03, duong: 2, tu: 0, den: .5, t0: 31.6, t1: 35.9 }],
    coc: [{ tu: cocTu, den: cocDen, be_rong: 22, so: 50, huong_nghieng: [CUA[0] - C0[0], CUA[1] - C0[1]], t0: 7.8 }],
    mui_ten: [{ duong: 0, ben: 'dich', net: 'dut', den: .5, t0: .5, t1: 3.5, an_sau: 19 }, { duong: 1, ben: 'dich', net: 'dut', t0: 3.5, t1: 9 }, { duong: 0, ben: 'dich', net: 'dut', bat_dau: .5, t0: 19.2, t1: 27.6 },
      ...pbCL.slice(0, 4).map((p, i) => ({ duong: [p, CL], ben: 'ta', t0: 27.8 + i * .2, t1: 28.9 + i * .2, day: 11 })), { duong: 2, ben: 'dich', net: 'dut', den: .8, t0: 30.8, t1: 35.6 }, { duong: 2, ben: 'ta', den: .55, t0: 31.6, t1: 35.9, day: 13 }],
    phuc_binh: pbCL.map((p, i) => ({ xy: p, ben: 'ta', t0: 27.7 + i * .2, huong_toi: CL })),
    lua: [{ xy: CL, ban_kinh: 44, t0: 28.4, t1: 34, ngon: 6 }],
    co_cam: [{ xy: ganDat([CL[0] + 14, CL[1] - 12]), ben: 'ta', t0: 33 }, { xy: ganDat([C0[0] + 40, C0[1] - 30]), ben: 'ta', t0: 35 }],
    nhan: [
      { xy: LS, chu: 'Quân bộ Hầu Nhân Bảo theo đường Lạng Sơn tiến vào', ben: 'dich', t0: .5, t1: 3.5 },
      { xy: CUA, chu: 'Thủy quân Lưu Trừng theo đường biển vào sông Bạch Đằng', ben: 'dich', t0: 3.6, t1: 6.6 },
      { xy: C0, chu: 'Lê Hoàn cho đóng cọc ở sông Bạch Đằng', ben: 'ta', t0: 7.7, t1: 11.1 },
      { xy: CL, chu: 'Trên bộ dùng kế trá hàng', ben: 'ta', t0: 11.2, t1: 13.2 },
      { xy: C0, chu: 'Bãi cọc chặn thủy quân Lưu Trừng', ben: 'ta', t0: 14.3, t1: 19.1 },
      { xy: at(R(0), .6), chu: 'Giả vờ xin hàng, nhử Hầu Nhân Bảo vào sâu', ben: 'ta', t0: 19.3, t1: 23.6 },
      { xy: CL, chu: 'Theo Toàn thư: quân Tống tới ải Chi Lăng', ben: 'dich', t0: 23.7, t1: 27.6 },
      { xy: CL, chu: 'Phục binh đổ ra – Hầu Nhân Bảo bị chém', ben: 'ta', t0: 27.8, t1: 30.6 },
      { xy: at(R(2), .5), chu: 'Hai cánh quân còn lại rút chạy, quân ta truy kích', ben: 'ta', t0: 30.7, t1: 34.4 },
      { xy: at(R(2), .3), chu: 'Bắt sống nhiều tướng giặc', ben: 'ta', t0: 34.5, t1: 36.2 }] };
  ghi(id, kb); }

/* ==================== UNG CHÂU 1075 (Lý Thường Kiệt) ==================== */
if (!only || only === 'ung-chau-1075') { const id = 'ung-chau-1075', H = moTran(id), { R, at, DD, ganDat, thuy } = H;
  const UC = DD['Thành Ung Châu'], KC = DD['Khâm Châu'], LC = DD['Liêm Châu'], LS = DD['Lạng Sơn'];
  const vay = vongQuanh(H, UC, 60, 6, .3);
  const kb = { ...CHUNG, chu_co_ta: 'LÝ', ti_le_thuyen: .5,
    may_quay: [[0, (KC[0] + LC[0]) / 2 - 200, KC[1] + 200, 640, 62, -4], [2.7, (LS[0] + UC[0]) / 2, (LS[1] + UC[1]) / 2 + 100, 820, 68, 0], [4.7, UC[0] - 40, UC[1] + 220, 520, 60, -4], [8, 1350, 640, 860, 70, 0],
      [12.4, UC[0], UC[1] + 220, 400, 57, -6], [15.8, 1400, 650, 860, 70, 0], [20.3, UC[0], UC[1] + 220, 380, 56, -8], [22.8, UC[0], UC[1] + 210, 340, 55, -10], [27.3, UC[0] - 20, UC[1] + 220, 360, 56, -10], [34.6, (LS[0] + UC[0]) / 2, (LS[1] + UC[1]) / 2 + 80, 760, 66, 0], [37.1, (LS[0] + UC[0]) / 2 - 60, (LS[1] + UC[1]) / 2 + 100, 760, 66, 0]],
    may_quay_sau: [[0, 1100, 760, 880, 68, 0], [6.5, 1130, 740, 840, 66, -4]],
    doan_quan: [
      { ten: 'Thủy quân đánh Khâm Châu', ben: 'ta', tuong: true, co: 'LÝ', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .03, duong: thuy(0, 0, .88), t0: .3, t1: 2.6 },
      { ten: 'Thủy quân đánh Liêm Châu', ben: 'ta', phuong_tien: 'thuyen', thuyen: 5, gian_cach: .06, duong: thuy(1, .08, .88), t0: 1.2, t1: 2.9 },
      { ten: 'Quân bộ theo đường núi', ben: 'ta', tuong: true, co: 'TÔNG ĐẢN', linh: 14, ngua: 3, gian_cach: .012, duong: 2, tu: 0, den: .95, t0: 2.7, t1: 7, an_sau: 15.7 },
      { ten: 'Từ Khâm Châu tiến lên Ung Châu', ben: 'ta', tuong: true, co: 'LÝ', linh: 14, ngua: 3, gian_cach: .015, duong: 3, tu: 0, den: .95, t0: 4.7, t1: 7.2, an_sau: 15.7 },
      { ten: 'Tô Giam cố thủ Ung Châu', ben: 'dich', tuong: true, co: 'TÔ GIAM', linh: 8, gian_cach: .3, duong: [ganDat([UC[0] + 14, UC[1] + 10]), UC], t0: 0, t1: .2, nga_tai: 28.4, an_sau: 33 },
      { ten: 'Quân bộ hợp vây', ben: 'ta', tuong: true, co: 'TÔNG ĐẢN', linh: 14, ngua: 3, gian_cach: .012, duong: 2, tu: 0, den: .95, t0: 15.8, t1: 20.2, an_sau: 34.5 },
      { ten: 'Lý Thường Kiệt từ Khâm Châu', ben: 'ta', tuong: true, co: 'LÝ', linh: 14, ngua: 3, gian_cach: .015, duong: 3, tu: 0, den: .95, t0: 15.8, t1: 20.2, an_sau: 34.5 },
      { ten: 'Quân ta rút về nước', ben: 'ta', tuong: true, co: 'LÝ', linh: 14, ngua: 3, gian_cach: .012, duong: 4, tu: 0, den: .95, t0: 34.6, t1: 37 }],
    mui_ten: [{ duong: thuy(0), ben: 'ta', t0: .3, t1: 2.6, day: 13 }, { duong: thuy(1), ben: 'ta', t0: 1.2, t1: 2.9, day: 12 }, { duong: 2, ben: 'ta', t0: 2.7, t1: 7, day: 14 }, { duong: 3, ben: 'ta', t0: 4.7, t1: 7.2, day: 14 }, { duong: 4, ben: 'ta', t0: 34.6, t1: 37, day: 13 }],
    phuc_binh: vay.map((p, i) => ({ xy: p, ben: 'ta', t0: 5.6 + i * .2, huong_toi: UC })),
    lua: [{ xy: KC, ban_kinh: 40, t0: 1.6, t1: 6, ngon: 5 }, { xy: LC, ban_kinh: 36, t0: 2.2, t1: 6, ngon: 4 }, { xy: UC, ban_kinh: 50, t0: 23, t1: 34, ngon: 7 }],
    co_cam: [{ xy: ganDat([KC[0] + 14, KC[1] - 12]), ben: 'ta', t0: 2.4 }, { xy: ganDat([LC[0] + 14, LC[1] - 12]), ben: 'ta', t0: 2.8 }, { xy: ganDat([UC[0] - 14, UC[1] + 14]), ben: 'ta', t0: 28.6 }],
    nhan: [
      { xy: KC, chu: 'Quân thủy đánh chiếm Khâm Châu, Liêm Châu', ben: 'ta', t0: .5, t1: 2.7 },
      { xy: at(R(2), .5), chu: 'Quân bộ theo đường núi tiến lên', ben: 'ta', t0: 2.8, t1: 4.7 },
      { xy: UC, chu: 'Hai cánh hợp lại vây thành Ung Châu', ben: 'ta', t0: 4.8, t1: 7 },
      { xy: at(R(2), .3), chu: 'Theo sử cũ: quân nhà Lý khoảng 10 vạn người', ben: 'ta', t0: 8, t1: 12.4 },
      { xy: UC, chu: 'Ở Ung Châu, Tô Giam cố thủ hơn 40 ngày', ben: 'dich', t0: 12.5, t1: 14.8 },
      { xy: at(R(3), .5), chu: 'Đánh nhanh chiếm Khâm, Liêm rồi hợp vây Ung Châu', ben: 'ta', t0: 15.9, t1: 20.3 },
      { xy: UC, chu: 'Tô Giam cố thủ hơn 40 ngày', ben: 'dich', t0: 20.4, t1: 22.8 },
      { xy: UC, chu: 'Hỏa công, đắp đất sát chân thành mà leo lên', ben: 'ta', t0: 22.9, t1: 27.3 },
      { xy: UC, chu: 'Đầu 1076: thành vỡ, kho lương thảo, vũ khí bị phá hủy', ben: 'ta', t0: 27.4, t1: 34.6 },
      { xy: at(R(4), .5), chu: 'Quân ta rút về nước', ben: 'ta', t0: 34.7, t1: 37 }] };
  ghi(id, kb); }

/* ==================== THIÊN MẠC 1285 (Trần Bình Trọng) ==================== */
if (!only || only === 'thien-mac-1285') { const id = 'thien-mac-1285', H = moTran(id), { R, at, DD, ganDat, thuy } = H;
  const TL = DD['Thăng Long'], TM = DD['Bãi Thiên Mạc'];
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .5,
    may_quay: [[0, TL[0] + 60, TL[1] + 160, 560, 60, -4], [4.3, TM[0] + 20, TM[1] - 80, 520, 60, -6], [6.9, TM[0], TM[1], 360, 56, -8], [10.6, (TL[0] + TM[0]) / 2, (TL[1] + TM[1]) / 2, 780, 68, 0],
      [17.2, TM[0] + 30, TM[1] - 100, 460, 58, -6], [19.6, TM[0], TM[1], 330, 55, -10], [23.8, TM[0], TM[1], 300, 54, -12], [29.6, TM[0], TM[1], 300, 54, -12], [32.6, TM[0] + 40, TM[1] + 60, 520, 60, -6], [38.6, TM[0] + 60, TM[1] + 100, 560, 62, -4]],
    may_quay_sau: [[0, TM[0] - 320, TM[1] - 240, 760, 66, 0], [8.4, TM[0] - 290, TM[1] - 260, 720, 64, -4]],
    doan_quan: [
      { ten: 'Quân Nguyên truy đuổi', ben: 'dich', tuong: true, co: 'NGUYÊN', linh: 15, ngua: 6, gian_cach: .02, duong: 0, tu: 0, den: .55, t0: .5, t1: 4.3, an_sau: 17.1 },
      { ten: 'Thuyền triều đình rút về nam', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .03, duong: thuy(1, 0, .7), t0: .8, t1: 9, an_sau: 17.1 },
      { ten: 'Trần Bình Trọng chặn giặc', ben: 'ta', tuong: true, co: 'BÌNH TRỌNG', linh: 9, ngua: 2, gian_cach: .1, duong: 2, tu: 0, den: 1, t0: 5, t1: 7.5, nga_tai: 31.6 },
      { ten: 'Quân Nguyên kéo tới Thiên Mạc', ben: 'dich', tuong: true, co: 'NGUYÊN', linh: 15, ngua: 6, gian_cach: .02, duong: 0, tu: .55, den: .97, t0: 17.2, t1: 22.6 },
      { ten: 'Thuyền triều đình rút xa', ben: 'ta', tuong: true, co: 'TRẦN', phuong_tien: 'thuyen', thuyen: 8, gian_cach: .03, duong: thuy(1, .7, 1), t0: 17.2, t1: 26 }],
    mui_ten: [{ duong: 0, ben: 'dich', net: 'dut', den: .55, t0: .5, t1: 4.3, an_sau: 17 }, { duong: thuy(1), ben: 'ta', t0: .8, t1: 26, day: 12 }, { duong: 0, ben: 'dich', net: 'dut', bat_dau: .55, t0: 17.2, t1: 22.6 }, { duong: 2, ben: 'ta', t0: 19.6, t1: 21.4, day: 12 }],
    phuc_binh: vongQuanh(H, TM, 70, 6, .5).map((p, i) => ({ xy: p, ben: 'dich', t0: 23.8 + i * .2, huong_toi: TM })),
    lua: [{ xy: TM, ban_kinh: 40, t0: 21, t1: 28, ngon: 5 }],
    co_cam: [{ xy: ganDat([TM[0] + 16, TM[1] - 12]), ben: 'dich', t0: 27 }],
    nhan: [
      { xy: TL, chu: 'Quân Nguyên chiếm Thăng Long, truy đuổi triều đình về phía nam', ben: 'dich', t0: .5, t1: 4.3 },
      { xy: TM, chu: 'Bãi Thiên Mạc – nay thuộc Duy Tiên, Hà Nam', ben: 'ta', t0: 4.4, t1: 6.9 },
      { xy: TM, chu: 'Trần Bình Trọng đặt trận chặn giặc', ben: 'ta', t0: 7, t1: 9.6 },
      { xy: at(R(0), .3), chu: 'Theo sử cũ: lần thứ hai khoảng 50 vạn quân, thế giặc rất mạnh', ben: 'dich', t0: 10.6, t1: 16.2 },
      { xy: at(R(1), .75), chu: 'Để triều đình kịp rút lui an toàn', ben: 'ta', t0: 17.3, t1: 19.6 },
      { xy: TM, chu: 'Quân ta ít, giặc đông – ông chiến đấu đến cùng thì bị bắt', ben: 'ta', t0: 19.7, t1: 27.8 },
      { xy: [TM[0] + 30, TM[1] + 50], chu: 'Giặc dụ hàng, hứa phong vương ở đất Bắc', ben: 'dich', t0: 23.9, t1: 29.6 },
      { xy: TM, chu: 'Trần Bình Trọng khảng khái từ chối rồi hy sinh', ben: 'ta', t0: 29.7, t1: 32.6 },
      { xy: at(R(1), .9), chu: 'Vua tôi nhà Trần bảo toàn lực lượng, chờ thời cơ phản công', ben: 'ta', t0: 32.7, t1: 38.2 }] };
  ghi(id, kb); }

/* ==================== VÂN ĐỒN 1288 (Trần Khánh Dư) ==================== */
if (!only || only === 'van-don-1288') { const id = 'van-don-1288', H = moTran(id), { R, at, DD, ganDat, thuy } = H;
  const VD = DD['Vân Đồn'], VK = DD['Vạn Kiếp'], CUA = DD['Cửa biển Bạch Đằng'];
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .5,
    may_quay: [[0, 1400, 760, 860, 70, 0], [3.8, at(R(0), .2)[0], at(R(0), .2)[1] - 60, 520, 60, -4], [6.9, VD[0] + 40, VD[1] + 200, 480, 58, -6], [11.6, VD[0] + 60, VD[1] + 120, 380, 56, -8],
      [15.3, (VK[0] + CUA[0]) / 2, (VK[1] + CUA[1]) / 2, 720, 66, 0], [18.2, 1500, 760, 860, 70, 0], [22.4, at(R(0), .3)[0], at(R(0), .3)[1] - 40, 460, 58, -6], [26.7, VD[0] - 100, VD[1] + 60, 520, 60, -4],
      [32.3, VD[0] + 40, VD[1] + 80, 360, 56, -8], [34.6, VD[0] + 60, VD[1] + 60, 320, 55, -10], [40.4, VD[0] + 80, VD[1] + 60, 340, 55, -10], [44.5, VD[0] + 100, VD[1] + 60, 380, 56, -8]],
    may_quay_sau: [[0, (VK[0] + VD[0]) / 2, 760, 860, 68, 0], [9.6, (VK[0] + VD[0]) / 2 + 20, 740, 820, 66, -4]],
    doan_quan: [
      { ten: 'Thủy quân Ô Mã Nhi', ben: 'dich', tuong: true, co: 'Ô', phuong_tien: 'thuyen', lon: true, thuyen: 10, gian_cach: .012, duong: thuy(0), t0: 3.8, t1: 21.4 },
      { ten: 'Đoàn thuyền lương Trương Văn Hổ', ben: 'dich', tuong: true, co: 'HỔ', phuong_tien: 'thuyen', lon: true, thuyen: 6, gian_cach: .1, duong: thuy(1, 0, .65), t0: 6.9, t1: 33, an_sau: 37.6 },
      { ten: 'Quân Trần Khánh Dư không chặn nổi', ben: 'ta', tuong: true, co: 'DƯ', phuong_tien: 'thuyen', thuyen: 5, gian_cach: .05, duong: thuy(0, .05, .2), t0: 22.4, t1: 26.6, an_sau: 27 },
      { ten: 'Trần Khánh Dư mai phục ở Vân Đồn', ben: 'ta', tuong: true, co: 'DƯ', phuong_tien: 'thuyen', thuyen: 6, gian_cach: .1, duong: thuy(1, .95, .7), t0: 34.6, t1: 37.6 },
      { ten: 'Thuyền lương bị nhấn chìm', ben: 'dich', phuong_tien: 'thuyen', lon: true, thuyen: 6, gian_cach: .1, duong: thuy(1, 0, .65), t0: 37.5, t1: 37.6, dam_tai: 38, ti_le_dam: .85, chay: true },
      { ten: 'Trương Văn Hổ lên thuyền nhỏ trốn về', ben: 'dich', tuong: true, co: 'HỔ', phuong_tien: 'thuyen', thuyen: 0, duong: thuy(2, .3, 1), t0: 40.4, t1: 43.8 }],
    mui_ten: [{ duong: thuy(0), ben: 'dich', net: 'dut', t0: 3.8, t1: 21.4 }, { duong: thuy(1, 0, .65), ben: 'dich', net: 'dut', t0: 6.9, t1: 33 }, { duong: thuy(1, .95, .7), ben: 'ta', t0: 34.6, t1: 37.4, day: 13 }, { duong: thuy(2, .3, 1), ben: 'dich', net: 'dut', t0: 40.4, t1: 43.8 }],
    phuc_binh: [ganDat([VD[0] + 30, VD[1] + 40]), ganDat([VD[0] + 90, VD[1] + 20])].map((p, i) => ({ xy: p, ben: 'ta', t0: 34.8 + i * .3 })),
    lua: [{ xy: at(R(1), .6), ban_kinh: 44, t0: 37.8, t1: 44, ngon: 6 }],
    co_cam: [{ xy: ganDat([VD[0] + 20, VD[1] + 10]), ben: 'ta', t0: 41 }],
    nhan: [
      { xy: [1500, 880], chu: 'Cuối năm 1287: quân Nguyên sang xâm lược lần thứ ba', ben: 'dich', t0: .5, t1: 3.8 },
      { xy: at(R(0), .15), chu: 'Thủy quân Ô Mã Nhi vượt biển tiến vào', ben: 'dich', t0: 3.9, t1: 6.9 },
      { xy: VD, chu: 'Phía sau: đoàn thuyền lương Trương Văn Hổ', ben: 'dich', t0: 7, t1: 11.5 },
      { xy: VD, chu: 'Theo sử sách: khoảng 17 vạn thạch lương', ben: 'dich', t0: 11.7, t1: 15.3 },
      { xy: VK, chu: 'Ô Mã Nhi chủ quan, tiến vội về Vạn Kiếp', ben: 'dich', t0: 15.4, t1: 18.2 },
      { xy: at(R(1), .3), chu: 'Bỏ đoàn thuyền lương lại phía sau, không có hộ tống', ben: 'dich', t0: 18.3, t1: 21.4 },
      { xy: at(R(0), .15), chu: 'Lúc đầu Trần Khánh Dư không chặn nổi thủy quân Ô Mã Nhi', ben: 'ta', t0: 22.5, t1: 26.7 },
      { xy: VD, chu: 'Thượng hoàng sai bắt hỏi tội – ông xin lập công chuộc tội', ben: 'ta', t0: 26.8, t1: 32.3 },
      { xy: VD, chu: 'Đoán thuyền lương theo sau, mai phục ở Vân Đồn rồi tập kích', ben: 'ta', t0: 32.4, t1: 37.8 },
      { xy: at(R(1), .6), chu: 'Lương thực của giặc bị chiếm hoặc nhấn chìm', ben: 'ta', t0: 37.9, t1: 40.4 },
      { xy: at(R(2), .7), chu: 'Trương Văn Hổ chỉ kịp lên thuyền nhỏ trốn về', ben: 'dich', t0: 40.5, t1: 43.9 }] };
  ghi(id, kb); }

/* ==================== HẢI TRIỀU 1390 (Trần Khát Chân) ==================== */
if (!only || only === 'hai-trieu-1390') { const id = 'hai-trieu-1390', H = moTran(id), { R, at, DD, ganDat, thuy } = H;
  const TL = DD['Thăng Long'], HT = DD['Sông Hải Triều'], dau = at(R(0), 1), cho = at(R(1), 1);
  const kb = { ...CHUNG, chu_co_ta: 'TRẦN', ti_le_thuyen: .5,
    may_quay: [[0, at(R(0), .3)[0], at(R(0), .3)[1] - 80, 620, 62, -4], [4.1, (TL[0] + HT[0]) / 2 + 200, (TL[1] + HT[1]) / 2 + 60, 760, 66, 0], [7.9, at(R(0), .75)[0], at(R(0), .75)[1] - 30, 420, 57, -6],
      [13.3, cho[0] + 60, cho[1] - 20, 380, 56, -8], [17.1, (cho[0] + dau[0]) / 2, dau[1] - 10, 340, 55, -10], [20.9, (cho[0] + dau[0]) / 2, dau[1], 300, 54, -12], [23.2, dau[0] - 10, dau[1], 280, 54, -12], [27.4, dau[0] + 120, dau[1] - 20, 460, 58, -8], [28.5, (TL[0] + HT[0]) / 2 + 150, (TL[1] + HT[1]) / 2 + 40, 760, 66, 0], [32.4, (TL[0] + HT[0]) / 2 + 150, (TL[1] + HT[1]) / 2 + 20, 740, 66, 0]],
    may_quay_sau: [[0, HT[0] - 360, HT[1] - 240, 760, 66, 0], [7.3, HT[0] - 330, HT[1] - 260, 720, 64, -4]],
    doan_quan: [
      { ten: 'Thủy quân Chiêm Thành', ben: 'dich', tuong: true, co: 'CHẾ', phuong_tien: 'thuyen', lon: true, thuyen: 10, gian_cach: .02, duong: thuy(0), t0: .4, t1: 12.3, nga_tai: 24.6, an_sau: 27.4 },
      { ten: 'Trần Khát Chân dàn quân chờ', ben: 'ta', tuong: true, co: 'KHÁT CHÂN', phuong_tien: 'thuyen', thuyen: 10, gian_cach: .1, duong: thuy(1), t0: 13.3, t1: 16.5 },
      { ten: 'Quân Chiêm tan vỡ rút chạy', ben: 'dich', phuong_tien: 'thuyen', lon: true, thuyen: 8, gian_cach: .02, duong: thuy(2, 0, .7), t0: 27.4, t1: 32 }],
    mui_ten: [{ duong: thuy(0), ben: 'dich', net: 'dut', t0: .4, t1: 12.3 }, { duong: [cho, dau], ben: 'ta', t0: 20.9, t1: 22.6, day: 14 }, { duong: [ganDat([cho[0] + 20, cho[1] - 40]), dau], ben: 'ta', t0: 21.2, t1: 22.9, day: 11 }, { duong: thuy(2, 0, .7), ben: 'dich', net: 'dut', t0: 27.4, t1: 32 }],
    phuc_binh: [ganDat([cho[0] + 30, cho[1] - 40]), ganDat([cho[0] + 30, cho[1] + 40])].map((p, i) => ({ xy: p, ben: 'ta', t0: 13.6 + i * .3, huong_toi: dau })),
    lua: [{ xy: dau, ban_kinh: 40, t0: 22.4, t1: 28.5, ngon: 6 }],
    co_cam: [{ xy: ganDat([cho[0] + 20, cho[1] - 50]), ben: 'ta', t0: 28.2 }],
    nhan: [
      { xy: at(R(0), .2), chu: 'Quân Chiêm Thành theo đường biển tiến ra, vào sông Hải Triều', ben: 'dich', t0: .5, t1: 4.1 },
      { xy: HT, chu: 'Sông Hải Triều – tức sông Luộc ngày nay – hướng về kinh thành', ben: 'dich', t0: 4.2, t1: 6.9 },
      { xy: at(R(0), .8), chu: 'Theo sử cũ: Chế Bồng Nga đem hơn 100 chiến thuyền ra quan sát', ben: 'dich', t0: 8, t1: 12.3 },
      { xy: cho, chu: 'Trần Khát Chân dàn quân chờ ở sông Hải Triều', ben: 'ta', t0: 13.4, t1: 17 },
      { xy: dau, chu: 'Có người chỉ điểm chiếc thuyền sơn xanh của Chế Bồng Nga', ben: 'ta', t0: 17.2, t1: 20.9 },
      { xy: [(cho[0] + dau[0]) / 2, dau[1] - 40], chu: 'Quân Trần tập trung hỏa khí bắn vào', ben: 'ta', t0: 21, t1: 23.2 },
      { xy: dau, chu: 'Chế Bồng Nga trúng đạn chết ngay trên thuyền', ben: 'dich', t0: 23.3, t1: 27.3 },
      { xy: at(R(2), .4), chu: 'Quân Chiêm mất chủ tướng, tan vỡ rút chạy', ben: 'dich', t0: 27.4, t1: 28.5 },
      { xy: TL, chu: 'Từ đó các cuộc tấn công vào Thăng Long chấm dứt', ben: 'ta', t0: 28.6, t1: 31.8 }] };
  ghi(id, kb); }

/* ==================== KHẢ LƯU – BỒ ẢI 1424 (Lê Lợi) ==================== */
if (!only || only === 'kha-luu-1424') { const id = 'kha-luu-1424', H = moTran(id), { R, at, DD, ganDat, ganNuoc, quaSong, sub, nuoc } = H;
  const KL = DD['Ải Khả Lưu'], BA = DD['Bồ Ải'], NA = DD['Thành Nghệ An'];
  const song = ganNuoc([KL[0] + 10, KL[1] - 30], 60), QS = quaSong(song, [0, -1]);   // nuocA/datA: bờ bắc (nghĩa quân), nuocB/datB: bờ nam (quân Minh)
  const qua = (A, B) => sub([A, B], 0, 1, 12).filter(p => nuoc(p[0], p[1]) && nuoc(p[0] + 2, p[1]) && nuoc(p[0] - 2, p[1]) && nuoc(p[0], p[1] + 2) && nuoc(p[0], p[1] - 2));
  const bac = QS.datA, nam = QS.datB, traiMinh = ganDat([nam[0] + 20, nam[1] + 30]), pb = [ganDat([bac[0] - 70, bac[1] - 70]), ganDat([bac[0] + 70, bac[1] - 60]), ganDat([bac[0] - 30, bac[1] - 110]), ganDat([bac[0] + 40, bac[1] - 120])];
  const duoi = [bac, ganDat([bac[0] - 10, bac[1] - 60]), ganDat([bac[0] - 5, bac[1] - 110])];
  const kb = { ...CHUNG, chu_co_ta: 'LÊ', ti_le_thuyen: .35,
    may_quay: [[0, at(R(0), .4)[0], at(R(0), .4)[1] + 60, 560, 60, -4], [3.4, song[0], song[1] - 40, 380, 56, -8], [8.3, song[0], song[1], 330, 55, -10], [13.9, song[0], song[1] - 30, 320, 55, -10],
      [21, song[0], song[1] - 40, 300, 54, -12], [24.2, bac[0], bac[1] - 60, 300, 54, -12], [27.5, bac[0], bac[1] - 40, 320, 55, -12], [30.7, (KL[0] + NA[0]) / 2, (KL[1] + NA[1]) / 2 - 40, 760, 66, 0], [34, (KL[0] + NA[0]) / 2, (KL[1] + NA[1]) / 2 - 60, 740, 66, 0]],
    may_quay_sau: [[0, KL[0] - 100, KL[1] - 300, 760, 66, 0], [6.9, KL[0] - 80, KL[1] - 320, 720, 64, -4]],
    doan_quan: [
      { ten: 'Nghĩa quân vào Nghệ An', ben: 'ta', tuong: true, co: 'LÊ LỢI', linh: 15, ngua: 3, gian_cach: .02, duong: 0, tu: 0, den: .97, t0: .5, t1: 7, an_sau: 17 },
      { ten: 'Quân Minh giữ ải hiểm', ben: 'dich', tuong: true, co: 'MINH', linh: 15, ngua: 4, gian_cach: .2, duong: [traiMinh, nam], t0: 8.3, t1: 9, an_sau: 21 },
      { ten: 'Nghĩa quân giả rút', ben: 'ta', tuong: true, co: 'LÊ LỢI', linh: 12, ngua: 2, gian_cach: .03, duong: 1, tu: 0, den: 1, t0: 17.2, t1: 21 },
      { ten: 'Quân Minh vượt sông', ben: 'dich', phuong_tien: 'thuyen', thuyen: 6, gian_cach: .2, ngang: 0, duong: qua(QS.nuocB, QS.nuocA), t0: 21, t1: 23.2, an_sau: 23.6 },
      { ten: 'Quân Minh đuổi theo, lọt ổ phục kích', ben: 'dich', tuong: true, co: 'MINH', linh: 14, ngua: 3, gian_cach: .03, duong: duoi, t0: 23.2, t1: 26.4, nga_tai: 28.4, an_sau: 31 },
      { ten: 'Tàn quân Minh chạy về thành Nghệ An', ben: 'dich', linh: 9, ngua: 2, gian_cach: .02, duong: 3, tu: 0, den: .97, t0: 30.7, t1: 33.6 }],
    mui_ten: [{ duong: 0, ben: 'ta', t0: .5, t1: 7, day: 14 }, { duong: 1, ben: 'ta', t0: 17.2, t1: 21, day: 12 }, { duong: [nam, QS.nuocA, duoi[2]], ben: 'dich', net: 'dut', t0: 21, t1: 26.4 },
      ...pb.map((p, i) => ({ duong: [p, duoi[1 + (i % 2)]], ben: 'ta', t0: 26.6 + i * .2, t1: 27.8 + i * .2, day: 11 })), { duong: 3, ben: 'dich', net: 'dut', t0: 30.7, t1: 33.6 }],
    phuc_binh: pb.map((p, i) => ({ xy: p, ben: 'ta', t0: 19 + i * .3, huong_toi: duoi[1] })),
    lua: [{ xy: ganDat([bac[0] + 20, bac[1] - 20]), ban_kinh: 40, t0: 14, t1: 21, ngon: 5 }],
    co_cam: [{ xy: ganDat([bac[0] + 20, bac[1] - 30]), ben: 'ta', t0: 30 }],
    nhan: [
      { xy: at(R(0), .3), chu: 'Nghĩa quân từ miền tây Thanh Hóa tiến vào Nghệ An', ben: 'ta', t0: .5, t1: 3.4 },
      { xy: KL, chu: 'Đóng ở bờ sông Lam gần ải Khả Lưu – vùng Anh Sơn ngày nay', ben: 'ta', t0: 3.5, t1: 7.3 },
      { xy: song, chu: 'Hai bên đóng quân cách sông nhiều ngày', t0: 8.4, t1: 11.6 },
      { xy: nam, chu: 'Quân Minh đông, chiếm giữ ải hiểm', ben: 'dich', t0: 11.7, t1: 13.8 },
      { xy: bac, chu: 'Lê Lợi cho đốt trại, giả vờ rút lui', ben: 'ta', t0: 14, t1: 17.2 },
      { xy: pb[2], chu: 'Ngầm đặt phục binh ở chỗ hiểm yếu', ben: 'ta', t0: 17.3, t1: 21 },
      { xy: QS.nuocA, chu: 'Quân Minh tưởng nghĩa quân bỏ chạy, vượt sông đuổi theo', ben: 'dich', t0: 21.1, t1: 24.2 },
      { xy: duoi[1], chu: 'Lọt vào trận địa mai phục – nghĩa quân đổ ra đánh', ben: 'ta', t0: 24.3, t1: 27.5 },
      { xy: song, chu: 'Quân Minh thua to, bị chém và chết đuối rất nhiều', ben: 'ta', t0: 27.6, t1: 30.7 },
      { xy: NA, chu: 'Tàn quân chạy về cố thủ thành Nghệ An', ben: 'dich', t0: 30.8, t1: 33.4 }] };
  ghi(id, kb); }

/* ==================== TỐT ĐỘNG – CHÚC ĐỘNG 1426 ==================== */
if (!only || only === 'tot-dong-1426') { const id = 'tot-dong-1426', H = moTran(id), { R, at, DD, ganDat } = H;
  const DQ = DD['Thành Đông Quan'], CB = DD['Cao Bộ'], TD = DD['Tốt Động'], CD = DD['Chúc Động'], NK = DD['Ninh Kiều'];
  const canhTrai = [ganDat([TD[0] - 90, TD[1] - 60]), ganDat([TD[0] - 110, TD[1] + 10]), ganDat([CD[0] - 80, CD[1] - 90])], canhPhai = [ganDat([TD[0] + 60, TD[1] + 80]), ganDat([CD[0] + 90, CD[1] + 40]), ganDat([NK[0] + 80, NK[1] + 50])];
  const kb = { ...CHUNG, chu_co_ta: 'LÊ',
    may_quay: [[0, (DQ[0] + CB[0]) / 2, (DQ[1] + CB[1]) / 2 + 40, 640, 62, -4], [4.3, (TD[0] + CD[0]) / 2, (TD[1] + CD[1]) / 2, 420, 57, -6], [8.7, (DQ[0] + TD[0]) / 2 + 60, (DQ[1] + TD[1]) / 2, 620, 62, -4], [11.8, NK[0], NK[1], 380, 56, -8],
      [16.6, TD[0], TD[1], 360, 56, -8], [19.7, (TD[0] + CD[0]) / 2, (TD[1] + CD[1]) / 2, 400, 57, -8], [22.7, (TD[0] + CD[0]) / 2, (TD[1] + CD[1]) / 2, 360, 56, -10], [27.2, TD[0] + 20, TD[1] - 10, 330, 55, -12], [31.1, (TD[0] + CD[0]) / 2, (TD[1] + CD[1]) / 2, 380, 56, -10], [34.1, (TD[0] + DQ[0]) / 2, (TD[1] + DQ[1]) / 2, 620, 62, -4], [39.5, DQ[0] - 60, DQ[1] + 60, 460, 58, -6]],
    may_quay_sau: [[0, DQ[0] - 420, DQ[1] + 200, 660, 64, 0], [10.5, DQ[0] - 390, DQ[1] + 180, 620, 62, -6]],
    doan_quan: [
      { ten: 'Vương Thông chia quân tiến đánh', ben: 'dich', tuong: true, co: 'VƯƠNG THÔNG', linh: 15, ngua: 5, gian_cach: .016, duong: 0, tu: 0, den: .5, t0: .5, t1: 4.3, an_sau: 19.6 },
      { ten: 'Cánh quân Minh thứ hai', ben: 'dich', linh: 12, ngua: 3, gian_cach: .016, duong: 1, tu: 0, den: .5, t0: 1, t1: 4.3, an_sau: 19.6 },
      { ten: 'Quân Minh vào đồng lầy Tốt Động', ben: 'dich', tuong: true, co: 'VƯƠNG THÔNG', linh: 15, ngua: 5, gian_cach: .016, duong: 0, tu: .5, den: .96, t0: 19.7, t1: 24, an_sau: 34 },
      { ten: 'Cánh quân Minh vào Chúc Động', ben: 'dich', linh: 12, ngua: 3, gian_cach: .016, duong: 1, tu: .5, den: .96, t0: 19.9, t1: 24.2, nga_tai: 30.4, an_sau: 36 },
      { ten: 'Vương Thông bị thương chạy về Đông Quan', ben: 'dich', tuong: true, co: 'VƯƠNG THÔNG', linh: 5, ngua: 2, gian_cach: .03, duong: 2, tu: 0, den: .97, t0: 34.2, t1: 38.8 }],
    mui_ten: [{ duong: 0, ben: 'dich', net: 'dut', den: .5, t0: .5, t1: 4.3, an_sau: 19.5 }, { duong: 1, ben: 'dich', net: 'dut', den: .5, t0: 1, t1: 4.3, an_sau: 19.5 }, { duong: 0, ben: 'dich', net: 'dut', bat_dau: .5, t0: 19.7, t1: 24 }, { duong: 1, ben: 'dich', net: 'dut', bat_dau: .5, t0: 19.9, t1: 24.2 },
      ...[...canhTrai, ...canhPhai].map((p, i) => ({ duong: [p, i < 3 ? TD : CD], ben: 'ta', t0: 22.8 + i * .25, t1: 24.2 + i * .25, day: 11 })), { duong: 2, ben: 'dich', net: 'dut', t0: 34.2, t1: 38.8 }],
    phuc_binh: [...canhTrai, ...canhPhai].map((p, i) => ({ xy: p, ben: 'ta', t0: 4.6 + i * .3, huong_toi: i < 3 ? TD : CD })),
    lua: [{ xy: TD, ban_kinh: 44, t0: 25, t1: 32, ngon: 6 }, { xy: CD, ban_kinh: 40, t0: 25.6, t1: 32, ngon: 5 }],
    co_cam: [{ xy: ganDat([TD[0] + 12, TD[1] - 12]), ben: 'ta', t0: 33 }, { xy: ganDat([CD[0] + 12, CD[1] - 12]), ben: 'ta', t0: 33.6 }],
    nhan: [
      { xy: DQ, chu: 'Vương Thông từ Đông Quan chia quân đánh Cao Bộ', ben: 'dich', t0: .5, t1: 4.3 },
      { xy: TD, chu: 'Nghĩa quân bố trí phục binh ở Tốt Động và Chúc Động', ben: 'ta', t0: 4.4, t1: 7.7 },
      { xy: at(R(0), .3), chu: 'Theo sử cũ: quân Minh khoảng 10 vạn', ben: 'dich', t0: 8.8, t1: 11.8 },
      { xy: NK, chu: 'Bình Ngô đại cáo: "Ninh Kiều máu chảy thành sông"', ben: 'ta', t0: 11.9, t1: 16.6 },
      { xy: TD, chu: '"Tốt Động thây chất đầy nội"', ben: 'ta', t0: 16.7, t1: 18.7 },
      { xy: at(R(0), .75), chu: 'Quân Minh hành quân vào vùng đồng lầy Tốt Động', ben: 'dich', t0: 19.8, t1: 22.7 },
      { xy: CD, chu: 'Phục binh bất ngờ đổ ra từ hai cánh', ben: 'ta', t0: 22.8, t1: 27.2 },
      { xy: TD, chu: 'Quân Minh bị dồn xuống bùn lầy, sông ngòi, đội hình rối loạn', ben: 'ta', t0: 27.3, t1: 31.1 },
      { xy: [TD[0] + 30, TD[1] + 50], chu: 'Theo sử cũ: hơn 5 vạn tử trận, hơn 1 vạn bị bắt', ben: 'ta', t0: 31.2, t1: 36.8 },
      { xy: DQ, chu: 'Vương Thông bị thương, chạy về cố thủ thành Đông Quan', ben: 'dich', t0: 34.2, t1: 38.9 }] };
  ghi(id, kb); }

/* ==================== ĐẠI LA 931 (Dương Đình Nghệ) ==================== */
if (!only || only === 'dai-la-931') { const id = 'dai-la-931', H = moTran(id), { R, at, DD, ganDat } = H;
  const DLa = DD['Thành Đại La'], AC = DD['Ái Châu'], NH = DD['Hướng Nam Hán'], chan = at(R(2), 1);
  const vay = vongQuanh(H, DLa, 60, 6, .3);
  const kb = { ...CHUNG, chu_co_ta: 'DƯƠNG',
    may_quay: [[0, at(R(0), .5)[0] + 60, at(R(0), .5)[1], 900, 70, 0], [2.9, (DLa[0] + NH[0]) / 2, (DLa[1] + NH[1]) / 2 + 200, 700, 66, 0], [7.4, chan[0], chan[1] + 160, 480, 58, -6], [8.4, AC[0] + 80, AC[1] - 120, 520, 60, -4],
      [13.8, at(R(0), .6)[0] + 60, at(R(0), .6)[1], 620, 62, -4], [18, DLa[0], DLa[1] + 180, 420, 57, -6], [22.2, DLa[0] + 120, DLa[1] + 160, 480, 58, -6], [25, (DLa[0] + NH[0]) / 2, (DLa[1] + NH[1]) / 2 + 220, 640, 62, -4],
      [27.8, chan[0] - 40, chan[1] + 150, 400, 57, -8], [31.6, DLa[0], DLa[1] + 170, 380, 56, -8], [35.6, DLa[0], DLa[1] + 170, 360, 56, -10]],
    may_quay_sau: [[0, DLa[0] - 360, DLa[1] + 520, 860, 68, 0], [6.6, DLa[0] - 340, DLa[1] + 500, 820, 66, -4]],
    doan_quan: [
      { ten: 'Quân Ái Châu tiến ra', ben: 'ta', tuong: true, co: 'DƯƠNG', linh: 15, ngua: 3, gian_cach: .012, duong: 0, tu: 0, den: .97, t0: .4, t1: 2.9, an_sau: 17.9 },
      { ten: 'Quân Nam Hán sang cứu (lần đầu)', ben: 'dich', linh: 10, ngua: 3, gian_cach: .03, duong: 2, tu: 0, den: .8, t0: 2.9, t1: 5.6, nga_tai: 6.2, an_sau: 8.2 },
      { ten: 'Ngô Quyền trong hàng ngũ Dương Đình Nghệ', ben: 'ta', tuong: true, co: 'NGÔ', linh: 6, ngua: 2, gian_cach: .02, duong: 0, tu: .3, den: .55, t0: 12.3, t1: 17, an_sau: 17.9 },
      { ten: 'Ba nghìn giả tử vây Đại La', ben: 'ta', tuong: true, co: 'DƯƠNG', linh: 15, ngua: 3, gian_cach: .012, duong: 0, tu: .5, den: .97, t0: 18, t1: 21.8 },
      { ten: 'Thứ sử Lý Tiến bỏ chạy', ben: 'dich', tuong: true, co: 'LÝ TIẾN', linh: 5, ngua: 2, gian_cach: .03, duong: 1, tu: 0, den: .95, t0: 22.2, t1: 25, an_sau: 25.6 },
      { ten: 'Trần Bảo đem quân sang cứu', ben: 'dich', tuong: true, co: 'TRẦN BẢO', linh: 14, ngua: 4, gian_cach: .03, duong: 2, tu: 0, den: .97, t0: 25, t1: 28.4, nga_tai: 30.2, an_sau: 33 },
      { ten: 'Dương Đình Nghệ đón đánh', ben: 'ta', tuong: true, co: 'DƯƠNG', linh: 10, ngua: 3, gian_cach: .05, duong: 3, tu: 0, den: .95, t0: 27.8, t1: 29.4 }],
    mui_ten: [{ duong: 0, ben: 'ta', t0: .4, t1: 2.9, day: 14 }, { duong: 2, ben: 'dich', net: 'dut', den: .8, t0: 2.9, t1: 5.6, an_sau: 8.3 }, { duong: [ganDat([chan[0] - 120, chan[1] - 20]), at(R(2), .8)], ben: 'ta', t0: 4.6, t1: 6.4, day: 13, an_sau: 8.3 },
      { duong: 1, ben: 'dich', net: 'dut', t0: 22.2, t1: 25 }, { duong: 2, ben: 'dich', net: 'dut', t0: 25, t1: 28.4 }, { duong: 3, ben: 'ta', t0: 27.8, t1: 29.4, day: 14 }],
    phuc_binh: vay.map((p, i) => ({ xy: p, ben: 'ta', t0: 18.3 + i * .25, huong_toi: DLa })),
    lua: [{ xy: at(R(2), .8), ban_kinh: 40, t0: 5.4, t1: 8.4, ngon: 5 }, { xy: chan, ban_kinh: 46, t0: 29.6, t1: 35, ngon: 6 }],
    co_cam: [{ xy: ganDat([DLa[0] + 14, DLa[1] + 16]), ben: 'ta', t0: 24.6 }, { xy: ganDat([chan[0] + 14, chan[1] - 12]), ben: 'ta', t0: 31.4 }],
    nhan: [
      { xy: at(R(0), .4), chu: 'Quân Ái Châu tiến ra vây thành Đại La', ben: 'ta', t0: .5, t1: 2.9 },
      { xy: at(R(2), .5), chu: 'Nam Hán sai quân sang cứu', ben: 'dich', t0: 3, t1: 4.6 },
      { xy: at(R(2), .8), chu: 'Bị chặn đánh tan trước khi kịp tới nơi', ben: 'ta', t0: 4.7, t1: 7.4 },
      { xy: AC, chu: 'Trong hàng ngũ Dương Đình Nghệ có nhiều tướng trẻ tài giỏi', ben: 'ta', t0: 8.5, t1: 12.3 },
      { xy: at(R(0), .5), chu: 'Ngô Quyền – người sau này thắng trận Bạch Đằng năm 938', ben: 'ta', t0: 12.4, t1: 17.1 },
      { xy: DLa, chu: 'Ba nghìn giả tử cùng nghĩa binh vây thành Đại La', ben: 'ta', t0: 18.1, t1: 22.2 },
      { xy: at(R(1), .5), chu: 'Thứ sử Lý Tiến hoảng sợ bỏ chạy về nước', ben: 'dich', t0: 22.3, t1: 25 },
      { xy: at(R(2), .4), chu: 'Vua Nam Hán sai Trần Bảo đem quân sang cứu', ben: 'dich', t0: 25.1, t1: 27.8 },
      { xy: chan, chu: 'Quân Nam Hán thua to, Trần Bảo tử trận', ben: 'ta', t0: 27.9, t1: 31.6 },
      { xy: DLa, chu: 'Dương Đình Nghệ tự xưng Tiết độ sứ, nắm quyền tự chủ', ben: 'ta', t0: 31.7, t1: 35.3 }] };
  ghi(id, kb); }
