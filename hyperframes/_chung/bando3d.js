/* =========================================================================
   BẢN ĐỒ CHIẾN DỊCH 3D – Xưởng film Lịch sử Việt Nam (dùng trong dự án HyperFrames)
   Địa hình thật nổi khối (do-cao.png) phủ nền 2K (nen-2k.jpg); trên đó: mũi tên tiến quân
   bám mặt đất, tướng cưỡi ngựa cầm cờ, đoàn lính, ngựa chiến, lửa cháy và VẾT ĐẤT CHÁY ở lại.
   Mọi thứ là hàm của thời gian t (giây, theo đồng hồ của cảnh) → tua tới đâu dựng đúng tới đó.
   Dùng: const bd = BanDo3D(khungDiv, { nen, doCao, du_lieu, kich_ban, sau_tran }); bd.ve(t)
   ========================================================================= */
(function () {
  'use strict';
  const MAU = { ta: '#c8352b', dich: '#1f5fa8' }, MAU_NHAT = { ta: '#f0b0a8', dich: '#b6cdea' };
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v)), ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const prog = (t, a, b) => clamp((t - a) / Math.max(1e-6, b - a));
  function rng(seed) { return () => { seed |= 0; seed = seed + 0x6D2B79F5 | 0; let x = Math.imul(seed ^ seed >>> 15, 1 | seed); x = x + Math.imul(x ^ x >>> 7, 61 | x) ^ x; return ((x ^ x >>> 14) >>> 0) / 4294967296; }; }

  /* điểm trên đường gấp khúc theo tỉ lệ độ dài 0..1 */
  function duong(pts) {
    const L = [0]; for (let i = 1; i < pts.length; i++) L.push(L[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
    const tong = L[L.length - 1] || 1;
    return { tong, tai(u) { const d = clamp(u) * tong; let i = 1; while (i < L.length - 1 && L[i] < d) i++; const k = (d - L[i - 1]) / Math.max(1e-6, L[i] - L[i - 1]); return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * k, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * k]; },
      doan(u0, u1, n = 60) { const o = []; for (let k = 0; k <= n; k++) o.push(this.tai(u0 + (u1 - u0) * k / n)); return o; } };
  }

  /* ---------- hình vẽ sẵn (sprite): tướng, lính, ngựa, cờ, lửa ---------- */
  function veNgua(g, x, y, s, mau, pha) {   // ngựa phi: pha 0..1 đổi dáng chân
    g.save(); g.translate(x, y); g.scale(s, s); g.fillStyle = mau; g.strokeStyle = mau; g.lineCap = 'round'; g.lineWidth = 3.2;
    g.beginPath(); g.ellipse(0, 0, 22, 10, 0, 0, 7); g.fill();                                   // thân
    g.beginPath(); g.moveTo(16, -4); g.quadraticCurveTo(26, -16, 30, -24); g.lineTo(38, -22); g.lineTo(36, -16); g.quadraticCurveTo(28, -10, 22, 2); g.fill();   // cổ, đầu
    g.beginPath(); g.moveTo(-20, -4); g.quadraticCurveTo(-34, -2, -36, 10); g.stroke();          // đuôi
    const a = Math.sin(pha * Math.PI * 2) * .55;
    [[14, 1], [8, -1], [-12, 1], [-18, -1]].forEach(([lx, sgn]) => { g.beginPath(); g.moveTo(lx, 6); g.lineTo(lx + Math.sin(a * sgn) * 12, 26); g.stroke(); });
    g.restore();
  }
  function veNguoi(g, x, y, s, mau, giao) {   // lính người que cầm giáo
    g.save(); g.translate(x, y); g.scale(s, s); g.strokeStyle = mau; g.fillStyle = mau; g.lineWidth = 3; g.lineCap = 'round';
    g.beginPath(); g.arc(0, -30, 6, 0, 7); g.fill(); g.beginPath(); g.moveTo(-9, -36); g.lineTo(0, -44); g.lineTo(9, -36); g.closePath(); g.fill();   // đầu + nón
    g.beginPath(); g.moveTo(0, -24); g.lineTo(0, -6); g.moveTo(0, -6); g.lineTo(-6, 8); g.moveTo(0, -6); g.lineTo(6, 8); g.moveTo(0, -18); g.lineTo(8, -12); g.stroke();
    if (giao) { g.strokeStyle = '#3a2a1a'; g.lineWidth = 2; g.beginPath(); g.moveTo(8, 6); g.lineTo(8, -46); g.stroke(); g.fillStyle = '#c9c9c9'; g.beginPath(); g.moveTo(8, -54); g.lineTo(5, -45); g.lineTo(11, -45); g.fill(); }
    g.restore();
  }
  function veCo(g, x, y, cao, mau, chu) {   // cờ hiệu có chữ
    g.save(); g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(x, y); g.lineTo(x, y - cao); g.stroke();
    g.fillStyle = mau; g.beginPath(); g.moveTo(x, y - cao); g.lineTo(x + 76, y - cao + 6); g.lineTo(x + 70, y - cao + 26); g.lineTo(x + 76, y - cao + 46); g.lineTo(x, y - cao + 40); g.closePath(); g.fill();
    if (chu) { g.fillStyle = '#fff'; g.font = '800 22px "Be Vietnam Pro"'; g.textAlign = 'center'; g.fillText(chu, x + 36, y - cao + 30); }
    g.restore();
  }
  function sprite(THREE, w, h, ve) { const c = document.createElement('canvas'); c.width = w; c.height = h; ve(c.getContext('2d')); const tx = new THREE.CanvasTexture(c); tx.colorSpace = THREE.SRGBColorSpace; const m = new THREE.SpriteMaterial({ map: tx, transparent: true, depthWrite: false }); return { c, tx, m }; }

  window.BanDo3D = function (khung, o) {
    const THREE = window.THREE, D = o.du_lieu, K = o.kich_ban, W = D.khung.rong, H = D.khung.cao;
    const R = khung.clientWidth || 1920, C = khung.clientHeight || 1080;
    const renderer = new THREE.WebGLRenderer({ antialias: true, preserveDrawingBuffer: true });
    renderer.setPixelRatio(1); renderer.setSize(R, C); renderer.outputColorSpace = THREE.SRGBColorSpace; khung.appendChild(renderer.domElement);
    const scene = new THREE.Scene(); scene.background = new THREE.Color('#0d0b09'); scene.fog = new THREE.Fog('#1a1611', 700, 1700); scene.background = new THREE.Color('#1a1611');
    const cam = new THREE.PerspectiveCamera(38, R / C, 1, 5000);
    /* tọa độ: điểm ảnh bản đồ (0..W, 0..H) → thế giới (rộng 1000 đơn vị) */
    const SW = 1000, SH = SW * H / W, ux = x => (x / W - .5) * SW, uz = y => (y / H - .5) * SH;
    /* độ cao thật (phóng đại) */
    const hc = document.createElement('canvas'); hc.width = o.doCao.naturalWidth; hc.height = o.doCao.naturalHeight;
    const hg = hc.getContext('2d'); hg.drawImage(o.doCao, 0, 0); const hdat = hg.getImageData(0, 0, hc.width, hc.height).data;
    const dc = D.khung.do_cao, metMoiDV = dc.met_moi_diem * W / SW, PHONG = K.phong_dai_do_cao || 2.6;
    const cao = (x, y) => { const X = clamp(Math.round(x / W * (hc.width - 1)), 0, hc.width - 1), Y = clamp(Math.round(y / H * (hc.height - 1)), 0, hc.height - 1); const v = hdat[(Y * hc.width + X) * 4] / 255; return (dc.thap + v * (dc.cao - dc.thap)) / metMoiDV * PHONG; };
    /* lưới địa hình */
    const geo = new THREE.PlaneGeometry(SW, SH, 512, Math.round(512 * H / W)); geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const x = (pos.getX(i) / SW + .5) * W, y = (pos.getZ(i) / SH + .5) * H; pos.setY(i, Math.max(0, cao(x, y))); }
    geo.computeVertexNormals();
    /* đồng bằng quanh khung bản đồ: không lộ khoảng đen khi máy quay ra sát mép */
    { const ngoai = new THREE.Mesh(new THREE.PlaneGeometry(SW * 8, SW * 8), new THREE.MeshBasicMaterial({ color: '#4a4232' })); ngoai.rotation.x = -Math.PI / 2; ngoai.position.y = -0.5; scene.add(ngoai); }
    /* nền phủ là canvas động: ảnh nền 2K + mũi tên + vết cháy vẽ lại theo t */
    const nc = document.createElement('canvas'); nc.width = W; nc.height = H; const ng = nc.getContext('2d');
    const ntx = new THREE.CanvasTexture(nc); ntx.colorSpace = THREE.SRGBColorSpace; ntx.anisotropy = 8;
    scene.add(new THREE.Mesh(geo, new THREE.MeshLambertMaterial({ map: ntx })));
    scene.add(new THREE.HemisphereLight('#fff6e8', '#3a3020', 1.15)); const sun = new THREE.DirectionalLight('#fff1d6', 1.6); sun.position.set(-500, 700, -300); scene.add(sun);
    const P3 = (x, y, nang = 0) => new THREE.Vector3(ux(x), Math.max(0, cao(x, y)) + nang, uz(y));

    /* ---------- sprite dùng chung ---------- */
    const SP = {}, mk = (k, w, h, ve) => SP[k] = sprite(THREE, w, h, ve);
    ['ta', 'dich'].forEach(b => {
      for (let f = 0; f < 4; f++) mk(`ngua-${b}-${f}`, 96, 64, g => veNgua(g, 48, 34, 1, b === 'ta' ? '#5b2a1c' : '#2a2a34', f / 4));
      mk(`linh-${b}`, 48, 64, g => veNguoi(g, 22, 52, .95, MAU[b], true));
    });
    for (let f = 0; f < 6; f++) mk('lua-' + f, 96, 128, g => { const r = rng(f + 7); for (let k = 0; k < 9; k++) { const x = 48 + (r() - .5) * 46, h = 50 + r() * 60, w = 16 + r() * 18; const gr = g.createLinearGradient(x, 120, x, 120 - h); gr.addColorStop(0, 'rgba(255,90,20,.95)'); gr.addColorStop(.6, 'rgba(255,190,60,.8)'); gr.addColorStop(1, 'rgba(255,240,180,0)'); g.fillStyle = gr; g.beginPath(); g.moveTo(x - w / 2, 120); g.quadraticCurveTo(x - w / 3, 120 - h * .6, x, 120 - h); g.quadraticCurveTo(x + w / 3, 120 - h * .6, x + w / 2, 120); g.fill(); } });
    const nhomSprite = new THREE.Group(); scene.add(nhomSprite); const pool = [];
    let dung = 0; const dat = (k, p, kich) => { let s = pool[dung]; if (!s) { s = new THREE.Sprite(); pool.push(s); nhomSprite.add(s); } s.material = SP[k].m; s.position.copy(p); s.scale.set(kich * SP[k].c.width / SP[k].c.height, kich, 1); s.visible = true; s.center.set(.5, 0); dung++; return s; };
    /* tướng + cờ: sprite riêng cho từng đạo quân (chữ trên cờ khác nhau) */
    const TUONG = (K.doan_quan || []).map((q, i) => q.tuong ? sprite(THREE, 220, 220, g => { veNgua(g, 90, 160, 1.6, q.ben === 'ta' ? '#5b2a1c' : '#2a2a34', .2); veNguoi(g, 92, 132, 1.3, MAU[q.ben], false); veCo(g, 112, 118, 100, MAU[q.ben], q.co || ''); }) : null);
    const TUONG_NGA = (K.doan_quan || []).map(q => q.tuong ? sprite(THREE, 220, 220, g => { g.translate(110, 200); g.rotate(1.25); g.translate(-110, -200); veNguoi(g, 110, 180, 1.3, MAU[q.ben], false); g.setTransform(1, 0, 0, 1, 0, 0); g.strokeStyle = '#3a2a1a'; g.lineWidth = 4; g.beginPath(); g.moveTo(60, 200); g.lineTo(170, 170); g.stroke(); g.fillStyle = MAU[q.ben]; g.beginPath(); g.moveTo(170, 170); g.lineTo(200, 196); g.lineTo(176, 206); g.fill(); }) : null);
    const CO_DAT = { ta: sprite(THREE, 120, 160, g => veCo(g, 30, 150, 130, MAU.ta, K.chu_co_ta || '')), dich: sprite(THREE, 120, 160, g => veCo(g, 30, 150, 130, MAU.dich, '')) };

    /* ---------- dữ liệu kịch bản ---------- */
    const TUYEN = (D.tuyen || []).map(t => duong(t.xy));
    const lay = v => typeof v === 'number' ? TUYEN[v] : duong(v);
    const LUA = (K.lua || []).map((l, i) => ({ ...l, r: rng(31 + i) }));
    /* nhãn chữ (HTML) đặt theo phép chiếu 3D */
    const lop = document.createElement('div'); lop.style.cssText = 'position:absolute;inset:0;pointer-events:none'; khung.appendChild(lop);
    const NHAN = (K.nhan || []).concat((D.dia_danh || []).filter(d => !(K.an_dia_danh || []).includes(d.ten)).map(d => ({ xy: d.xy, chu: d.ten, t0: -1e9, t1: 1e9, dia: 1, loai: d.loai })))
      .map(n => { const e = document.createElement('div'); e.className = 'bd-nhan' + (n.dia ? ' bd-dia' : '') + (n.ben ? ' bd-' + n.ben : ''); e.textContent = n.chu; lop.appendChild(e); return { ...n, e }; });

    /* ---------- vẽ mũi tên lên nền (bám mặt đất) ---------- */
    function muiTen(pts, ben, dut, day = 16) {
      if (pts.length < 2) return; ng.save(); ng.lineCap = ng.lineJoin = 'round';
      ng.strokeStyle = 'rgba(0,0,0,.35)'; ng.lineWidth = day + 8; ng.setLineDash(dut ? [day * 2.2, day * 1.3] : []); ng.beginPath(); pts.forEach(([x, y], k) => k ? ng.lineTo(x + 3, y + 4) : ng.moveTo(x + 3, y + 4)); ng.stroke();
      ng.strokeStyle = MAU[ben]; ng.lineWidth = day; ng.beginPath(); pts.forEach(([x, y], k) => k ? ng.lineTo(x, y) : ng.moveTo(x, y)); ng.stroke(); ng.setLineDash([]);
      const [x1, y1] = pts[pts.length - 1], [x0, y0] = pts[Math.max(0, pts.length - 4)], a = Math.atan2(y1 - y0, x1 - x0), L = day * 3.2;
      ng.fillStyle = MAU[ben]; ng.beginPath(); ng.moveTo(x1 + Math.cos(a) * L * .7, y1 + Math.sin(a) * L * .7); ng.lineTo(x1 + Math.cos(a + 2.4) * L, y1 + Math.sin(a + 2.4) * L); ng.lineTo(x1 + Math.cos(a - 2.4) * L, y1 + Math.sin(a - 2.4) * L); ng.closePath(); ng.fill(); ng.restore();
    }
    function vetChay(l, k) {   // đất cháy: mảng xám đen loang, đậm dần rồi giữ nguyên
      const r = l.r, n = 26; ng.save(); ng.globalAlpha = .82 * k;
      for (let i = 0; i < n; i++) { const a = r() * 7, d = Math.sqrt(r()) * l.ban_kinh, x = l.xy[0] + Math.cos(a) * d, y = l.xy[1] + Math.sin(a) * d * .7, s = (8 + r() * 22) * (l.ban_kinh / 60);
        const gr = ng.createRadialGradient(x, y, 0, x, y, s); gr.addColorStop(0, 'rgba(25,18,12,.95)'); gr.addColorStop(.7, 'rgba(45,32,20,.6)'); gr.addColorStop(1, 'rgba(60,40,20,0)'); ng.fillStyle = gr; ng.beginPath(); ng.arc(x, y, s, 0, 7); ng.fill(); }
      ng.restore(); l.r = rng(31 + LUA.indexOf(l));   // đặt lại hạt giống: lần vẽ sau giống hệt
    }

    /* ---------- máy quay: khóa hình [t, x, y, xa, nghiêng°, xoay°] nội suy mượt ---------- */
    function mayQuay(t) {
      const ks = K.may_quay; let i = 0; while (i < ks.length - 1 && ks[i + 1][0] <= t) i++;
      const a = ks[i], b = ks[Math.min(ks.length - 1, i + 1)], k = b === a ? 0 : ease(prog(t, a[0], b[0])), L = j => a[j] + (b[j] - a[j]) * k;
      const x = L(1), y = L(2), xa = L(3), ng0 = L(4) * Math.PI / 180, xo = L(5) * Math.PI / 180, tam = P3(x, y);
      cam.position.set(tam.x + Math.sin(xo) * Math.cos(ng0) * xa, tam.y + Math.sin(ng0) * xa, tam.z + Math.cos(xo) * Math.cos(ng0) * xa); cam.lookAt(tam);
    }

    function ve(t) {
      /* nền + mũi tên + vết cháy */
      ng.drawImage(o.nen, 0, 0, W, H);
      LUA.forEach(l => { const k = o.sau_tran ? 1 : prog(t, l.t0 + 1, l.t0 + 4); if (k > 0) vetChay(l, k); });
      (K.mui_ten || []).forEach(m => { const u = o.sau_tran ? m.den ?? 1 : (m.tu ?? 0) + ((m.den ?? 1) - (m.tu ?? 0)) * ease(prog(t, m.t0, m.t1)); if (!o.sau_tran && t < m.t0) return; if (m.an_sau != null && t > m.an_sau) return; const d = lay(m.duong); muiTen(d.doan(m.bat_dau ?? 0, u), m.ben, m.net === 'dut', (m.day || 16) * 0.6); });
      ntx.needsUpdate = true;
      /* sprite: đạo quân, phục binh, lửa, cờ cắm */
      dung = 0;
      (K.doan_quan || []).forEach((q, qi) => {
        if (!o.sau_tran && (t < q.t0 || (q.an_sau != null && t > q.an_sau))) return; if (o.sau_tran) return;
        const d = lay(q.duong), u = (q.tu ?? 0) + ((q.den ?? 1) - (q.tu ?? 0)) * ease(prog(t, q.t0 + (q.cho || 0), q.t1)), dangDi = t > q.t0 + (q.cho || 0) && t < q.t1;
        const nga = q.nga_tai != null && t >= q.nga_tai;
        for (let k = (q.linh || 0); k >= 1; k--) {   // đoàn lính đi sau tướng
          const uu = u - k * (q.gian_cach || .012); if (uu < (q.tu ?? 0) - .001) continue; const [x, y] = d.tai(uu), lech = ((k * 37) % 7 - 3) * 6;
          const s = dat('linh-' + q.ben, P3(x + lech, y + ((k * 53) % 5 - 2) * 6, .5), 9); s.material.opacity = nga ? Math.max(0, 1 - (t - q.nga_tai) / 2.5) : 1;
        }
        for (let k = 1; k <= (q.ngua || 0); k++) { const uu = u - (k + .5) * (q.gian_cach || .012) * 1.6; if (uu < (q.tu ?? 0)) continue; const [x, y] = d.tai(uu); dat(`ngua-${q.ben}-${dangDi ? Math.floor(t * 8 + k) % 4 : 1}`, P3(x - 10 + k * 3, y + 9, .5), 11); }
        if (q.tuong) { const [x, y] = d.tai(u); const s = dat('t' + qi, P3(x, y, .5), 32); s.material = (nga ? TUONG_NGA[qi] : TUONG[qi]).m; }
      });
      (K.phuc_binh || []).forEach(p => { if (o.sau_tran || t < p.t0) return; const k = ease(prog(t, p.t0, p.t0 + .6)); for (let i = 0; i < (p.so || 5); i++) { const ang = i / (p.so || 5) * 6.28; dat('linh-' + p.ben, P3(p.xy[0] + Math.cos(ang) * 16, p.xy[1] + Math.sin(ang) * 10, .5), 9 * k); } dat('co-' + p.ben, P3(p.xy[0], p.xy[1], .5), 20 * k); });
      LUA.forEach((l, i) => { if (o.sau_tran || t < l.t0 || t > l.t1) return; const k = Math.min(prog(t, l.t0, l.t0 + .8), 1 - prog(t, l.t1 - 1.2, l.t1)); for (let j = 0; j < (l.ngon || 6); j++) { const a = j * 2.4 + i, d = (j % 3 + .4) * l.ban_kinh * .35; dat('lua-' + ((Math.floor(t * 10) + j) % 6), P3(l.xy[0] + Math.cos(a) * d, l.xy[1] + Math.sin(a) * d * .7, 0), (16 + (j % 4) * 5) * k); } });
      (K.co_cam || []).forEach(c => { if (!o.sau_tran && t < c.t0) return; dat('co-' + c.ben, P3(c.xy[0], c.xy[1], .5), 24 * (o.sau_tran ? 1 : ease(prog(t, c.t0, c.t0 + .7)))); });
      for (let i = dung; i < pool.length; i++) pool[i].visible = false;
      mayQuay(t);
      renderer.render(scene, cam);
      /* nhãn */
      const w = R, h = C;
      NHAN.forEach(n => { const vis = t >= n.t0 && t <= n.t1, p = P3(n.xy[0], n.xy[1], n.dia ? 6 : 14).project(cam);
        const k = n.dia ? 1 : Math.min(prog(t, n.t0, n.t0 + .5), 1 - prog(t, n.t1 - .5, n.t1));
        n.e.style.opacity = vis && p.z < 1 && (1 - p.y) / 2 * h > 150 && Math.abs(p.x) < 1.05 && Math.abs(p.y) < 1.05 ? k : 0; n.e.style.transform = `translate(${(p.x + 1) / 2 * w}px,${(1 - p.y) / 2 * h}px) translate(-50%,-100%)`; });
    }
    /* sprite cờ dùng chung cho phục binh/cờ cắm */
    SP['co-ta'] = CO_DAT.ta; SP['co-dich'] = CO_DAT.dich; TUONG.forEach((s, i) => { if (s) SP['t' + i] = s; });
    return { ve };
  };
})();
