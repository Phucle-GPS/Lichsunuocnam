#!/usr/bin/env node
/* SINH KỊCH BẢN BẢN ĐỒ cho 5 trận (Bạch Đằng 938, Bạch Đằng 1288, Rạch Gầm 1785, Đống Đa 1789, Như Nguyệt 1077) – Xưởng film Lịch sử Việt Nam
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
  const veLong = (p, r = 30) => { for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (sau(x, y)) return [x, y]; }
    for (let d = 0; d <= r; d++) for (let a = 0; a < 32; a++) { const x = Math.round(p[0] + Math.cos(a / 32 * 6.283) * d), y = Math.round(p[1] + Math.sin(a / 32 * 6.283) * d); if (nuoc(x, y) && nuoc(x + 2, y) && nuoc(x - 2, y) && nuoc(x, y + 2) && nuoc(x, y - 2)) return [x, y]; }   // rạch hẹp
    throw new Error(id + ': không có lòng nước gần ' + p); };
  /* đường thuyền: lấy đoạn tuyến (hoặc mảng điểm), chia dày, hút từng điểm vào lòng nước, bỏ điểm trùng */
  /* đoạn a→b cắt qua đất? → chèn điểm giữa đã hút vào lòng nước, đệ quy tới khi cả đoạn trên nước */
  const lienNuoc = (a, b, sau = 0) => { const n = Math.max(4, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) * 2)), cham = []; for (let j = 1; j < n; j++) { const x = a[0] + (b[0] - a[0]) * j / n, y = a[1] + (b[1] - a[1]) * j / n; if (!nuoc(x, y) || !nuoc(Math.round(x), Math.round(y))) cham.push(j); }
    if (!cham.length) return [b]; return quaO(a, b); };
  /* đường qua các ô nước liền kề (BFS 4 hướng trên lưới 640×360): nối tâm ô kề nhau → luôn nằm trọn trên nước */
  const quaO = (a, b, chat = true) => { const ca = [Math.floor(a[0] / 4), Math.floor(a[1] / 4)], cb = [Math.floor(b[0] / 4), Math.floor(b[1] / 4)], le = 80;
    const x0 = Math.max(0, Math.min(ca[0], cb[0]) - le), y0 = Math.max(0, Math.min(ca[1], cb[1]) - le), x1 = Math.min(639, Math.max(ca[0], cb[0]) + le), y1 = Math.min(359, Math.max(ca[1], cb[1]) + le), gw = x1 - x0 + 1;
    const o1 = (x, y) => x >= 0 && y >= 0 && x < 640 && y < 360 && NB[y * 640 + x] === 1, giua = (x, y) => o1(x, y) && o1(x + 1, y) && o1(x - 1, y) && o1(x, y + 1) && o1(x, y - 1);
    const W8 = (x, y) => (x === ca[0] && y === ca[1]) || (x === cb[0] && y === cb[1]) ? o1(x, y) : chat ? giua(x, y) : o1(x, y), key = (x, y) => (y - y0) * gw + (x - x0), tu = new Map([[key(...ca), -1]]), hang = [ca];
    for (let h = 0; h < hang.length; h++) { const [x, y] = hang[h]; if (x === cb[0] && y === cb[1]) break; for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) { const X = x + dx, Y = y + dy; if (X < x0 || Y < y0 || X > x1 || Y > y1 || !W8(X, Y) || tu.has(key(X, Y))) continue; tu.set(key(X, Y), key(x, y)); hang.push([X, Y]); } }
    if (!tu.has(key(...cb)) && chat) return quaO(a, b, false);   // không thông qua ô giữa nước → cho phép ô sát bờ
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
