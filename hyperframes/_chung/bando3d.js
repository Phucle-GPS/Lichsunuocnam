/* =========================================================================
   BẢN ĐỒ CHIẾN DỊCH 3D – Xưởng film Lịch sử Việt Nam (dùng trong dự án HyperFrames)
   Địa hình thật nổi khối (do-cao.png) phủ nền 2K (nen-2k.jpg); trên đó: mũi tên tiến quân
   bám mặt đất, tướng cưỡi ngựa cầm cờ, đoàn lính, kỵ binh, lửa + khói và VẾT ĐẤT CHÁY ở lại.
   Người và ngựa là MÔ HÌNH 3D có khớp (ngựa phi nước đại, lính bước đi), cờ vải bay, bóng đổ.
   Mọi thứ là hàm của thời gian t (giây, theo đồng hồ của cảnh) → tua tới đâu dựng đúng tới đó.
   Dùng: const bd = BanDo3D(khungDiv, { nen, doCao, du_lieu, kich_ban, sau_tran }); bd.ve(t)
   ========================================================================= */
(function () {
  'use strict';
  const MAU = { ta: '#c8352b', dich: '#1f5fa8' };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const prog = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a)), muot = x => x * x * (3 - 2 * x);
  const PI2 = Math.PI * 2;
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  /* điểm trên đường gấp khúc theo tỉ lệ độ dài 0..1 */
  function duong(pts) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tong = L[L.length - 1] || 1;
    return { tong, pts, tai(u) { const d = clamp(u) * tong; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; },
      huong(u) { const e = 6 / tong, a = this.tai(u - e), b = this.tai(u + e); return [b[0] - a[0], b[1] - a[1]]; },
      doan(u0, u1, n = 60) { const o = []; for (let k = 0; k <= n; k++) o.push(this.tai(u0 + (u1 - u0) * k / n)); return o; } };
  }

  /* ---------- hình vẽ phẳng còn dùng: chữ trên cờ, lửa, khói ---------- */
  function canvasTx(THREE, w, h, ve) { const c = document.createElement('canvas'); c.width = w; c.height = h; ve(c.getContext('2d')); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; return { c, tx }; }

  window.BanDo3D = function (khung, o) {
    const THREE = window.THREE, D = o.du_lieu, K = o.kich_ban, W = D.khung.rong, H = D.khung.cao;
    const R = khung.clientWidth || 1920, C = khung.clientHeight || 1080;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(R, C); renderer.outputColorSpace = THREE.SRGBColorSpace; khung.appendChild(renderer.domElement);
    const scene = new THREE.Scene();
    /* màu trung bình mép bản đồ → đồng bằng bao quanh + sương xa cùng tông, không lộ mảng tối */
    const mauMep = (() => { const c = document.createElement('canvas'); c.width = 64; c.height = 36; const g = c.getContext('2d'); g.drawImage(o.nen, 0, 0, 64, 36); const d = g.getImageData(0, 0, 64, 36).data; let r = 0, gg = 0, b = 0, n = 0; for (let y = 0; y < 36; y++) for (let x = 0; x < 64; x++) { if (x > 3 && x < 60 && y > 3 && y < 32) continue; const i = (y * 64 + x) * 4; r += d[i]; gg += d[i + 1]; b += d[i + 2]; n++; } return new THREE.Color(`rgb(${Math.round(r / n)},${Math.round(gg / n)},${Math.round(b / n)})`); })();
    const mauSuong = mauMep.clone().lerp(new THREE.Color('#d9cfb8'), .45);
    scene.background = mauSuong; scene.fog = new THREE.Fog(mauSuong, 1500, 4000);
    const cam = new THREE.PerspectiveCamera(38, R / C, 1, 8000);
    /* tọa độ: điểm ảnh bản đồ (0..W, 0..H) → thế giới (rộng 1000 đơn vị) */
    const SW = 1000, SH = SW * H / W, ux = x => (x / W - .5) * SW, uz = y => (y / H - .5) * SH;
    /* độ cao thật (phóng đại) */
    const hc = document.createElement('canvas'); hc.width = o.doCao.naturalWidth; hc.height = o.doCao.naturalHeight;
    const hg = hc.getContext('2d'); hg.drawImage(o.doCao, 0, 0); const hdat = hg.getImageData(0, 0, hc.width, hc.height).data;
    const dc = D.khung.do_cao, metMoiDV = dc.met_moi_diem * W / SW, PHONG = K.phong_dai_do_cao || 2.6;
    const cao1 = (x, y) => { const X = clamp(Math.round(x / W * (hc.width - 1)), 0, hc.width - 1), Y = clamp(Math.round(y / H * (hc.height - 1)), 0, hc.height - 1); const v = hdat[(Y * hc.width + X) * 4] / 255; return (dc.thap + v * (dc.cao - dc.thap)) / metMoiDV * PHONG; };
    /* độ cao nội suy song tuyến: đặt người/ngựa không nhảy bậc khi đi qua từng ô */
    const cao = (x, y) => { const fx = clamp(x / W, 0, 1) * (hc.width - 1), fy = clamp(y / H, 0, 1) * (hc.height - 1), X = Math.floor(fx), Y = Math.floor(fy), ax = fx - X, ay = fy - Y;
      const v = (i, j) => hdat[(clamp(j, 0, hc.height - 1) * hc.width + clamp(i, 0, hc.width - 1)) * 4] / 255;
      const m = (v(X, Y) * (1 - ax) + v(X + 1, Y) * ax) * (1 - ay) + (v(X, Y + 1) * (1 - ax) + v(X + 1, Y + 1) * ax) * ay; return (dc.thap + m * (dc.cao - dc.thap)) / metMoiDV * PHONG; };
    /* lưới địa hình */
    const geo = new THREE.PlaneGeometry(SW, SH, 512, Math.round(512 * H / W)); geo.rotateX(-Math.PI / 2);
    /* mép bản đồ hạ dần về 0 (không lộ vách cắt) */
    const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const u = pos.getX(i) / SW + .5, v = pos.getZ(i) / SH + .5, x = u * W, y = v * H;
      pos.setY(i, Math.max(0, cao1(x, y)) * muot(clamp(Math.min(u, 1 - u, v, 1 - v) / .08))); }   // dải 8% sát mép thoải dần (3% tạo vách tối)
    geo.computeVertexNormals();
    /* vùng bao quanh: ảnh nền lặp đối xứng (liền mép) + tông tối hơn → máy quay ra rộng không thấy "tấm bản đồ" trơ trọi */
    { const tx = new THREE.Texture(o.nen); tx.needsUpdate = true; tx.colorSpace = THREE.SRGBColorSpace; tx.wrapS = tx.wrapT = THREE.MirroredRepeatWrapping; tx.repeat.set(7, 7); tx.offset.set(-3, -3); tx.anisotropy = 4;
      const ngoai = new THREE.Mesh(new THREE.PlaneGeometry(SW * 7, SH * 7), new THREE.MeshLambertMaterial({ map: tx, color: '#f8f5ef' })); ngoai.rotation.x = -Math.PI / 2; ngoai.position.y = -0.4; scene.add(ngoai); }
    /* nền phủ là canvas động: ảnh nền 2K + mũi tên + vết cháy vẽ lại theo t */
    const nc = document.createElement('canvas'); nc.width = W; nc.height = H; const ng = nc.getContext('2d');
    const ntx = new THREE.CanvasTexture(nc); ntx.colorSpace = THREE.SRGBColorSpace; ntx.anisotropy = 8;
    scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: ntx })));
    scene.add(new THREE.HemisphereLight('#fff6e8', '#4a3e2a', 1.25)); const sun = new THREE.DirectionalLight('#fff1d6', 1.7); sun.position.set(-500, 700, -300); scene.add(sun);
    const P3 = (x, y, nang = 0) => new THREE.Vector3(ux(x), Math.max(0, cao(x, y)) + nang, uz(y));
    const gocTG = (dx, dy) => -Math.atan2(dy * SH / H, dx * SW / W);   // hướng trên bản đồ → góc quay quanh trục đứng (mô hình nhìn theo +x)

    /* =====================================================================
       MÔ HÌNH 3D: lính bộ, kỵ binh, tướng cưỡi ngựa cầm cờ (mặt hướng +x, chân chạm y = 0)
       ===================================================================== */
    const L = (c, o2 = {}) => new THREE.MeshLambertMaterial(Object.assign({ color: c }, o2));
    const VL = {
      da: L('#c99a72'), toc: L('#1d1612'), go: L('#5a3d22'), sat: L('#c4c7cc'), satToi: L('#5d6066'), day: L('#3a2a1a'), vang: L('#c9a23a'), rom: L('#c7a865'),
      ao: { ta: L('#a8301f'), dich: L('#27508c') }, giap: { ta: L('#5a3524'), dich: L('#3c4250') }, quan: { ta: L('#3b2b20'), dich: L('#2a2f3a') },
      khien: { ta: L('#8a5a2c'), dich: L('#2f5fa3') }, tua: { ta: L('#d23a22'), dich: L('#d23a22') },
      ngua: { ta: L('#6a3d22'), dich: L('#2b2724') }, bom: L('#17110d'), mong: L('#2a2420'), yen: { ta: L('#8e2a1c'), dich: L('#25406e') },
      bong: new THREE.MeshBasicMaterial({ color: '#000', transparent: true, opacity: .32, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2 })
    };
    const GE = {}, gq = (k, f) => GE[k] || (GE[k] = f());
    const cyl = (rt, rb, h, s = 8) => gq(`c${rt},${rb},${h},${s}`, () => new THREE.CylinderGeometry(rt, rb, h, s));
    const sph = (r, a = 12, b = 9) => gq(`s${r},${a}`, () => new THREE.SphereGeometry(r, a, b));
    const box = (x, y, z) => gq(`b${x},${y},${z}`, () => new THREE.BoxGeometry(x, y, z));
    const cone = (r, h, s = 10) => gq(`k${r},${h},${s}`, () => new THREE.ConeGeometry(r, h, s));
    const dia = () => gq('dia', () => { const g = new THREE.CircleGeometry(1, 20); g.rotateX(-Math.PI / 2); return g; });
    const M = (geo2, mat, cha, x = 0, y = 0, z = 0, rx = 0, ry = 0, rz = 0, s) => { const m = new THREE.Mesh(geo2, mat); m.position.set(x, y, z); m.rotation.set(rx, ry, rz); if (s) m.scale.set(s[0], s[1], s[2]); cha.add(m); return m; };
    const N = (cha, x = 0, y = 0, z = 0) => { const g = new THREE.Group(); g.position.set(x, y, z); cha.add(g); return g; };

    /* người: đứng (đi bộ) hoặc ngồi trên yên. vai trò: 'linh' | 'tuong' */
    function taoNguoi(ben, vaiTro, ngoi) {
      const g = new THREE.Group(), than = N(g, 0, .95, 0), j = { g, than };
      // chân: hông → gối → bàn chân
      ['T', 'P'].forEach((s, i) => { const z = i ? .1 : -.1, hip = N(than, 0, 0, z); M(cyl(.075, .065, .46), VL.quan[ben], hip, 0, -.23, 0);
        const goi = N(hip, 0, -.46, 0); M(cyl(.06, .05, .44), VL.quan[ben], goi, 0, -.22, 0); M(box(.2, .07, .1), VL.day, goi, .05, -.46, 0); j['hip' + s] = hip; j['goi' + s] = goi; });
      // thân, váy giáp, giáp ngực, đai
      M(cyl(.16, .2, .58, 10), VL.ao[ben], than, 0, .3, 0); M(cyl(.21, .29, .32, 10), VL.giap[ben], than, 0, -.04, 0); M(box(.27, .34, .4), VL.giap[ben], than, .02, .36, 0); M(cyl(.21, .21, .06, 10), VL.vang, than, 0, .13, 0);
      // đầu + mũ: ta – nón chóp đan (lính) / mũ đỏ có chóp vàng (tướng); quân Minh – mũ trụ sắt chóp nhọn, tua đỏ
      const dau = N(than, 0, .73, 0); M(sph(.11), VL.da, dau, 0, 0, 0); M(sph(.112, 12, 6), VL.toc, dau, -.02, .01, 0, 0, 0, 0, [1, .9, 1]);
      if (ben === 'ta') { if (vaiTro === 'tuong') { M(cyl(.1, .13, .14, 10), VL.ao.ta, dau, 0, .1, 0); M(sph(.05), VL.vang, dau, 0, .19, 0); } else M(cone(.24, .16, 14), VL.rom, dau, 0, .12, 0); }
      else { M(sph(.13, 12, 6), VL.satToi, dau, 0, .03, 0, 0, 0, 0, [1, .9, 1]); M(cone(.03, .14, 6), VL.sat, dau, 0, .19, 0); M(cone(.06, .1, 8), VL.tua.dich, dau, 0, .13, 0, Math.PI); }
      // tay: vai → khuỷu
      ['T', 'P'].forEach((s, i) => { const z = i ? .23 : -.23, vai = N(than, 0, .55, z); M(cyl(.05, .045, .3), VL.ao[ben], vai, 0, -.15, 0);
        const khuyu = N(vai, 0, -.3, 0); M(cyl(.045, .04, .27), VL.ao[ben], khuyu, 0, -.135, 0); M(sph(.05), VL.da, khuyu, 0, -.29, 0); j['vai' + s] = vai; j['khuyu' + s] = khuyu; });
      // vũ khí: lính – giáo dài tay phải, khiên tay trái; tướng – áo choàng
      if (vaiTro === 'linh') {
        j.vaiP.rotation.z = .5; j.khuyuP.rotation.z = -.9;
        const giao = N(j.khuyuP, 0, -.29, 0); giao.rotation.z = .4; M(cyl(.016, .016, 2.5, 5), VL.go, giao, 0, .5, 0); M(cone(.04, .22, 6), VL.sat, giao, 0, 1.86, 0); if (ben === 'dich') M(cone(.05, .08, 6), VL.tua.dich, giao, 0, 1.72, 0, Math.PI);
        j.vaiT.rotation.z = .35; j.khuyuT.rotation.z = -.6;
        if (ben === 'ta') M(cyl(.24, .24, .04, 14), VL.khien.ta, j.khuyuT, .12, -.18, -.06, Math.PI / 2, 0, 0); else M(box(.04, .52, .34), VL.khien.dich, j.khuyuT, .12, -.16, -.06);
      } else {
        const ao = M(box(.04, .7, .46), VL.ao[ben], than, -.2, .2, 0, 0, 0, -.12); j.ao = ao;
        M(cyl(.012, .012, 1.0, 5), VL.sat, j.khuyuT, .04, -.3, 0, 0, 0, -1.2);   // kiếm
      }
      if (ngoi) { j.hipT.rotation.z = j.hipP.rotation.z = 1.35; j.goiT.rotation.z = j.goiP.rotation.z = -1.45; j.hipT.position.z = -.2; j.hipP.position.z = .2; }
      return j;
    }
    function tuThe(j, ph, dangDi) {   // bước đi: chân lệch pha, tay vung, thân nhấp nhô
      const s = dangDi ? Math.sin(ph * PI2) : 0, c = dangDi ? Math.cos(ph * PI2) : 0;
      j.hipT.rotation.z = s * .55; j.hipP.rotation.z = -s * .55; j.goiT.rotation.z = -Math.max(0, -c) * .9; j.goiP.rotation.z = -Math.max(0, c) * .9;
      j.than.position.y = .95 + Math.abs(s) * .035; j.vaiT.rotation.z = .35 - s * .25;
    }

    /* ngựa: thân, cổ, đầu, bờm, đuôi, 4 chân 2 đốt + móng; phi nước đại theo pha */
    function taoNgua(ben) {
      const g = new THREE.Group(), lo = VL.ngua[ben], than = N(g, 0, 1.18, 0), j = { g, than, chan: [] };
      M(sph(1, 16, 12), lo, than, 0, 0, 0, 0, 0, 0, [.74, .34, .3]); M(sph(1, 14, 10), lo, than, .52, .02, 0, 0, 0, 0, [.36, .37, .3]); M(sph(1, 14, 10), lo, than, -.52, .04, 0, 0, 0, 0, [.4, .38, .32]);
      const co = N(than, .62, .18, 0); j.co = co; M(cyl(.13, .22, .78, 10), lo, co, .2, .28, 0, 0, 0, -.72); M(box(.66, .12, .07), VL.bom, co, .1, .34, 0, 0, 0, .85);   // bờm dọc gáy
      const dau = N(co, .5, .58, 0); M(cyl(.075, .14, .55, 9), lo, dau, .14, -.12, 0, 0, 0, 1.95); M(cone(.035, .12, 5), lo, dau, -.04, .1, .06); M(cone(.035, .12, 5), lo, dau, -.04, .1, -.06);
      const duoi = N(than, -.86, .16, 0); j.duoi = duoi; M(cyl(.07, .03, .75, 6), VL.bom, duoi, -.12, -.33, 0, 0, 0, -.35);
      M(box(.5, .08, .66), VL.yen[ben], than, 0, .33, 0); M(box(.6, .02, .72), VL.yen[ben], than, 0, .29, 0);
      [[.5, -.12, -.16, 0], [.5, -.12, .16, 1], [-.52, -.06, -.16, 0], [-.52, -.06, .16, 1]].forEach(([x, y, z], i) => {
        const tren = N(than, x, y, z); M(cyl(.1, .065, .52, 8), lo, tren, 0, -.26, 0); const duoiC = N(tren, 0, -.52, 0); M(cyl(.055, .045, .46, 7), lo, duoiC, 0, -.23, 0); M(cyl(.06, .068, .09, 8), VL.mong, duoiC, 0, -.49, 0);
        j.chan.push({ tren, duoi: duoiC, sau: i >= 2 });
      });
      return j;
    }
    const PHA_CHAN = [0, .1, .55, .65];   // phi nước đại: trước trái, trước phải, sau trái, sau phải
    function tuTheNgua(j, ph, chay) {
      j.chan.forEach((c, i) => { const a = (ph + PHA_CHAN[i]) * PI2, s = chay ? Math.sin(a) : 0, cc = chay ? Math.cos(a) : 0;
        c.tren.rotation.z = s * (c.sau ? .5 : .62) + (chay ? (c.sau ? -.08 : .08) : 0); c.duoi.rotation.z = c.sau ? Math.max(0, cc) * .8 : -Math.max(0, cc) * 1.05; });
      const b = chay ? Math.sin(ph * PI2 * 2) : 0; j.than.position.y = 1.18 + (chay ? .06 + b * .06 : 0); j.than.rotation.z = chay ? Math.sin(ph * PI2) * .06 : 0;
      j.co.rotation.z = chay ? Math.sin(ph * PI2 + 1) * .1 : 0; j.duoi.rotation.z = chay ? -.6 + Math.sin(ph * PI2) * .15 : 0;
    }

    /* cờ vải: tấm lưới mềm, gợn sóng theo t; chữ vẽ lên mặt cờ */
    function taoCo(ben, chu, cha, cao2 = 3.2, rong = 1.5) {
      const g = N(cha); M(cyl(.03, .035, cao2, 6), VL.go, g, 0, cao2 / 2, 0); M(sph(.06), VL.vang, g, 0, cao2 + .04, 0);
      const { tx } = canvasTx(THREE, 256, 160, c => { c.fillStyle = MAU[ben]; c.fillRect(0, 0, 256, 160); c.fillStyle = '#e8c35a'; c.fillRect(0, 0, 256, 12); c.fillRect(0, 148, 256, 12);
        if (chu) { c.fillStyle = '#fff'; c.font = `800 ${chu.length > 3 ? 62 : 78}px "Be Vietnam Pro"`; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText(chu, 128, 84); } });
      const gg = new THREE.PlaneGeometry(rong, rong * .62, 14, 5); gg.translate(rong / 2, 0, 0); const goc = Float32Array.from(gg.attributes.position.array);
      const txSau = tx.clone(); txSau.wrapS = THREE.RepeatWrapping; txSau.repeat.x = -1; txSau.offset.x = 1; txSau.needsUpdate = true;   // mặt sau: chữ không bị ngược
      const vai = M(gg, new THREE.MeshLambertMaterial({ map: tx, side: THREE.FrontSide }), g, 0, cao2 - rong * .31, 0);
      M(gg, new THREE.MeshLambertMaterial({ map: txSau, side: THREE.BackSide }), g, 0, cao2 - rong * .31, 0);
      return { g, gg, goc, rong, vai };
    }
    function bayCo(c, t, pha, gio = 1) {
      const p = c.gg.attributes.position, a = p.array;
      for (let i = 0; i < p.count; i++) { const x = c.goc[i * 3], y = c.goc[i * 3 + 1], k = x / c.rong; a[i * 3] = x - k * k * .08 * gio; a[i * 3 + 1] = y - k * .05; a[i * 3 + 2] = Math.sin(x * 3.6 - t * 7 * gio + pha + y * .8) * .13 * k * gio; }
      p.needsUpdate = true; c.gg.computeVertexNormals();
    }
    const bongDuoi = (cha, rx, rz) => M(dia(), VL.bong, cha, 0, .06, 0, 0, 0, 0, [rx, 1, rz]);

    /* kho mô hình theo loại – dùng lại giữa các khung, ẩn phần thừa */
    const nhomMH = new THREE.Group(); scene.add(nhomMH);
    const KHO = {}, dangDung = {};
    const TL = K.ti_le_nguoi || 4.4;   // 1 m của mô hình = bao nhiêu đơn vị bản đồ
    function lay(loai, tao) { const ds = KHO[loai] || (KHO[loai] = []), i = dangDung[loai] = (dangDung[loai] || 0) + 1; if (!ds[i - 1]) { const m = tao(); m.g.rotation.order = 'YXZ'; nhomMH.add(m.g); ds.push(m); } const m = ds[i - 1]; m.g.visible = true; return m; }
    const taoLinh = ben => () => { const j = taoNguoi(ben, 'linh', false); bongDuoi(j.g, .45, .35); j.g.scale.setScalar(TL); return j; };
    const taoKy = ben => () => { const n = taoNgua(ben), r = taoNguoi(ben, 'linh', true); r.g.position.set(-.05, .37, 0); n.than.add(r.g); bongDuoi(n.g, 1.1, .45); n.g.scale.setScalar(TL); n.nguoi = r; return n; };
    const TUONG = {};
    function taoTuong(qi, q) { const n = taoNgua(q.ben), r = taoNguoi(q.ben, 'tuong', true); r.g.position.set(-.05, .37, 0); n.than.add(r.g); n.nguoi = r;
      r.vaiP.rotation.z = .9; r.khuyuP.rotation.z = -.35;   // tay phải nắm cán cờ
      const co = taoCo(q.ben, q.co || '', n.than, 3.6, 1.7); co.g.position.set(.12, .2, .3); co.g.rotation.order = 'YXZ'; co.g.rotation.set(0, Math.PI, .1); n.coT = co;   // cờ bay về phía sau
      bongDuoi(n.g, 1.1, .45); n.g.scale.setScalar(TL * 1.45); n.g.rotation.order = 'YXZ'; nhomMH.add(n.g); return n; }
    const taoCoCam = (ben) => () => { const g = new THREE.Group(), co = taoCo(ben, ben === 'ta' ? (K.chu_co_ta || '') : '', g, 4.2, 1.9); bongDuoi(g, .5, .5); g.scale.setScalar(TL * 1.5); return { g, co }; };

    /* ---------- THUYỀN CHIẾN: thân gỗ thon hai đầu, mái chèo hai bên, lính trên boong.
       lon = thuyền lớn (lâu thuyền phương Bắc: buồm cánh dơi, lầu ở đuôi); nhỏ = thuyền nhẹ của ta (chèo nhanh) ---------- */
    VL.go2 = L('#6b4a2c'); VL.goToi = L('#3e2a19'); VL.buom = { ta: L('#c9a46a', { side: THREE.DoubleSide }), dich: L('#b8794a', { side: THREE.DoubleSide }) }; VL.mai = L('#5b4030');
    const vo = (dai, rong, cao2) => gq(`vo${dai},${rong},${cao2}`, () => {   // mặt cắt dọc: mạn cong lên ở mũi & đuôi; thon bề ngang về hai đầu
      const s = new THREE.Shape(), d = dai / 2; s.moveTo(-d, cao2 * 1.25); s.quadraticCurveTo(-d * .7, -cao2 * .1, -d * .35, 0); s.lineTo(d * .4, 0); s.quadraticCurveTo(d * .8, 0, d * 1.02, cao2 * 1.45); s.lineTo(d * .6, cao2); s.lineTo(-d * .6, cao2); s.closePath();
      const g = new THREE.ExtrudeGeometry(s, { depth: rong, bevelEnabled: false, steps: 1, curveSegments: 8 }); g.translate(0, 0, -rong / 2);
      const p = g.attributes.position; for (let i = 0; i < p.count; i++) { const x = p.getX(i), k = 1 - Math.pow(Math.abs(x) / d, 2.2) * .85; p.setZ(i, p.getZ(i) * Math.max(.12, k)); } g.computeVertexNormals(); return g; });
    function taoThuyen(ben, lon, chu) {
      const g = new THREE.Group(), than = N(g, 0, -.35, 0), j = { g, than, chèo: [], lon }, dai = lon ? 10 : 6.5, rong = lon ? 2.6 : 1.5, cao2 = lon ? 1.2 : .7;
      M(vo(dai, rong, cao2), lon ? VL.goToi : VL.go2, than); M(box(dai * .78, .06, rong * .78), VL.go2, than, 0, cao2 - .02, 0);   // boong
      M(box(dai * .9, .08, .05), VL.ao[ben], than, 0, cao2 * .8, rong * .47); M(box(dai * .9, .08, .05), VL.ao[ben], than, 0, cao2 * .8, -rong * .47);   // dải màu mạn thuyền (nhận ra phe)
      const nC = lon ? 5 : 4; for (let s = -1; s <= 1; s += 2) for (let i = 0; i < nC; i++) { const ch = N(than, (i - (nC - 1) / 2) * dai * .15, cao2 * .9, s * rong * .45); M(cyl(.035, .035, 2.2, 5), VL.go, ch, 0, -.15, s * 1.05, Math.PI / 2, 0, 0); M(box(.05, .32, .14), VL.go, ch, 0, -.15, s * 2.1); j.chèo.push({ ch, s }); }
      if (lon) { const lau = N(than, -dai * .3, cao2, 0); M(box(2.2, 1.3, rong * .8), VL.giap[ben], lau, 0, .65, 0); M(box(2.6, .14, rong * .95), VL.mai, lau, 0, 1.36, 0);
        [-.05, .3].forEach((x, i) => { const cot = N(than, x * dai, cao2, 0); M(cyl(.07, .09, i ? 6 : 7.5, 6), VL.go, cot, 0, (i ? 6 : 7.5) / 2, 0);
          const b = new THREE.PlaneGeometry(i ? 2.6 : 3.2, i ? 3.6 : 4.4, 1, 5); const p = b.attributes.position; for (let k = 0; k < p.count; k++) { const y = p.getY(k); p.setX(k, p.getX(k) * (1 + y * .06)); } b.computeVertexNormals();
          const bm = M(b, VL.buom[ben], cot, 0, (i ? 6 : 7.5) - (i ? 2 : 2.4), 0, 0, Math.PI / 2 + .25, 0); for (let k = 0; k < 4; k++) M(box(.04, .05, (i ? 2.6 : 3.2) * 1.05), VL.goToi, cot, 0, (i ? 6 : 7.5) - .6 - k * (i ? .95 : 1.15), 0, 0, .25, 0); j['buom' + i] = bm; }); }
      const so = lon ? 3 : 2; j.linh = []; for (let i = 0; i < so; i++) { const n = taoNguoi(ben, 'linh', false); n.g.position.set((i - (so - 1) / 2) * dai * .22 + (lon ? dai * .12 : 0), cao2 - .02, (i % 2 ? .25 : -.25) * rong); n.g.rotation.y = i % 2 ? .4 : -.4; than.add(n.g); j.linh.push(n); }
      if (chu != null) { const co = taoCo(ben, chu, than, lon ? 5 : 4, lon ? 2 : 1.6); co.g.position.set(-dai * .46, cao2, 0); co.g.rotation.order = 'YXZ'; co.g.rotation.set(0, Math.PI, .08); j.coT = co; }
      M(dia(), VL.bong, g, 0, .08, 0, 0, 0, 0, [dai * .55, 1, rong * .7]);
      return j;
    }
    function tuTheThuyen(j, t, ph, chay) {   // nhấp nhô theo sóng, mái chèo khua theo nhịp
      j.than.rotation.x = Math.sin(t * 1.3 + ph * 7) * .04; j.than.rotation.z = Math.sin(t * 1.1 + ph * 5) * .025; j.than.position.y = -.35 + Math.sin(t * 1.7 + ph * 3) * .06;
      j.chèo.forEach(({ ch, s }, i) => { const a = (t * (chay ? 1.6 : .4) + ph) * PI2; ch.rotation.y = Math.sin(a) * .45 * s; ch.rotation.x = (Math.cos(a) * .18 - .05) * s; });
    }
    const TLT = () => TL * (K.ti_le_thuyen || .6);
    const taoTh = (ben, lon) => () => { const j = taoThuyen(ben, lon, null); j.g.scale.setScalar(TLT()); return j; };

    /* ---------- VOI CHIẾN: thân, đầu, vòi cong 3 đốt, tai, ngà, 4 chân cột bước đi; bành có lọng + người cưỡi ---------- */
    VL.voi = L('#7c7470'); VL.nga = L('#ece3cf'); VL.banh = { ta: L('#b5352a'), dich: L('#2f5591') };
    function taoVoi(ben, coNguoi) {
      const g = new THREE.Group(), than = N(g, 0, 2.05, 0), j = { g, than, chan: [], voi: [] };
      M(sph(1, 16, 12), VL.voi, than, 0, 0, 0, 0, 0, 0, [1.45, .95, .82]);
      const dau = N(than, 1.35, .35, 0); M(sph(.72, 14, 10), VL.voi, dau, 0, 0, 0); j.dau = dau;
      [-1, 1].forEach(s => { M(sph(1, 10, 8), VL.voi, dau, -.15, .05, s * .62, 0, 0, 0, [.42, .55, .06]); M(cone(.06, .7, 6), VL.nga, dau, .55, -.45, s * .25, 0, 0, -1.9); });
      let cha = N(dau, .55, -.2, 0); for (let i = 0; i < 3; i++) { M(cyl(.18 - i * .04, .14 - i * .04, .62, 8), VL.voi, cha, 0, -.31, 0); j.voi.push(cha); cha = N(cha, 0, -.6, 0); }
      const duoi = N(than, -1.42, .2, 0); M(cyl(.04, .02, 1.0, 5), VL.voi, duoi, 0, -.5, 0, 0, 0, -.2); j.duoi = duoi;
      [[.85, -.45, -.4], [.85, -.45, .4], [-.85, -.45, -.4], [-.85, -.45, .4]].forEach(([x, y, z]) => { const c = N(than, x, y, z); M(cyl(.26, .24, 1.65, 9), VL.voi, c, 0, -.8, 0); M(cyl(.27, .28, .1, 9), VL.mong, c, 0, -1.6, 0); j.chan.push(c); });
      const banh = N(than, -.1, .95, 0); j.banh = banh; M(box(1.05, .42, .95), VL.banh[ben], banh, 0, .08, 0); M(box(1.15, .05, 1.05), VL.vang, banh, 0, .31, 0);
      M(cyl(.02, .02, 1.3, 5), VL.go, banh, -.3, .95, 0); M(cone(.45, .22, 12), VL.vang, banh, -.3, 1.62, 0);   // lọng che
      M(box(1.6, .05, 1.7), VL.banh[ben], than, 0, .78, 0, 0, 0, 0);   // vải phủ lưng
      if (coNguoi) { const r = taoNguoi(ben, 'tuong', true); r.g.position.set(-.05, .1, 0); r.g.scale.setScalar(.9); banh.add(r.g); j.nguoi = r; }
      M(dia(), VL.bong, g, 0, .06, 0, 0, 0, 0, [1.9, 1, .9]);
      return j;
    }
    function tuTheVoi(j, ph, di) {   // voi đi kiểu hai chân cùng bên (amble), vòi đung đưa
      const PH = [0, .5, .5, 0]; j.chan.forEach((c, i) => { c.rotation.z = di ? Math.sin((ph + PH[i] + (i > 1 ? .25 : 0)) * PI2) * .28 : 0; });
      j.than.position.y = 2.05 + (di ? Math.abs(Math.sin(ph * PI2 * 2)) * .05 : 0); j.than.rotation.x = di ? Math.sin(ph * PI2) * .025 : 0;
      j.voi.forEach((v, i) => { v.rotation.z = (i ? -.25 : .1) + Math.sin(ph * PI2 + i * .8) * .12 * (i + 1); }); j.dau.rotation.z = di ? Math.sin(ph * PI2 * 2) * .03 : 0; j.duoi.rotation.x = Math.sin(ph * PI2) * .2;
    }
    const taoVo = ben => () => { const j = taoVoi(ben, false); j.g.scale.setScalar(TL); return j; };

    /* ---------- BÃI CỌC: cọc gỗ đầu bịt sắt nhọn, cắm nghiêng về phía thuyền giặc chạy tới; ngập khi triều lên, lộ khi triều rút ---------- */
    /* coc: [{ tu:[x,y], den:[x,y] (đường cắm cọc – thường cắt ngang lòng sông), be_rong (px, rải dọc hai bên đường), so, huong_nghieng:[dx,dy] (đầu cọc chĩa về phía này),
               t0 (bắt đầu có), t_lo (nước rút, cọc lộ dần), lo_trong (giây), ngap (0..1 phần cọc ngập khi triều lên) }] */
    const COC = (K.coc || []).map((c, ci) => { const r = rng(91 + ci), so = c.so || 60, ds = [], d = duong(c.duong || [c.tu, c.den]);
      const hn = c.huong_nghieng || [1, 0], xoay0 = Math.atan2(hn[0] * SW / W, hn[1] * SH / H);
      for (let i = 0; i < so; i++) { const u = (i + r() * .8) / so, [x, y] = d.tai(u), [hx, hy] = d.huong(u), Lh = Math.hypot(hx, hy) || 1, lech = (r() - .5) * (c.be_rong || 26);
        ds.push({ x: x - hy / Lh * lech, y: y + hx / Lh * lech, h: 2.4 + r() * 1.4, nghieng: .3 + r() * .2, xoay: xoay0 + (r() - .5) * .4 }); }
      const than2 = new THREE.InstancedMesh(gq('cocThan', () => { const g = new THREE.CylinderGeometry(.11, .14, 1, 6); g.translate(0, .5, 0); return g; }), VL.goToi, so);
      const mui = new THREE.InstancedMesh(gq('cocMui', () => { const g = new THREE.ConeGeometry(.13, .5, 6); g.translate(0, .25, 0); return g; }), VL.satToi, so);
      scene.add(than2, mui); return { ...c, ds, than2, mui }; });
    const _m = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(0, 0, 0, 'YXZ'), _s = new THREE.Vector3(), _p = new THREE.Vector3(), _up = new THREE.Vector3();
    function veCoc(t) {
      /* lo = phần cọc nhô khỏi nước: đóng cọc (t0 → t0+2 lên dần) → triều lên t_ngap (chìm dần) → triều rút t_lo (lộ dần) */
      const loCoc = c => { if (o.sau_tran) return 1; if (t < (c.t0 ?? -1e9)) return 0; if (c.t_lo != null && t >= c.t_lo) return muot(prog(t, c.t_lo, c.t_lo + (c.lo_trong || 3)));
        const len = c.t0 != null ? muot(prog(t, c.t0, c.t0 + 2)) : 1; return c.t_ngap != null ? len * (1 - muot(prog(t, c.t_ngap, c.t_ngap + 2))) : (c.t_lo != null ? 0 : len); };
      COC.forEach(c => { const lo = loCoc(c), S = TL * (c.ti_le || .42);
        c.ds.forEach((k, i) => { const nhoi = (k.h + .5) * S * (1 - (c.ngap ?? .85) * (1 - lo)) - (k.h + .5) * S;   // phần ngập dưới mặt nước
          const p = P3(k.x, k.y, 0); _e.set(k.nghieng, k.xoay, 0); _q.setFromEuler(_e); _up.set(0, 1, 0).applyQuaternion(_q);
          _p.copy(p).addScaledVector(_up, nhoi); _s.set(S * 1.6, k.h * S, S * 1.6); _m.compose(_p, _q, _s); c.than2.setMatrixAt(i, _m);
          _p.copy(p).addScaledVector(_up, nhoi + k.h * S); _s.set(S * 1.6, S * 1.3, S * 1.6); _m.compose(_p, _q, _s); c.mui.setMatrixAt(i, _m); });
        c.than2.instanceMatrix.needsUpdate = c.mui.instanceMatrix.needsUpdate = true; c.than2.visible = c.mui.visible = t >= (c.t0 ?? -1e9) || o.sau_tran; });
    }

    /* ---------- lửa + khói (sprite cộng sáng, ngọn lửa co giãn liên tục theo t) ---------- */
    /* ngọn lửa: lưỡi lửa hình giọt, lõi vàng sáng → viền cam đỏ → trong suốt (vẽ trong khung trong suốt, mép mềm) */
    const LUA_TX = [0, 1, 2, 3].map(f => canvasTx(THREE, 128, 192, g => { const r = rng(f + 7);
      for (let k = 0; k < 7; k++) { const x = 64 + (r() - .5) * 50, h = 90 + r() * 80, w = 22 + r() * 22, day = 186;
        const gr = g.createRadialGradient(x, day - h * .25, 2, x, day - h * .3, h * .75); gr.addColorStop(0, 'rgba(255,246,200,.95)'); gr.addColorStop(.35, 'rgba(255,170,50,.85)'); gr.addColorStop(.7, 'rgba(225,70,20,.55)'); gr.addColorStop(1, 'rgba(160,30,10,0)');
        g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, day); g.bezierCurveTo(x - w * .7, day - h * .45, x - w * .1, day - h * .7, x + (r() - .5) * 10, day - h); g.bezierCurveTo(x + w * .1, day - h * .7, x + w * .7, day - h * .45, x + w / 2, day); g.closePath(); g.fill(); } }).tx);
    const QUANG_TX = canvasTx(THREE, 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62); gr.addColorStop(0, 'rgba(255,150,50,.55)'); gr.addColorStop(1, 'rgba(255,90,20,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }).tx;
    const KHOI_TX = canvasTx(THREE, 128, 128, g => { const gr = g.createRadialGradient(64, 64, 0, 64, 64, 62); gr.addColorStop(0, 'rgba(70,62,56,.85)'); gr.addColorStop(.6, 'rgba(90,82,74,.4)'); gr.addColorStop(1, 'rgba(110,100,90,0)'); g.fillStyle = gr; g.fillRect(0, 0, 128, 128); }).tx;
    const spLua = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: LUA_TX[0], transparent: true, depthWrite: false, fog: false })); s.center.set(.5, 0); return { g: s }; };
    const spQuang = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: QUANG_TX, transparent: true, depthWrite: false, fog: false, blending: THREE.AdditiveBlending })); return { g: s }; };
    const spKhoi = () => { const s = new THREE.Sprite(new THREE.SpriteMaterial({ map: KHOI_TX, transparent: true, depthWrite: false })); return { g: s }; };

    /* ---------- dữ liệu kịch bản ---------- */
    const TUYEN = (D.tuyen || []).map(t => duong(t.xy));
    const layD = v => typeof v === 'number' ? TUYEN[v] : duong(v);
    const LUA = (K.lua || []).map((l, i) => ({ ...l, r: rng(31 + i) }));
    /* phục binh quay mặt về đường hành quân gần nhất */
    const diemGan = (x, y) => { let best = null, bd = 1e18; TUYEN.forEach(d => { for (let k = 0; k <= 200; k++) { const p = d.tai(k / 200), e = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (e < bd) { bd = e; best = p; } } }); return best || [x + 1, y]; };
    /* phục binh phải đứng trên cạn: điểm khai báo rơi xuống nước → tìm điểm đất gần nhất (vòng tròn nới dần tới 120 px) */
    const lenBo = ([x, y]) => { if (cao(x, y) > .02) return [x, y]; for (let r = 6; r <= 120; r += 6) for (let a = 0; a < 24; a++) { const X = x + Math.cos(a / 24 * PI2) * r, Y = y + Math.sin(a / 24 * PI2) * r; if (cao(X, Y) > .05) return [X, Y]; } return [x, y]; };
    const PB = (K.phuc_binh || []).map(p => { const xy = lenBo(p.xy), g = p.huong_toi || diemGan(xy[0], xy[1]); return { ...p, xy, goc: gocTG(g[0] - xy[0], g[1] - xy[1]) }; });

    /* nhãn chữ (HTML) đặt theo phép chiếu 3D: địa danh nằm dưới, nhãn diễn biến nổi lên trên + đường dẫn */
    const lop = document.createElement('div'); lop.style.cssText = 'position:absolute;inset:0;pointer-events:none'; khung.appendChild(lop);
    const DIA = (D.dia_danh || []).filter(d => !(K.an_dia_danh || []).includes(d.ten)).map(d => ({ xy: d.xy, chu: d.ten, t0: -1e9, t1: 1e9, dia: 1, loai: d.loai }));
    const NHAN = DIA.concat(K.nhan || []).map(n => { const e = document.createElement('div'); e.className = 'bd-nhan' + (n.dia ? ' bd-dia' : '') + (n.ben ? ' bd-' + n.ben : ''); e.textContent = n.chu; e.style.zIndex = n.dia ? 1 : 2; lop.appendChild(e); return { ...n, e }; });

    /* ---------- vẽ mũi tên lên nền (bám mặt đất) ---------- */
    function muiTen(pts, ben, dut, day = 16) {
      if (pts.length < 2) return; ng.save(); ng.lineCap = ng.lineJoin = 'round';
      ng.strokeStyle = 'rgba(0,0,0,.35)'; ng.lineWidth = day + 8; ng.setLineDash(dut ? [day * 2.2, day * 1.3] : []); ng.beginPath(); pts.forEach(([x, y], k) => k ? ng.lineTo(x + 3, y + 4) : ng.moveTo(x + 3, y + 4)); ng.stroke();
      ng.strokeStyle = MAU[ben]; ng.lineWidth = day; ng.beginPath(); pts.forEach(([x, y], k) => k ? ng.lineTo(x, y) : ng.moveTo(x, y)); ng.stroke(); ng.setLineDash([]);
      const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[Math.max(0, pts.length - 4)], a = Math.atan2(y1 - y0, x1 - x0), Lm = day * 3.2;
      ng.fillStyle = MAU[ben]; ng.beginPath(); ng.moveTo(x1 + Math.cos(a) * Lm * .7, y1 + Math.sin(a) * Lm * .7); ng.lineTo(x1 + Math.cos(a + 2.4) * Lm, y1 + Math.sin(a + 2.4) * Lm); ng.lineTo(x1 + Math.cos(a - 2.4) * Lm, y1 + Math.sin(a - 2.4) * Lm); ng.closePath(); ng.fill(); ng.restore();
    }
    function vetChay(l, k) {   // đất cháy: mảng xám đen loang, đậm dần rồi giữ nguyên
      const r = l.r, n = 26; ng.save(); ng.globalAlpha = .82 * k;
      for (let i = 0; i < n; i++) { const a = r() * 7, d = Math.sqrt(r()) * l.ban_kinh, x = l.xy[0] + Math.cos(a) * d, y = l.xy[1] + Math.sin(a) * d * .7, s = (8 + r() * 22) * (l.ban_kinh / 60);
        const gr = ng.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(25,18,12,.95)'); gr.addColorStop(.7, 'rgba(45,32,20,.6)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); ng.fillStyle = gr; ng.beginPath(); ng.arc(x, y, s, 0, 7); ng.fill(); }
      ng.restore(); l.r = rng(31 + LUA.indexOf(l));   // đặt lại hạt giống: lần vẽ sau giống hệt
    }

    /* ---------- máy quay: spline Hermite qua các khóa [t, x, y, xa, nghiêng°, xoay°] ----------
       vận tốc liên tục qua từng khóa (không khựng lại ở mỗi khóa), chỉ tăng tốc ở khóa đầu, giảm tốc ở khóa cuối */
    const NG_MIN = K.nghieng_toi_thieu ?? 46;
    function mayQuay(t) {
      const ks = K.may_quay, n = ks.length; let i = 0; while (i < n - 2 && ks[i + 1][0] <= t) i++;
      let v;
      if (n === 1 || t <= ks[0][0]) v = ks[0].slice(1); else if (t >= ks[n - 1][0]) v = ks[n - 1].slice(1);
      else {
        const a = ks[i], b = ks[i + 1], dt = b[0] - a[0], u = clamp((t - a[0]) / dt);
        const tiep = (k, j) => (k <= 0 || k >= n - 1) ? 0 : (ks[k + 1][j] - ks[k - 1][j]) / (ks[k + 1][0] - ks[k - 1][0]);
        const h00 = 2 * u * u * u - 3 * u * u + 1, h10 = u * u * u - 2 * u * u + u, h01 = -2 * u * u * u + 3 * u * u, h11 = u * u * u - u * u;
        v = [1, 2, 3, 4, 5].map(j => h00 * a[j] + h10 * dt * tiep(i, j) + h01 * b[j] + h11 * dt * tiep(i + 1, j));
      }
      const [x, y, xa] = v, ng0 = Math.max(NG_MIN, v[3]) * Math.PI / 180, xo = v[4] * Math.PI / 180, tam = P3(x, y);
      cam.position.set(tam.x + Math.sin(xo) * Math.cos(ng0) * xa, tam.y + Math.sin(ng0) * xa, tam.z + Math.cos(xo) * Math.cos(ng0) * xa); cam.lookAt(tam);
      scene.fog.near = xa * 1.6; scene.fog.far = xa * 4.2;
    }

    const doRong = new Map();
    function ve(t) {
      /* nền + mũi tên + vết cháy */
      ng.drawImage(o.nen, 0, 0, W, H);
      LUA.forEach(l => { const k = o.sau_tran ? 1 : prog(t, l.t0 + 1, l.t0 + 4); if (k > 0) vetChay(l, k); });
      (K.mui_ten || []).forEach(m => { const u = o.sau_tran ? m.den ?? 1 : (m.tu ?? 0) + ((m.den ?? 1) - (m.tu ?? 0)) * ease(prog(t, m.t0, m.t1)); if (!o.sau_tran && t < m.t0) return; if (m.an_sau != null && t > m.an_sau) return; const d = layD(m.duong); muiTen(d.doan(m.bat_dau ?? 0, u), m.ben, m.net === 'dut', (m.day || 16) * 0.6); });
      ntx.needsUpdate = true;

      /* mô hình: đạo quân, phục binh, cờ cắm, lửa, khói */
      for (const k in dangDung) dangDung[k] = 0;
      (K.doan_quan || []).forEach((q, qi) => {
        if (o.sau_tran || t < q.t0 || (q.an_sau != null && t > q.an_sau)) { if (TUONG[qi]) TUONG[qi].g.visible = false; return; }
        const d = layD(q.duong), u = (q.tu ?? 0) + ((q.den ?? 1) - (q.tu ?? 0)) * ease(prog(t, q.t0 + (q.cho || 0), q.t1)), dangDi = t > q.t0 + (q.cho || 0) && t < q.t1;
        const nga = q.nga_tai != null ? ease(prog(t, q.nga_tai, q.nga_tai + .9)) : 0, gap = q.gian_cach || .012;
        const dat = (m, uu, ngang, nang = 0) => { const [x, y] = d.tai(uu), [hx, hy] = d.huong(uu), Lh = Math.hypot(hx, hy) || 1, px = -hy / Lh * ngang, py = hx / Lh * ngang;
          m.g.position.copy(P3(x + px, y + py, nang)); m.g.rotation.set(0, gocTG(hx, hy), 0); return m; };
        /* ----- thủy quân: đoàn thuyền 2 hàng, thuyền tướng đi đầu; dam_tai = thuyền nghiêng, chìm (ti_le_dam: phần thuyền bị đắm), chay = bốc cháy khi đắm ----- */
        if (q.phuong_tien === 'thuyen') {
          const gT = q.gian_cach || .022, S = TLT(), lon = !!q.lon;
          const chim = (m, k, he) => { if (q.dam_tai == null || ((k * 7) % 10) / 10 >= (q.ti_le_dam ?? 1)) return 0; const t0 = q.dam_tai + (k % 7) * .4, dk = ease(prog(t, t0, t0 + 2.6));
            if (dk > 0) { m.g.rotation.x = dk * .5 * (k % 2 ? 1 : -1); m.g.rotation.z = dk * .3; m.g.position.y -= dk * 2.6 * S * he; }
            if (q.chay && t > t0 - .6 && t < t0 + 4) { const kc = Math.min(prog(t, t0 - .6, t0), 1 - prog(t, t0 + 2.5, t0 + 4)); for (let f = 0; f < 3; f++) { const s = lay('lua', spLua); s.g.position.copy(m.g.position); s.g.position.x += (f - 1) * 2.2 * S; s.g.position.y += .8 * S;
              s.g.material.map = LUA_TX[(k + f) % 4]; const kk = (7.5 + f % 2 * 3) * S / 2.6 * kc * (1 + .15 * Math.sin(t * 12 + k + f)); s.g.scale.set(kk * .66, kk, 1); } }
            if (dk >= 1 && t > q.dam_tai + (k % 7) * .4 + 4.5) m.g.visible = false; return dk; };
          /* thuyền chỉ ở trên nước: thử độ lệch ngang mong muốn, nếu chỗ đó là đất (độ cao > mặt nước) thì thu dần về giữa dòng */
          const ngangNuoc = (uu, off) => { const [x, y] = d.tai(uu), [hx, hy] = d.huong(uu), Lh = Math.hypot(hx, hy) || 1;
            for (const k of [1, .7, .45, .2, 0]) { const o = off * k, X = x - hy / Lh * o, Y = y + hx / Lh * o; if (cao(X, Y) <= .02 && cao(X - hx / Lh * 8, Y - hy / Lh * 8) <= .02 && cao(X + hx / Lh * 8, Y + hy / Lh * 8) <= .02) return o; } return 0; };
          for (let k = 0; k < (q.thuyen || 0); k++) { const uu = u - (Math.floor(k / 2) + 1) * gT; if (uu < (q.tu ?? 0) - .001) continue;
            const m = dat(lay('th-' + q.ben + (lon ? 'L' : ''), taoTh(q.ben, lon)), uu, ngangNuoc(uu, (k % 2 ? 1 : -1) * (q.ngang ?? 9) + ((k * 29) % 5 - 2) * 1.5), 0);
            tuTheThuyen(m, t, k * .37, dangDi); chim(m, k, lon ? 1 : .8); }
          if (q.tuong) { const m = TUONG[qi] || (TUONG[qi] = (() => { const j = taoThuyen(q.ben, lon, q.co || ''); j.g.scale.setScalar(S * 1.25); j.g.rotation.order = 'YXZ'; nhomMH.add(j.g); return j; })());
            m.g.visible = true; dat(m, u, 0, 0); tuTheThuyen(m, t, qi, dangDi); bayCo(m.coT, t, qi, 1); if (nga) { m.g.rotation.x = nga * .55; m.g.position.y -= nga * 2.6 * S * 1.25; } }
          return;
        }
        // voi chiến: hàng 2 ngay sau tướng
        const nV = q.voi || 0;
        for (let k = 0; k < nV; k++) { const uu = u - (Math.floor(k / 2) + 1) * gap * 1.9; if (uu < (q.tu ?? 0)) continue;
          const m = dat(lay('voi-' + q.ben, taoVo(q.ben)), uu, (k % 2 ? 1 : -1) * 10, 0); tuTheVoi(m, t * .95 + k * .21, dangDi); }
        // bộ binh: hàng 3, đi sau tướng (sau kỵ binh, voi)
        const nK = q.ngua || 0, lui = Math.ceil(nK / 2) * 1.3 + Math.ceil(nV / 2) * 1.9;
        for (let k = 0; k < (q.linh || 0); k++) { const hang = Math.floor(k / 3), cot = k % 3 - 1, uu = u - (hang + 1 + lui) * gap; if (uu < (q.tu ?? 0) - .001) continue;
          const m = dat(lay('linh-' + q.ben, taoLinh(q.ben)), uu, cot * 9 + ((k * 37) % 5 - 2), 0); tuThe(m, t * 1.7 + k * .17, dangDi);
          if (nga) { const kk = ease(prog(t, q.nga_tai + .2 + (k % 5) * .15, q.nga_tai + .9 + (k % 5) * .15)); m.g.rotation.x = kk * 1.45 * (k % 2 ? 1 : -1); } }
        // kỵ binh: hàng 2 ngay sau tướng
        for (let k = 0; k < nK; k++) { const uu = u - (Math.floor(k / 2) + 1) * gap * 1.3; if (uu < (q.tu ?? 0)) continue;
          const m = dat(lay('ky-' + q.ben, taoKy(q.ben)), uu, (k % 2 ? 1 : -1) * 8, 0); tuTheNgua(m, t * 2.3 + k * .23, dangDi);
          if (nga) m.g.rotation.x = ease(prog(t, q.nga_tai + .3 + k * .2, q.nga_tai + 1.1 + k * .2)) * 1.4; }
        // tướng cưỡi ngựa cầm cờ
        if (q.tuong && q.cuoi === 'voi') { const m = TUONG[qi] || (TUONG[qi] = (() => { const j = taoVoi(q.ben, true), co = taoCo(q.ben, q.co || '', j.banh, 3.4, 1.6); co.g.position.set(-.6, .4, .55); co.g.rotation.order = 'YXZ'; co.g.rotation.set(0, Math.PI, .08); j.coT = co;
            j.g.scale.setScalar(TL * 1.25); j.g.rotation.order = 'YXZ'; nhomMH.add(j.g); return j; })());
          m.g.visible = true; dat(m, u, 0, 0); tuTheVoi(m, t * .95, dangDi); bayCo(m.coT, t, qi, dangDi ? 1.1 : .8); }
        else if (q.tuong) { const m = TUONG[qi] || (TUONG[qi] = taoTuong(qi, q)); m.g.visible = true; dat(m, u, 0, 0); tuTheNgua(m, t * 2.1, dangDi && !nga); bayCo(m.coT, t, qi, dangDi ? 1.2 : .8);
          m.g.rotation.x = nga * 1.45; }
      });
      PB.forEach((p, pi) => { if (o.sau_tran || t < p.t0) return; const k = ease(prog(t, p.t0, p.t0 + .8)), so = p.so || 5;
        for (let i = 0; i < so; i++) { const a = i / so * PI2 + pi, m = lay('linh-' + p.ben, taoLinh(p.ben)); m.g.position.copy(P3(p.xy[0] + Math.cos(a) * 14, p.xy[1] + Math.sin(a) * 10, -7 * (1 - k)));
          m.g.rotation.set(0, p.goc + (i % 3 - 1) * .2, 0); const chay = t > p.t0 + .8 && t < p.t0 + 4; tuThe(m, t * 2 + i * .3, chay); }
        const c = lay('co-' + p.ben, taoCoCam(p.ben)); c.g.position.copy(P3(p.xy[0], p.xy[1], -12 * (1 - k))); c.g.rotation.set(0, p.goc + Math.PI / 2, 0); bayCo(c.co, t, pi * 1.7, .9); });
      (K.co_cam || []).forEach((cc, ci) => { if (!o.sau_tran && t < cc.t0) return; const k = o.sau_tran ? 1 : ease(prog(t, cc.t0, cc.t0 + .9)); const c = lay('co-' + cc.ben, taoCoCam(cc.ben));
        c.g.position.copy(P3(cc.xy[0], cc.xy[1], -14 * (1 - k))); c.g.rotation.set(0, .6, 0); bayCo(c.co, t, ci * 2.3 + 5, 1); });
      LUA.forEach((l, i) => { if (o.sau_tran || t < l.t0 || t > l.t1 + 3) return; const k = Math.min(prog(t, l.t0, l.t0 + .8), 1 - prog(t, l.t1 - 1.2, l.t1));
        if (k > 0) for (let j = 0; j < (l.ngon || 6); j++) { const a = j * 2.4 + i, dd = (j % 3 + .4) * l.ban_kinh * .35, s = lay('lua', spLua);
          s.g.position.copy(P3(l.xy[0] + Math.cos(a) * dd, l.xy[1] + Math.sin(a) * dd * .7, 0)); s.g.material.map = LUA_TX[j % 4];
          const kich = (6 + (j % 4) * 2.2) * (l.ban_kinh / 60) * k * (1 + .14 * Math.sin(t * 11 + j * 1.7) + .08 * Math.sin(t * 23 + j)); s.g.scale.set(kich * .66, kich, 1); }
        if (k > 0) { const q = lay('quang', spQuang); q.g.position.copy(P3(l.xy[0], l.xy[1], 3)); const kq = l.ban_kinh * .9 * k * (1 + .08 * Math.sin(t * 9 + i)); q.g.scale.set(kq, kq * .6, 1); }
        const kk = Math.min(prog(t, l.t0 + .3, l.t0 + 1.5), 1 - prog(t, l.t1, l.t1 + 3));   // khói bốc lên, tan dần
        if (kk > 0) for (let j = 0; j < 7; j++) { const ph = ((t * .22 + j / 7) % 1), s = lay('khoi', spKhoi), a = j * 1.9 + i;
          s.g.position.copy(P3(l.xy[0] + Math.cos(a) * l.ban_kinh * .25 + ph * 18, l.xy[1] + Math.sin(a) * l.ban_kinh * .2, 8 + ph * 46)); const kich = (14 + ph * 40) * (l.ban_kinh / 60);
          s.g.scale.set(kich, kich, 1); s.g.material.opacity = kk * .55 * Math.sin(ph * Math.PI); } });
      for (const k in KHO) KHO[k].forEach((m, i) => { if (i >= (dangDung[k] || 0)) m.g.visible = false; });
      veCoc(t);

      mayQuay(t);
      renderer.render(scene, cam);

      /* nhãn: mờ dần ở mép khung + vùng phụ đề; nhãn diễn biến nổi cao hơn; địa danh bị nhãn diễn biến đè thì mờ đi (liên tục, không bật/tắt) */
      const w = R, h = C, hien = [];
      NHAN.forEach(n => { if (!doRong.has(n) && n.e.offsetWidth) doRong.set(n, [n.e.offsetWidth, n.e.offsetHeight]); const [bw, bh] = doRong.get(n) || [120, 34];
        const p = P3(n.xy[0], n.xy[1], n.dia ? 4 : 4).project(cam), sx = (p.x + 1) / 2 * w, sy0 = (1 - p.y) / 2 * h, sy = sy0 - (n.dia ? 6 : 46);
        let a = n.dia ? 1 : Math.min(muot(prog(t, n.t0, n.t0 + .6)), 1 - muot(prog(t, n.t1 - .6, n.t1)));
        if (t < n.t0 || t > n.t1 || p.z >= 1 || (o.sau_tran && !n.dia)) a = 0;   // cảnh sau trận: chỉ địa danh
        a *= muot(clamp((sy - bh - 120) / 70)) * muot(clamp((h - 150 - sy) / 80)) * muot(clamp((sx - bw / 2 - 20) / 70)) * muot(clamp((w - 20 - sx - bw / 2) / 70));
        hien.push({ n, sx, sy, sy0, bw, bh, a }); });
      hien.filter(x => !x.n.dia && x.a > .01).forEach(s => hien.forEach(d => { if (!d.n.dia || d.a <= 0) return;
        const ox = Math.max(0, Math.min(s.sx + s.bw / 2, d.sx + d.bw / 2) - Math.max(s.sx - s.bw / 2, d.sx - d.bw / 2)), oy = Math.max(0, Math.min(s.sy, d.sy) - Math.max(s.sy - s.bh, d.sy - d.bh));
        d.a *= 1 - s.a * clamp(ox * oy / (d.bw * d.bh) * 3); }));
      for (let i = 0; i < hien.length; i++) for (let k = i + 1; k < hien.length; k++) { const A = hien[i], B = hien[k]; if (!A.n.dia || !B.n.dia) continue;   // địa danh chồng nhau: tên sau mờ đi
        const ox = Math.max(0, Math.min(A.sx + A.bw / 2, B.sx + B.bw / 2) - Math.max(A.sx - A.bw / 2, B.sx - B.bw / 2)), oy = Math.max(0, Math.min(A.sy, B.sy) - Math.max(A.sy - A.bh, B.sy - B.bh));
        B.a *= 1 - clamp(ox * oy / (B.bw * B.bh) * 3) * A.a; }
      hien.forEach(({ n, sx, sy, sy0, a }) => { n.e.style.opacity = a.toFixed(3); n.e.style.transform = `translate(${sx.toFixed(1)}px,${sy.toFixed(1)}px) translate(-50%,-100%)`;
        if (!n.dia) n.e.style.setProperty('--chan', Math.max(0, sy0 - sy).toFixed(1) + 'px'); });
    }
    /* kiểm chứng (tools/kiem-thuy.mjs): vẽ khung t rồi liệt kê mọi thuyền đang hiện + chỗ đó có phải mặt nước không */
    function kiemThuyen(t) {
      /* "trên nước" = tâm thuyền gần mặt nước hơn gần mặt đất: độ cao nội suy < ½ độ cao đất thấp nhất (bản đồ cổ: đất ≥ 2 m, nước = 0 m) */
      const nguong = .5 * 2 / metMoiDV * PHONG;
      ve(t); const ds = [], xet = (m, ten) => { if (!m || !m.g.visible) return; const p = m.g.position, x = (p.x / SW + .5) * W, y = (p.z / SH + .5) * H; ds.push({ ten, x: Math.round(x), y: Math.round(y), nuoc: cao(x, y) < nguong }); };
      for (const k in KHO) if (k.startsWith('th-')) KHO[k].forEach(m => xet(m, k));
      (K.doan_quan || []).forEach((q, qi) => { if (q.phuong_tien === 'thuyen') xet(TUONG[qi], 'tuong-' + qi); });
      return ds;
    }
    return { ve, kiemThuyen };
  };
})();
