/* =========================================================================
   XƯỞNG PHIM LỊCH SỬ – engine dựng hoạt cảnh theo thời gian (deterministic)
   Mọi chuyển động được tính từ thời gian t ⇒ vừa phát trực tiếp trên web,
   vừa xuất từng khung hình ra MP4 (tools/render-video.mjs).
   ========================================================================= */
(function () {
  'use strict';
  const W = 1920, H = 1080;
  const NS = 'http://www.w3.org/2000/svg';

  /* ---------- tiện ích ---------- */
  const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));
  const ramp = (t, a, b) => clamp((t - a) / (b - a));
  const ease = x => x < .5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
  const eout = x => 1 - Math.pow(1 - x, 3);
  const lerp = (a, b, k) => a + (b - a) * k;
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  function h(tag, attrs, parent, html) {
    const e = document.createElement(tag);
    if (attrs) for (const k in attrs) k === 'style' ? (e.style.cssText = attrs[k]) : e.setAttribute(k, attrs[k]);
    if (html != null) e.innerHTML = html;
    if (parent) parent.appendChild(e);
    return e;
  }
  function s(tag, attrs, parent, text) {
    const e = document.createElementNS(NS, tag);
    if (attrs) for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (text != null) e.textContent = text;
    if (parent) parent.appendChild(e);
    return e;
  }
  const esc = t => String(t).replace(/[&<>]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;' }[c]));

  /* ---------- phép chiếu bản đồ (khớp tools/build-map.mjs) ---------- */
  function proj(lon, lat) {
    const P = window.MAP_DATA.proj;
    const l = lon * Math.PI / 180, p = lat * Math.PI / 180;
    return [P.tx + P.scale * l, P.ty - P.scale * Math.log(Math.tan(Math.PI / 4 + p / 2))];
  }

  /* ---------- thời lượng cảnh ---------- */
  function words(t) { return (t || '').trim().split(/\s+/).filter(Boolean).length; }
  function sceneDur(sc) { return Math.max(sc.min || 4.5, words(sc.say) * 0.37 + 1.4); }

  /* ---------- phụ đề: cắt câu thành đoạn ngắn ---------- */
  function chunks(text) {
    if (!text) return [];
    const parts = text.replace(/\s+/g, ' ').trim().split(/(?<=[.!?…;:])\s+/);
    const out = [];
    for (const p of parts) {
      if (p.length <= 80) { out.push(p); continue; }
      const ws = p.split(' '); let cur = '';
      const n = Math.ceil(p.length / 75), target = p.length / n;
      for (const w of ws) {
        if (cur && (cur + ' ' + w).length > target + 8 && /[,]$/.test(cur)) { out.push(cur); cur = w; }
        else if (cur && (cur + ' ' + w).length > 86) { out.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
      }
      if (cur) out.push(cur);
    }
    return out;
  }

  /* ---------- hoa văn trống đồng Đông Sơn (dùng làm biểu tượng) ---------- */
  function drum(parent, cx, cy, R, color) {
    const g = s('g', { transform: `translate(${cx},${cy})`, fill: 'none', stroke: color }, parent);
    // ngôi sao trung tâm 14 cánh
    let d = '';
    for (let i = 0; i < 28; i++) {
      const a = i * Math.PI / 14 - Math.PI / 2, r = i % 2 ? R * .07 : R * .2;
      d += (i ? 'L' : 'M') + (Math.cos(a) * r).toFixed(1) + ',' + (Math.sin(a) * r).toFixed(1);
    }
    s('path', { d: d + 'Z', fill: color, stroke: 'none' }, g);
    const rings = [.24, .3, .42, .48, .66, .72, .9, .96, 1];
    rings.forEach(r => s('circle', { r: R * r, 'stroke-width': 2 }, g));
    // vạch chéo
    for (let i = 0; i < 64; i++) {
      const a = i * Math.PI * 2 / 64;
      s('line', { x1: Math.cos(a) * R * .3, y1: Math.sin(a) * R * .3, x2: Math.cos(a + .05) * R * .42, y2: Math.sin(a + .05) * R * .42, 'stroke-width': 2 }, g);
    }
    // vòng tròn chấm
    for (let i = 0; i < 36; i++) {
      const a = i * Math.PI * 2 / 36;
      s('circle', { cx: Math.cos(a) * R * .57, cy: Math.sin(a) * R * .57, r: R * .035, 'stroke-width': 2 }, g);
      s('circle', { cx: Math.cos(a) * R * .57, cy: Math.sin(a) * R * .57, r: R * .01, fill: color }, g);
    }
    // chim Lạc bay
    for (let i = 0; i < 10; i++) {
      const a = i * Math.PI * 2 / 10, r = R * .81;
      const bg = s('g', { transform: `rotate(${a * 180 / Math.PI + 90}) translate(0,${-r})`, fill: color, stroke: 'none' }, g);
      s('path', { d: `M${-R * .09},0 Q0,${-R * .03} ${R * .1},${-R * .015} L${R * .13},${-R * .05} L${R * .11},0 Q0,${R * .03} ${-R * .09},0Z M${-R * .02},0 L${-R * .07},${-R * .06} L${R * .02},${-R * .01}Z` }, bg);
    }
    return g;
  }

  /* ---------- nền "tranh cổ" thủ tục ---------- */
  function paintedBG(svg, seed, opts = {}) {
    const r = rng(seed);
    const defs = s('defs', null, svg);
    const lg = s('linearGradient', { id: 'sky' + seed, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
    s('stop', { offset: 0, 'stop-color': '#3b3226' }, lg);
    s('stop', { offset: .55, 'stop-color': '#6b5a42' }, lg);
    s('stop', { offset: 1, 'stop-color': '#2a241b' }, lg);
    s('rect', { width: W, height: H, fill: `url(#sky${seed})` }, svg);
    // núi đá vôi xa
    for (let layer = 0; layer < 3; layer++) {
      let d = `M0,${H}`; const base = 520 + layer * 70; let x = 0;
      while (x < W + 100) {
        const w = 60 + r() * 140, hh = 80 + r() * (220 - layer * 50);
        d += ` L${x},${base} Q${x + w * .1},${base - hh} ${x + w * .5},${base - hh * 1.05} Q${x + w * .9},${base - hh} ${x + w},${base}`;
        x += w * (.7 + r() * .4);
      }
      d += ` L${W},${H}Z`;
      s('path', { d, fill: ['#5a4b37', '#4a3d2d', '#3a3024'][layer], opacity: .9 }, svg);
    }
    // mặt sông/biển
    s('rect', { x: 0, y: 700, width: W, height: 380, fill: '#2e2a22' }, svg);
    const waves = s('g', { stroke: '#7d6a4c', 'stroke-width': 2, fill: 'none', opacity: .5 }, svg);
    for (let i = 0; i < 40; i++) {
      const y = 720 + r() * 340, x = r() * W, w = 40 + r() * 90;
      s('path', { d: `M${x},${y} q${w / 4},-8 ${w / 2},0 t${w / 2},0` }, waves);
    }
    // cọc nhọn
    if (opts.stakes) {
      const g = s('g', { fill: '#1c1712' }, svg);
      for (let i = 0; i < 46; i++) {
        const x = 80 + i * 40 + r() * 20, y = 860 + r() * 140, hh = 60 + r() * 90, lean = (r() - .5) * 30;
        s('path', { d: `M${x - 7},${y} L${x + lean},${y - hh} L${x + 7},${y}Z` }, g);
      }
    }
    // thuyền chiến
    const ships = s('g', null, svg);
    for (let i = 0; i < (opts.ships || 6); i++) {
      const x = 120 + r() * (W - 240), y = 690 + r() * 160, k = .6 + r() * .9;
      junk(ships, x, y, k, '#1e1914', '#4b3f30');
    }
    return svg;
  }
  function junk(parent, x, y, k, hull, sail) {
    const g = s('g', { transform: `translate(${x},${y}) scale(${k})` }, parent);
    s('path', { d: 'M-120,0 Q-110,30 -60,34 L70,34 Q115,28 130,-10 L95,4 L-95,4 Z', fill: hull }, g);
    s('rect', { x: -6, y: -170, width: 6, height: 176, fill: hull }, g);
    s('rect', { x: 52, y: -110, width: 5, height: 116, fill: hull }, g);
    s('path', { d: 'M-70,-160 L0,-168 L6,-20 L-80,-14 Q-90,-90 -70,-160Z', fill: sail, opacity: .95 }, g);
    for (let i = 1; i < 6; i++) s('line', { x1: -80 + i * 2, y1: -160 + i * 25, x2: 4, y2: -166 + i * 25, stroke: hull, 'stroke-width': 2 }, g);
    s('path', { d: 'M18,-104 L56,-108 L60,-14 L12,-10 Q4,-60 18,-104Z', fill: sail, opacity: .9 }, g);
    return g;
  }


  /* ======================================================================
     PHONG CÁCH HÌNH NỀN cho dự án tự tạo: tailieu | vientuong | hoathinh
     Trả về { update(t) } để chuyển động theo thời gian.
     ====================================================================== */
  function styleBG(svg, style, seed, opts = {}) {
    const r = rng(seed || 1);
    if (style === 'vientuong') {
      const defs = s('defs', null, svg);
      const g1 = s('radialGradient', { id: 'neb' + seed, cx: '70%', cy: '30%', r: '80%' }, defs);
      s('stop', { offset: 0, 'stop-color': '#3a1d6e' }, g1); s('stop', { offset: .5, 'stop-color': '#120b2e' }, g1); s('stop', { offset: 1, 'stop-color': '#05040d' }, g1);
      const bl = s('filter', { id: 'blur' + seed, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); s('feGaussianBlur', { stdDeviation: 60 }, bl);
      s('rect', { width: W, height: H, fill: `url(#neb${seed})` }, svg);
      const neb = s('g', { filter: `url(#blur${seed})`, opacity: .55 }, svg);
      [['#6a2c91', 1300, 300, 380, 200], ['#1f4fa8', 500, 250, 420, 180], ['#a8326f', 900, 520, 300, 140]].forEach(([c, x, y, rx, ry]) => s('ellipse', { cx: x, cy: y, rx, ry, fill: c }, neb));
      const stars = [];
      for (let i = 0; i < 220; i++) stars.push([s('circle', { cx: r() * W, cy: r() * H * .8, r: r() < .1 ? 2.4 : 1.1 + r(), fill: '#fff' }, svg), r() * 6, .4 + r() * .6]);
      const pl = s('g', null, svg);
      const pg = s('radialGradient', { id: 'pl' + seed, cx: '35%', cy: '35%', r: '70%' }, defs);
      s('stop', { offset: 0, 'stop-color': '#7fd3ff' }, pg); s('stop', { offset: .6, 'stop-color': '#2a5c9e' }, pg); s('stop', { offset: 1, 'stop-color': '#0b1a3a' }, pg);
      s('circle', { cx: 1580, cy: 250, r: 150, fill: `url(#pl${seed})` }, pl);
      s('ellipse', { cx: 1580, cy: 250, rx: 260, ry: 46, fill: 'none', stroke: '#9fe7ff', 'stroke-width': 6, opacity: .55, transform: 'rotate(-18 1580 250)' }, pl);
      const grid = s('g', { stroke: '#38e1ff', 'stroke-width': 2, opacity: .55 }, svg);
      for (let i = -12; i <= 12; i++) s('line', { x1: W / 2 + i * 40, y1: 760, x2: W / 2 + i * 260, y2: H }, grid);
      const hz = []; for (let i = 0; i < 9; i++) hz.push(s('line', { x1: 0, x2: W, y1: 760, y2: 760 }, grid));
      s('rect', { x: 0, y: 740, width: W, height: 24, fill: '#38e1ff', opacity: .12 }, svg);
      return { update(t) {
        stars.forEach(([c, ph, b]) => c.setAttribute('opacity', b * (.6 + .4 * Math.sin(t * 2 + ph))));
        pl.setAttribute('transform', `translate(${-t * 6},${Math.sin(t * .4) * 8})`);
        hz.forEach((l, i) => { const k = ((i / 9) + t * .12) % 1, y = 760 + Math.pow(k, 2.2) * (H - 760); l.setAttribute('y1', y); l.setAttribute('y2', y); l.setAttribute('opacity', k); });
      } };
    }
    if (style === 'hoathinh') {
      const defs = s('defs', null, svg);
      const sky = s('linearGradient', { id: 'sky' + seed, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      s('stop', { offset: 0, 'stop-color': '#5fc3ff' }, sky); s('stop', { offset: .7, 'stop-color': '#bfe9ff' }, sky); s('stop', { offset: 1, 'stop-color': '#fff4d6' }, sky);
      s('rect', { width: W, height: H, fill: `url(#sky${seed})` }, svg);
      const sun = s('g', { transform: 'translate(1620,180)' }, svg);
      const rays = s('g', null, sun);
      for (let i = 0; i < 12; i++) s('rect', { x: -8, y: -150, width: 16, height: 46, rx: 8, fill: '#ffd23f', transform: `rotate(${i * 30})` }, rays);
      s('circle', { r: 90, fill: '#ffd23f', stroke: '#f5a300', 'stroke-width': 8 }, sun);
      const clouds = [];
      for (let i = 0; i < 6; i++) {
        const g = s('g', null, svg), k = .6 + r() * .8;
        [[0, 0, 70], [60, -25, 60], [120, 0, 65], [60, 15, 70]].forEach(([x, y, rr]) => s('circle', { cx: x * k, cy: y * k, r: rr * k, fill: '#fff' }, g));
        clouds.push([g, r() * W, 80 + r() * 300, 10 + r() * 25]);
      }
      [['#7ed957', 720, 160], ['#4cb648', 820, 120], ['#2f8f3a', 920, 90]].forEach(([c, y, a], j) => {
        let d = `M0,${H} L0,${y}`; for (let x = 0; x <= W; x += 240) d += ` Q${x + 120},${y - a * (j % 2 ? .6 : 1) * (r() + .4)} ${x + 240},${y}`; d += ` L${W},${H}Z`;
        s('path', { d, fill: c, stroke: '#1d5c25', 'stroke-width': 5 }, svg);
      });
      for (let i = 0; i < 7; i++) {
        const x = 100 + r() * (W - 200), y = 820 + r() * 120, k = .7 + r() * .6;
        const tg = s('g', { transform: `translate(${x},${y}) scale(${k})` }, svg);
        s('rect', { x: -8, y: -40, width: 16, height: 50, rx: 4, fill: '#8a5a2b', stroke: '#4a2e12', 'stroke-width': 4 }, tg);
        s('circle', { cy: -70, r: 46, fill: '#3fae49', stroke: '#1d5c25', 'stroke-width': 5 }, tg);
      }
      return { update(t) {
        rays.setAttribute('transform', `rotate(${t * 12})`);
        clouds.forEach(([g, x, y, v]) => g.setAttribute('transform', `translate(${((x + t * v) % (W + 300)) - 150},${y})`));
      } };
    }
    paintedBG(svg, seed, opts);
    return { update() {} };
  }

  /* ======================================================================
     CÁC LOẠI CẢNH – mỗi loại trả về {root, update(lt, dur)}
     ====================================================================== */
  const SCENES = {};

  /* ----- Tiêu đề ----- */
  SCENES.title = function (sc, B) {
    const root = h('div', { class: 'sc sc-title' });
    const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root);
    const bgu = styleBG(bg, B.style, B.seed || 7, { stakes: sc.stakes, ships: sc.ships });
    h('div', { class: 'shade' }, root);
    const box = h('div', { class: 'title-box' }, root);
    const big = h('div', { class: 'title-big' }, box);
    if (sc.size) { big.style.fontSize = sc.size + 'px'; big.style.lineHeight = '1.05'; big.style.padding = '0 80px'; }
    const letters = [...sc.title].map(ch => h('span', null, big, ch === ' ' ? '&nbsp;' : esc(ch)));
    const sub = h('div', { class: 'title-sub' }, box, esc(sc.sub || ''));
    const line = h('div', { class: 'title-line' }, box, esc(sc.line || ''));
    const stamp = sc.stamp ? h('div', { class: 'stamp' }, root, esc(sc.stamp)) : null;
    return {
      root, update(t, d) {
        bg.style.transform = `scale(${1.04 + t / d * .08}) translate(${-t * 4}px,0)`; bgu.update(t);
        letters.forEach((l, i) => {
          const k = eout(ramp(t, .3 + i * .06, .9 + i * .06));
          l.style.opacity = k; l.style.transform = `translateY(${(1 - k) * 40}px)`;
        });
        const k2 = eout(ramp(t, 1.2, 2)); sub.style.opacity = k2; sub.style.letterSpacing = (14 - k2 * 6) + 'px';
        line.style.opacity = eout(ramp(t, 1.8, 2.6));
        if (stamp) { const k3 = ramp(t, 2.6, 3); stamp.style.opacity = k3; stamp.style.transform = `rotate(-6deg) scale(${1.8 - eout(k3) * .8})`; }
      }
    };
  };

  /* ----- Nhân vật ----- */
  SCENES.hero = function (sc, B) {
    const root = h('div', { class: 'sc sc-hero' });
    const frame = h('div', { class: 'hero-frame' }, root);
    const svg = s('svg', { viewBox: '0 0 600 760' }, frame);
    s('rect', { width: 600, height: 760, fill: '#e8dcc0' }, svg);
    const dg = s('g', null, svg);
    drum(dg, 300, 330, 250, '#5b4630');
    s('rect', { x: 40, y: 640, width: 520, height: 80, fill: '#2b2118' }, svg);
    s('text', { x: 300, y: 693, 'text-anchor': 'middle', fill: '#e2c27a', 'font-family': 'Oswald', 'font-weight': 700, 'font-size': 40, 'letter-spacing': 3 }, svg, sc.plate || sc.name.toUpperCase());
    const info = h('div', { class: 'hero-info' }, root);
    const kicker = h('div', { class: 'kicker' }, info, esc(sc.kicker || 'ANH HÙNG DÂN TỘC'));
    const name = h('div', { class: 'hero-name' }, info, esc(sc.name.toUpperCase()));
    const bar = h('div', { class: 'redbar' }, info);
    const alt = h('div', { class: 'hero-alt' }, info, esc(sc.alt || ''));
    const role = h('div', { class: 'hero-role' }, info, esc(sc.role || ''));
    return {
      root, update(t, d) {
        const k = eout(ramp(t, 0, .9));
        frame.style.opacity = k; frame.style.transform = `translateX(${(1 - k) * -80}px) rotate(${-2 + k * 0}deg)`;
        dg.setAttribute('transform', `rotate(${t * 4} 300 330)`);
        kicker.style.opacity = ramp(t, .6, 1.1);
        const k2 = eout(ramp(t, .9, 1.6)); name.style.opacity = k2; name.style.transform = `translateY(${(1 - k2) * 30}px)`;
        bar.style.width = eout(ramp(t, 1.4, 2.2)) * 360 + 'px';
        alt.style.opacity = ramp(t, 2, 2.6); role.style.opacity = ramp(t, 2.5, 3.1);
      }
    };
  };

  /* ----- Bản đồ ----- */
  SCENES.map = function (sc, B) {
    const M = window.MAP_DATA;
    const root = h('div', { class: 'sc sc-map' });
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mapsvg' }, root);
    s('rect', { x: -4000, y: -4000, width: 12000, height: 12000, fill: '#1b2838' }, svg);
    const defs = s('defs', null, svg);
    const cut = proj(105, sc.cutLat ?? 8)[1];
    const cp = s('clipPath', { id: 'dv' + sc._i }, defs);
    s('rect', { x: -4000, y: -4000, width: 12000, height: cut + 4000 }, cp);
    // lưới kinh vĩ
    const grid = s('g', { stroke: '#2c3d52', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, svg);
    for (let lo = 90; lo <= 130; lo += 5) { const a = proj(lo, 0), b = proj(lo, 35); s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'vector-effect': 'non-scaling-stroke' }, grid); }
    for (let la = 0; la <= 35; la += 5) { const a = proj(85, la), b = proj(135, la); s('line', { x1: a[0], y1: a[1], x2: b[0], y2: b[1], 'vector-effect': 'non-scaling-stroke' }, grid); }
    const land = s('g', null, svg);
    let vn = null;
    for (const c of M.countries) {
      const p = s('path', { d: c.d, fill: c.n === 'Vietnam' ? '#e3d6b6' : '#cfc2a2', stroke: '#8a7c5e', 'stroke-width': 1, 'vector-effect': 'non-scaling-stroke' }, land);
      if (c.n === 'Vietnam') vn = c.d;
      if (sc.enemy && sc.enemy.countries && sc.enemy.countries.includes(c.n)) p.classList.add('enemy-land');
    }
    const dv = s('path', { d: vn, fill: '#b8322a', stroke: '#7d1d17', 'stroke-width': 1.5, 'vector-effect': 'non-scaling-stroke', 'clip-path': `url(#dv${sc._i})` }, svg);
    // lớp phủ màn hình (nhãn, mũi tên, marker)
    const ov = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'mapov' }, root);
    const islands = [[112.1, 16.5, 'QĐ. HOÀNG SA'], [114.3, 10.2, 'QĐ. TRƯỜNG SA']];
    const isl = islands.map(([lo, la, tx]) => {
      const g = s('g', null, ov);
      const r = rng(Math.round(lo * 10));
      const dots = []; for (let i = 0; i < 9; i++) dots.push([lo + (r() - .5) * 1.4, la + (r() - .5) * 1.1]);
      return { g, dots: dots.map(d => [d, s('circle', { r: 2.5, fill: '#e3d6b6' }, g)]), lab: s('text', { class: 'map-isl' }, g, tx), lo, la };
    });
    const labels = (sc.labels || []).map(L => {
      const g = s('g', { opacity: 0 }, ov);
      const t = s('text', { class: 'map-lab ' + (L.style || 'place'), 'text-anchor': L.anchor || 'middle' }, g, L.text);
      if (L.dot) { if (L.anchor === 'end') { t.setAttribute('x', -14); t.setAttribute('y', 9); } else if (L.anchor === 'start') { t.setAttribute('x', 14); t.setAttribute('y', 9); } else t.setAttribute('y', -16); }
      if (L.dot) s('circle', { r: 6, cy: 0, class: 'map-dot ' + (L.style || 'place') }, g);
      return { L, g, t };
    });
    const routes = (sc.routes || []).map(R => {
      const p = s('path', { class: 'route ' + (R.side || 'dich'), fill: 'none' }, ov);
      const head = s('path', { d: 'M0,-13 L26,0 L0,13 Z', class: 'rhead ' + (R.side || 'dich') }, ov);
      return { R, p, head };
    });
    const mk = sc.marker ? { g: s('g', null, ov) } : null;
    if (mk) {
      mk.ring = s('circle', { r: 20, fill: 'none', stroke: '#ffd36b', 'stroke-width': 4 }, mk.g);
      mk.ring2 = s('circle', { r: 20, fill: 'none', stroke: '#ffd36b', 'stroke-width': 3 }, mk.g);
      s('circle', { r: 10, fill: '#ffd36b' }, mk.g);
      mk.t = s('text', { class: 'map-mk', x: 30, y: 10 }, mk.g, sc.marker.text || '');
    }
    const date = sc.date ? h('div', { class: 'map-date' }, root, esc(sc.date)) : null;
    const legend = h('div', { class: 'map-legend' }, root,
      `<div><i style="background:#b8322a"></i>${esc(sc.legendOurs || 'Đại Việt')}</div>` +
      (sc.legendEnemy ? `<div><i style="background:#7a6a8c"></i>${esc(sc.legendEnemy)}</div>` : '') +
      `<div><i class="o"></i>Chiến trường</div>`);
    h('div', { class: 'map-note' }, root, 'Bản đồ minh họa · phạm vi lãnh thổ mang tính ước lượng');
    const cams = sc.cam || [{ lon: 108, lat: 18, z: 1 }];
    function camAt(f) {
      if (cams.length === 1) return cams[0];
      const seg = 1 / (cams.length - 1); const i = Math.min(cams.length - 2, Math.floor(f / seg));
      const k = ease(clamp((f - i * seg) / seg));
      const a = cams[i], b = cams[i + 1];
      return { lon: lerp(a.lon, b.lon, k), lat: lerp(a.lat, b.lat, k), z: Math.exp(lerp(Math.log(a.z), Math.log(b.z), k)) };
    }
    return {
      root, update(t, d) {
        const f = clamp(t / d);
        const c = camAt(ease(ramp(f, .05, .75)) * 1);
        const [cx, cy] = proj(c.lon, c.lat);
        const vw = W / c.z, vh = H / c.z, x0 = cx - vw / 2, y0 = cy - vh / 2;
        svg.setAttribute('viewBox', `${x0} ${y0} ${vw} ${vh}`);
        const scr = (lo, la) => { const p = proj(lo, la); return [(p[0] - x0) * c.z, (p[1] - y0) * c.z]; };
        dv.style.opacity = eout(ramp(t, .4, 1.4));
        isl.forEach(I => {
          I.dots.forEach(([dd, el]) => { const p = scr(dd[0], dd[1]); el.setAttribute('cx', p[0]); el.setAttribute('cy', p[1]); el.setAttribute('r', clamp(2 * c.z, 2, 5)); });
          const p = scr(I.lo, I.la + .9); I.lab.setAttribute('x', p[0]); I.lab.setAttribute('y', p[1]); I.lab.setAttribute('text-anchor', 'middle');
        });
        labels.forEach(({ L, g }) => {
          const p = scr(L.lon, L.lat);
          g.setAttribute('transform', `translate(${p[0]},${p[1]})`);
          g.setAttribute('opacity', eout(ramp(f, L.at ?? .2, (L.at ?? .2) + .06)));
        });
        routes.forEach(({ R, p, head }) => {
          const pts = R.pts.map(q => scr(q[0], q[1]));
          let dd = `M${pts[0][0]},${pts[0][1]}`;
          for (let i = 1; i < pts.length; i++) {
            const a = pts[i - 1], b = pts[i], mx = (a[0] + b[0]) / 2, my = (a[1] + b[1]) / 2;
            const nx = -(b[1] - a[1]) * .15, ny = (b[0] - a[0]) * .15;
            dd += ` Q${mx + nx * (R.bend ?? 1)},${my + ny * (R.bend ?? 1)} ${b[0]},${b[1]}`;
          }
          p.setAttribute('d', dd);
          const L = p.getTotalLength(), k = ease(ramp(f, R.at ?? .3, (R.at ?? .3) + (R.len ?? .3)));
          p.style.strokeDasharray = `${L} ${L}`; p.style.strokeDashoffset = L * (1 - k);
          if (k > 0.01) {
            const q = p.getPointAtLength(L * k), q0 = p.getPointAtLength(Math.max(0, L * k - 4));
            const ang = Math.atan2(q.y - q0.y, q.x - q0.x) * 180 / Math.PI;
            head.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${ang})`); head.style.opacity = 1;
          } else head.style.opacity = 0;
        });
        if (mk) {
          const p = scr(sc.marker.lon, sc.marker.lat), k = ramp(f, sc.marker.at ?? .6, (sc.marker.at ?? .6) + .05);
          mk.g.setAttribute('transform', `translate(${p[0]},${p[1]})`); mk.g.style.opacity = k;
          const ph = (t * .8) % 1, ph2 = (t * .8 + .5) % 1;
          mk.ring.setAttribute('r', 14 + ph * 40); mk.ring.style.opacity = 1 - ph;
          mk.ring2.setAttribute('r', 14 + ph2 * 40); mk.ring2.style.opacity = 1 - ph2;
        }
        if (date) date.style.opacity = ramp(t, .2, .8);
        legend.style.opacity = ramp(t, .5, 1.1);
      }
    };
  };

  /* ----- So sánh lực lượng ----- */
  SCENES.forces = function (sc) {
    const root = h('div', { class: 'sc sc-forces' });
    h('div', { class: 'sec-title' }, root, esc(sc.title || 'TƯƠNG QUAN LỰC LƯỢNG'));
    const wrap = h('div', { class: 'f-wrap' }, root);
    const cols = [sc.ours, sc.enemy].map((S, i) => {
      const c = h('div', { class: 'f-col ' + (i ? 'enemy' : 'ours') }, wrap);
      h('div', { class: 'f-head' }, c, esc(S.name));
      const rows = S.rows.map(([k, v, num]) => {
        const r = h('div', { class: 'f-row' }, c);
        h('div', { class: 'f-k' }, r, esc(k));
        const vv = h('div', { class: 'f-v' }, r, esc(v));
        return { r, vv, v, num };
      });
      return { c, rows };
    });
    const vs = h('div', { class: 'f-vs' }, wrap, 'VS');
    return {
      root, update(t) {
        cols.forEach((C, i) => {
          const k = eout(ramp(t, .2 + i * .3, 1 + i * .3));
          C.c.style.opacity = k; C.c.style.transform = `translateX(${(1 - k) * (i ? 80 : -80)}px)`;
          C.rows.forEach((R, j) => {
            const a = 1 + j * .5 + i * .25; R.r.style.opacity = eout(ramp(t, a, a + .5));
            if (R.num) { const n = Math.round(R.num * eout(ramp(t, a, a + 1.4))); R.vv.textContent = R.v.replace('#', n.toLocaleString('vi-VN')); }
          });
        });
        vs.style.opacity = ramp(t, .9, 1.4); vs.style.transform = `translate(-50%,-50%) scale(${1.6 - eout(ramp(t, .9, 1.4)) * .6})`;
      }
    };
  };

  /* ----- Dòng thời gian ----- */
  SCENES.timeline = function (sc) {
    const root = h('div', { class: 'sc sc-tl' });
    h('div', { class: 'sec-title' }, root, esc(sc.title || 'DIỄN BIẾN'));
    const line = h('div', { class: 'tl-line' }, root);
    const fill = h('div', { class: 'tl-fill' }, line);
    const n = sc.items.length;
    const items = sc.items.map(([when, what], i) => {
      const x = 8 + i * (84 / Math.max(1, n - 1));
      const it = h('div', { class: 'tl-item ' + (i % 2 ? 'dn' : 'up'), style: `left:${x}%` }, root);
      h('div', { class: 'tl-dot' }, it);
      h('div', { class: 'tl-when' }, it, esc(when));
      h('div', { class: 'tl-what' }, it, esc(what));
      return { it, x };
    });
    return {
      root, update(t, d) {
        const span = d - 1.5;
        fill.style.width = eout(ramp(t, .3, .3 + span)) * 100 + '%';
        items.forEach((I, i) => { const a = .3 + span * ((I.x - 8) / 84) - .2; const k = eout(ramp(t, a, a + .6)); I.it.style.opacity = k; I.it.style.transform = `translate(-50%,${(1 - k) * 20}px)`; });
      }
    };
  };

  /* ----- Trích dẫn ----- */
  SCENES.quote = function (sc) {
    const root = h('div', { class: 'sc sc-quote' });
    const svg = s('svg', { viewBox: '0 0 800 800', class: 'q-drum' }, root);
    drum(svg, 400, 400, 380, '#c9a45c');
    h('div', { class: 'q-mark' }, root, '“');
    const q = h('div', { class: 'q-text' }, root);
    const ws = sc.quote.split(' ').map(w => h('span', null, q, esc(w) + ' '));
    const by = h('div', { class: 'q-by' }, root, sc.by ? '— ' + esc(sc.by) : '');
    return {
      root, update(t, d) {
        svg.style.transform = `translate(-50%,-50%) rotate(${t * 3}deg)`;
        const span = Math.min(d * .55, ws.length * .18);
        ws.forEach((w, i) => { w.style.opacity = eout(ramp(t, .4 + i * span / ws.length, .9 + i * span / ws.length)); });
        by.style.opacity = ramp(t, .6 + span, 1.2 + span);
      }
    };
  };

  /* ----- Ý nghĩa / kết ----- */
  SCENES.points = function (sc) {
    const root = h('div', { class: 'sc sc-points' });
    const svg = s('svg', { viewBox: '0 0 800 800', class: 'p-drum' }, root);
    drum(svg, 400, 400, 380, '#c9a45c');
    h('div', { class: 'sec-title' }, root, esc(sc.title || 'Ý NGHĨA LỊCH SỬ'));
    const list = h('div', { class: 'p-list' }, root);
    const items = sc.items.map((x, i) => h('div', { class: 'p-item' }, list, `<b>${String(i + 1).padStart(2, '0')}</b><span>${esc(x)}</span>`));
    return {
      root, update(t, d) {
        svg.style.transform = `translateY(-50%) rotate(${t * 3}deg)`;
        const step = (d - 1.5) / items.length;
        items.forEach((it, i) => { const k = eout(ramp(t, .5 + i * step, 1.1 + i * step)); it.style.opacity = k; it.style.transform = `translateX(${(1 - k) * 60}px)`; });
      }
    };
  };


  /* ----- Thẻ nội dung (dự án tự tạo): nền theo phong cách + ảnh/video + tiêu đề + câu nổi bật ----- */
  SCENES.card = function (sc, B) {
    const root = h('div', { class: 'sc sc-card' });
    const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root);
    const bgu = styleBG(bg, B.style, (B.seed || 7) + sc._i * 13, { ships: 2 });
    let media = null;
    if (sc.media && sc.media.url) {
      media = sc.media.kind === 'video'
        ? h('video', { class: 'card-media', src: sc.media.url, muted: '', playsinline: '', preload: 'auto' }, root)
        : h('img', { class: 'card-media', src: sc.media.url }, root);
      if (media.tagName === 'VIDEO') media.muted = true;
    }
    h('div', { class: 'shade card-shade' + (media ? ' has-media' : '') }, root);
    const box = h('div', { class: 'card-box' }, root);
    const kick = sc.kicker ? h('div', { class: 'card-kick' }, box, esc(sc.kicker)) : null;
    const head = sc.heading ? h('div', { class: 'card-head' }, box, esc(sc.heading)) : null;
    const bar = h('div', { class: 'card-bar' }, box);
    let pull = (sc.pull != null ? sc.pull : (sc.say || '').split(/(?<=[.!?…])\s+/)[0] || '');
    if (pull.length > 110) pull = pull.slice(0, 107).replace(/\s+\S*$/, '') + '…';
    const pw = sc.heading && !sc.pull ? [] : pull.split(' ').map(w => h('span', null, null, esc(w) + ' '));
    const pd = pw.length ? h('div', { class: 'card-pull' }, box) : null;
    pw.forEach(w => pd.appendChild(w));
    return {
      root, update(t, d) {
        bg.style.transform = `scale(${1.05 + t / d * .07})`; bgu.update(t);
        if (media) {
          media.style.transform = `scale(${1.04 + t / d * .1}) translate(${-t * 3}px,${-t * 1.5}px)`;
          media.style.opacity = eout(ramp(t, 0, .6));
          if (media.tagName === 'VIDEO' && media.readyState >= 1 && media.duration) {
            const want = t % media.duration;
            if (Math.abs(media.currentTime - want) > .3) media.currentTime = want;
          }
        }
        if (kick) kick.style.opacity = eout(ramp(t, .2, .7));
        if (head) { const k = eout(ramp(t, .35, 1)); head.style.opacity = k; head.style.transform = `translateY(${(1 - k) * 30}px)`; }
        bar.style.width = eout(ramp(t, .8, 1.6)) * 260 + 'px';
        if (pd) { const k = eout(ramp(t, .8, 1.2)); pd.style.opacity = k; pd.style.transform = `scale(${.92 + k * .08})`; pd.style.transformOrigin = '0 50%'; }
        pw.forEach((w, i) => { const a = 1 + i * .09; w.style.opacity = eout(ramp(t, a, a + .4)); });
      }
    };
  };

  SCENES.end = function (sc, B) {
    const root = h('div', { class: 'sc sc-end' });
    const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root);
    const bgu = styleBG(bg, B.style, (B.seed || 7) + 3, { ships: 3 });
    h('div', { class: 'shade' }, root);
    const box = h('div', { class: 'end-box' }, root);
    h('div', { class: 'end-big' }, box, esc(sc.title || 'GHI NHỚ CÔNG ƠN TIỀN NHÂN'));
    h('div', { class: 'end-sub' }, box, esc(sc.sub || ''));
    if (sc.next) h('div', { class: 'end-next' }, box, 'Tập tiếp theo: <b>' + esc(sc.next) + '</b>');
    return {
      root, update(t, d) {
        bg.style.transform = `scale(${1.1 - t / d * .06})`; bgu.update(t);
        box.style.opacity = eout(ramp(t, .3, 1.3)); box.style.transform = `translateY(${(1 - eout(ramp(t, .3, 1.3))) * 30}px)`;
      }
    };
  };

  /* ----- Sơ đồ trận đánh (hoạt cảnh) ----- */
  SCENES.diagram = function (sc, B) {
    const root = h('div', { class: 'sc sc-diag' });
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'diagsvg' }, root);
    const defs = s('defs', null, svg);
    const pat = s('pattern', { id: 'tex' + sc._i, width: 12, height: 12, patternUnits: 'userSpaceOnUse' }, defs);
    s('path', { d: 'M0,12 L12,0', stroke: '#3a3225', 'stroke-width': 1 }, pat);
    s('rect', { width: W, height: H, fill: '#2b251c' }, svg);
    s('rect', { width: W, height: H, fill: `url(#tex${sc._i})`, opacity: .6 }, svg);
    const r = rng(sc._i * 31 + 5);
    // địa hình: đồi núi
    (sc.hills || []).forEach(([x, y, w, hh, n]) => {
      const g = s('g', null, svg);
      for (let i = 0; i < (n || 5); i++) {
        const cx = x + (r() - .5) * w, cy = y + (r() - .5) * hh * .6, ww = 60 + r() * 80, hh2 = 50 + r() * 70;
        s('path', { d: `M${cx - ww / 2},${cy} L${cx - ww * .1},${cy - hh2} L${cx + ww * .05},${cy - hh2 * .8} L${cx + ww / 2},${cy}Z`, fill: '#4a3f2e', stroke: '#625440', 'stroke-width': 2 }, g);
        s('path', { d: `M${cx - ww * .1},${cy - hh2} L${cx + ww * .1},${cy}`, stroke: '#3a3124', 'stroke-width': 2 }, g);
      }
    });
    // rừng
    (sc.forest || []).forEach(([x, y, w, hh, n]) => {
      for (let i = 0; i < (n || 14); i++) {
        const cx = x + (r() - .5) * w, cy = y + (r() - .5) * hh;
        s('circle', { cx, cy, r: 10 + r() * 8, fill: '#3e4a2c', stroke: '#2e3720', 'stroke-width': 2 }, svg);
      }
    });
    // nước
    const waters = (sc.water || []).map(d => s('path', { d, class: 'water' }, svg));
    const wavesG = s('g', { class: 'wavesg' }, svg);
    (sc.isles || []).forEach(([x, y, rx, ry]) => s('ellipse', { cx: x, cy: y, rx, ry, class: 'isle' }, svg));
    // cọc
    const stakes = [];
    (sc.stakes || []).forEach(Z => {
      for (let i = 0; i < Z.n; i++) {
        const k = i / (Z.n - 1), x = lerp(Z.x1, Z.x2, k) + (r() - .5) * 18, y = lerp(Z.y1, Z.y2, k) + (r() - .5) * 26;
        const g = s('g', { transform: `translate(${x},${y}) rotate(${(r() - .5) * 20 + (Z.lean || 0)})` }, svg);
        s('path', { d: 'M-5,0 L0,-34 L5,0Z', fill: '#c9b48a', stroke: '#1a140e', 'stroke-width': 1.5 }, g);
        s('path', { d: 'M-2.5,-20 L0,-34 L2.5,-20Z', fill: '#6d7684' }, g);
        stakes.push(g);
      }
    });
    // công trình
    (sc.forts || []).forEach(F => {
      const g = s('g', { transform: `translate(${F.x},${F.y})`, class: 'fort ' + (F.side || 'dich') }, svg);
      s('path', { d: 'M-40,-30 h16 v-10 h12 v10 h24 v-10 h12 v10 h16 v60 h-80Z' }, g);
      if (F.label) s('text', { y: 62, class: 'd-lab', 'text-anchor': 'middle' }, g, F.label);
      F._g = g;
    });
    (sc.lines || []).forEach(Ln => { Ln._p = s('path', { d: Ln.d, class: 'defline ' + (Ln.side || 'ta') }, svg); });
    const bridge = sc.bridge ? s('g', { class: 'bridge' }, svg) : null;
    if (bridge) { const [x1, y1, x2, y2] = sc.bridge.at; sc.bridge._a = s('line', { x1, y1, x2: (x1 + x2) / 2, y2: (y1 + y2) / 2 }, bridge); sc.bridge._b = s('line', { x1: (x1 + x2) / 2, y1: (y1 + y2) / 2, x2, y2 }, bridge); }
    const labs = (sc.labels || []).map(L => ({ L, e: s('text', { x: L.x, y: L.y, class: 'd-lab ' + (L.style || ''), 'text-anchor': 'middle' }, svg, L.text) }));
    // mũi tên
    const arrows = (sc.arrows || []).map(A => {
      const p = s('path', { d: A.d, class: 'd-arrow ' + (A.side || 'ta'), style: A.w ? `stroke-width:${A.w}` : '' }, svg);
      const hd = s('path', { d: 'M-4,-16 L30,0 L-4,16 Z', class: 'd-head ' + (A.side || 'ta') }, svg);
      return { A, p, hd, L: 0 };
    });
    // đơn vị
    const units = (sc.units || []).map((U, ui) => {
      const g = s('g', null, svg);
      const rr = rng(ui * 97 + sc._i);
      const n = U.n || 1, members = [];
      for (let i = 0; i < n; i++) {
        const ox = n === 1 ? 0 : (rr() - .5) * (U.spread || 120) * 1.6, oy = n === 1 ? 0 : (rr() - .5) * (U.spread || 120) * .7;
        const m = s('g', null, g);
        const inner = s('g', null, m);
        if (U.kind === 'troop') {
          s('rect', { x: -16, y: -12, width: 32, height: 24, rx: 3, class: 'u-body ' + U.side }, inner);
          s('line', { x1: -16, y1: -12, x2: 16, y2: 12, class: 'u-x' }, inner);
          s('line', { x1: 16, y1: -12, x2: -16, y2: 12, class: 'u-x' }, inner);
        } else if (U.kind === 'horse') {
          s('rect', { x: -16, y: -12, width: 32, height: 24, rx: 3, class: 'u-body ' + U.side }, inner);
          s('line', { x1: -16, y1: 12, x2: 16, y2: -12, class: 'u-x' }, inner);
        } else {
          const sc2 = U.big ? 1.25 : .9;
          s('path', { d: `M${-26 * sc2},0 Q${-22 * sc2},${10 * sc2} ${-12 * sc2},${11 * sc2} L${14 * sc2},${11 * sc2} Q${24 * sc2},${9 * sc2} ${28 * sc2},${-3 * sc2} L${18 * sc2},1 L${-18 * sc2},1Z`, class: 'u-body ' + U.side }, inner);
          s('path', { d: `M${-10 * sc2},${-2 * sc2} L${-8 * sc2},${-30 * sc2} L${8 * sc2},${-30 * sc2} L${10 * sc2},${-2 * sc2}Z`, class: 'u-sail ' + U.side }, inner);
        }
        const fire = s('g', { class: 'u-fire', opacity: 0 }, m);
        for (let j = 0; j < 3; j++) s('path', { d: 'M-8,0 Q-10,-18 0,-34 Q10,-18 8,0Z', fill: j ? '#ffb02e' : '#ff5a1f', transform: `translate(${(j - 1) * 9},-6) scale(${1 - j * .2})` }, fire);
        members.push({ m, inner, fire, ox, oy, ph: rr() * 6, delay: rr() * .04 });
      }
      let lab = null;
      if (U.label) lab = s('text', { class: 'u-lab ' + U.side, 'text-anchor': 'middle' }, g, U.label);
      return { U, g, members, lab };
    });
    const fx = (sc.fx || []).map(F => {
      const g = s('g', { transform: `translate(${F.x},${F.y})`, opacity: 0 }, svg);
      const parts = [];
      for (let j = 0; j < 7; j++) parts.push(s('path', { d: 'M-10,0 Q-13,-22 0,-44 Q13,-22 10,0Z', fill: ['#ff5a1f', '#ffb02e', '#ffd36b'][j % 3] }, g));
      return { F, g, parts };
    });
    // tiêu đề sơ đồ & giai đoạn
    h('div', { class: 'd-title' }, root, `<small>SƠ ĐỒ MINH HỌA</small>${esc(sc.title || '')}`);
    const phase = h('div', { class: 'd-phase' }, root);
    const gauge = sc.tide ? h('div', { class: 'tide' }, root, '<div class="tide-l">THỦY TRIỀU</div><div class="tide-bar"><i></i></div><div class="tide-s"></div>') : null;
    const legend = h('div', { class: 'd-legend' }, root, `<div><i class="ta"></i>${esc(sc.oursName || 'Quân ta')}</div><div><i class="dich"></i>${esc(sc.enemyName || 'Quân địch')}</div>`);
    function tideAt(f) {
      if (!sc.tide) return 1;
      let lv = sc.tide[0][1];
      for (let i = 1; i < sc.tide.length; i++) { const [fa, va] = sc.tide[i - 1], [fb, vb] = sc.tide[i]; if (f >= fa) lv = lerp(va, vb, ease(clamp((f - fa) / Math.max(.001, fb - fa)))); }
      if (f >= sc.tide[sc.tide.length - 1][0]) lv = sc.tide[sc.tide.length - 1][1];
      return lv;
    }
    function posAt(path, f) {
      if (f <= path[0][0]) return [path[0][1], path[0][2], 0];
      for (let i = 1; i < path.length; i++) {
        const a = path[i - 1], b = path[i];
        if (f <= b[0]) { const k = ease(clamp((f - a[0]) / Math.max(.0001, b[0] - a[0]))); return [lerp(a[1], b[1], k), lerp(a[2], b[2], k), Math.sign(b[1] - a[1])]; }
      }
      const z = path[path.length - 1]; return [z[1], z[2], 0];
    }
    const wr = rng(sc._i + 99); const waveSeeds = []; for (let i = 0; i < 50; i++) waveSeeds.push([wr() * W, wr() * H, wr() * 6]);
    return {
      root, update(t, d) {
        const f = clamp(t / d);
        const tide = tideAt(f);
        waters.forEach(w => { w.style.fill = `rgb(${lerp(58, 46, tide)},${lerp(88, 86, tide)},${lerp(108, 128, tide)})`; });
        stakes.forEach(st => { st.style.opacity = lerp(1, .18, tide); });
        if (gauge) {
          gauge.querySelector('i').style.height = (15 + tide * 80) + '%';
          gauge.querySelector('.tide-s').textContent = tide > .66 ? 'NƯỚC LÊN' : tide < .34 ? 'NƯỚC RÚT' : 'ĐANG RÚT';
        }
        (sc.forts || []).forEach(F => { F._g.style.opacity = F.at != null ? ramp(f, F.at, F.at + .05) : 1; if (F.fall != null && f > F.fall) F._g.classList.add('fallen'); else F._g.classList.remove('fallen'); });
        (sc.lines || []).forEach(Ln => { Ln._p.style.opacity = Ln.at != null ? ramp(f, Ln.at, Ln.at + .05) : 1; });
        if (bridge) {
          const k = ease(ramp(f, sc.bridge.fall, sc.bridge.fall + .05));
          sc.bridge._a.setAttribute('transform', `rotate(${k * 18} ${sc.bridge.at[0]} ${sc.bridge.at[1]})`);
          sc.bridge._b.setAttribute('transform', `rotate(${-k * 18} ${sc.bridge.at[2]} ${sc.bridge.at[3]})`);
          bridge.style.opacity = 1 - k * .6;
        }
        labs.forEach(({ L, e }) => e.style.opacity = L.at != null ? ramp(f, L.at, L.at + .05) : 1);
        arrows.forEach(A => {
          if (!A.L) A.L = A.p.getTotalLength();
          const a = A.A.at ?? 0, b = a + (A.A.len ?? .12);
          const k = eout(ramp(f, a, b));
          const out = A.A.until != null ? 1 - ramp(f, A.A.until, A.A.until + .05) : 1;
          A.p.style.strokeDasharray = `${A.L} ${A.L}`; A.p.style.strokeDashoffset = A.L * (1 - k);
          A.p.style.opacity = out; A.hd.style.opacity = k > .01 ? out : 0;
          const q = A.p.getPointAtLength(A.L * k), q0 = A.p.getPointAtLength(Math.max(0, A.L * k - 3));
          A.hd.setAttribute('transform', `translate(${q.x},${q.y}) rotate(${Math.atan2(q.y - q0.y, q.x - q0.x) * 180 / Math.PI})`);
        });
        units.forEach(({ U, g, members, lab }) => {
          const vis = (U.at != null ? ramp(f, U.at, U.at + .04) : 1) * (U.until != null ? 1 - ramp(f, U.until, U.until + .05) : 1);
          g.style.opacity = vis;
          members.forEach(M => {
            const [x, y, dir] = posAt(U.path, f - M.delay);
            const bob = U.kind === 'troop' || U.kind === 'horse' ? 0 : Math.sin(t * 2.2 + M.ph) * 3;
            const sink = U.sink != null ? ease(ramp(f, U.sink + M.delay * 2, U.sink + .12 + M.delay * 2)) : 0;
            const flip = (U.face ?? dir ?? 1) < 0 ? -1 : 1;
            M.m.setAttribute('transform', `translate(${x + M.ox},${y + M.oy + bob + sink * 14})`);
            M.inner.setAttribute('transform', `scale(${flip},1) rotate(${sink * 28})`);
            M.inner.style.opacity = 1 - sink * .75;
            const burn = U.burn != null ? ramp(f, U.burn + M.delay, U.burn + M.delay + .03) * (1 - ramp(f, .97, 1)) : 0;
            M.fire.setAttribute('opacity', burn);
            if (burn) M.fire.setAttribute('transform', `scale(${.9 + Math.sin(t * 13 + M.ph) * .15},${1 + Math.sin(t * 17 + M.ph) * .2})`);
          });
          if (lab) { const [x, y] = posAt(U.path, f); lab.setAttribute('x', x + (U.lx || 0)); lab.setAttribute('y', y + (U.ly ?? -62)); }
        });
        fx.forEach(({ F, g, parts }) => {
          const k = ramp(f, F.at, F.at + .03) * (1 - ramp(f, F.at + (F.len || .2), F.at + (F.len || .2) + .05));
          g.setAttribute('opacity', k);
          parts.forEach((p, j) => p.setAttribute('transform', `translate(${Math.sin(j * 2.3) * 40},${Math.cos(j * 1.7) * 14}) scale(${(.7 + .3 * Math.sin(t * 11 + j)) * (F.s || 1)})`));
        });
        // gợn sóng
        if (waters.length && !wavesG.childNodes.length) {
          waveSeeds.forEach(([x, y]) => { if (waters.some(w => w.isPointInFill && w.isPointInFill(new DOMPoint(x, y)))) s('path', { d: `M${x},${y} q12,-6 24,0 t24,0`, class: 'wave' }, wavesG); });
        }
        wavesG.style.transform = `translateX(${Math.sin(t * .8) * 8}px)`;
        // giai đoạn
        let ph = null; (sc.phases || []).forEach(P => { if (f >= P[0]) ph = P[1]; });
        if (ph !== phase._t) { phase._t = ph; phase.innerHTML = ph ? esc(ph) : ''; phase._s = t; }
        phase.style.opacity = ph ? eout(ramp(t - (phase._s || 0), 0, .4)) : 0;
        legend.style.opacity = ramp(t, .3, .8);
      }
    };
  };

  /* ======================================================================
     NHẠC NỀN – tổng hợp bằng WebAudio (trống trận, nền trầm, gảy ngũ cung)
     ====================================================================== */
  function scheduleMusic(ctx, dest, total, sceneStarts, offset = 0, style = '') {
    const master = ctx.createGain(); master.gain.value = 0; master.connect(dest);
    const t0 = ctx.currentTime;
    const at = x => t0 + x - offset;
    master.gain.setValueAtTime(0, at(Math.max(0, offset)));
    master.gain.linearRampToValueAtTime(.9, at(Math.max(offset + .01, 2)));
    master.gain.setValueAtTime(.9, at(Math.max(offset + .02, total - 3)));
    master.gain.linearRampToValueAtTime(0, at(total));
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); const rr = rng(42); for (let i = 0; i < nd.length; i++) nd[i] = rr() * 2 - 1;
    const live = x => x >= offset - .05;
    // nền trầm: Rê thứ ngũ cung (viễn tưởng: hợp âm mở; hoạt hình: Đô trưởng)
    const chords = style === 'vientuong' ? [[50, 57, 64], [46, 53, 60], [48, 55, 62], [43, 50, 57]]
      : style === 'hoathinh' ? [[60, 64, 67], [57, 60, 64], [53, 57, 60], [55, 59, 62]]
      : [[50, 57, 62], [48, 55, 60], [46, 53, 58], [45, 52, 57]];
    const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
    const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 520; lp.connect(master);
    for (let c = 0, x = 0; x < total; c++, x += 8) {
      if (!live(x + 8)) continue;
      chords[c % 4].forEach((m, j) => {
        [-6, 6].forEach(det => {
          const o = ctx.createOscillator(); o.type = 'sawtooth'; o.frequency.value = mtof(m - 12); o.detune.value = det;
          const g = ctx.createGain(); g.gain.value = 0;
          const st = Math.max(x, offset);
          g.gain.setValueAtTime(0, at(st)); g.gain.linearRampToValueAtTime(.022, at(st + 2.5)); g.gain.linearRampToValueAtTime(.022, at(x + 7)); g.gain.linearRampToValueAtTime(0, at(x + 8.6));
          o.connect(g); g.connect(lp); o.start(at(st)); o.stop(at(x + 8.7));
        });
      });
    }
    // trống trận
    const bpm = style === 'hoathinh' ? 108 : style === 'vientuong' ? 92 : 76, beat = 60 / bpm;
    const pattern = style === 'vientuong' ? [.7, 0, .25, 0, .5, 0, .25, 0] : style === 'hoathinh' ? [.5, 0, .3, .3, .5, 0, .3, 0] : [1, 0, .4, 0, .8, .3, .5, 0];
    for (let i = 0, x = 4; x < total - 2; i++, x += beat / 2) {
      const v = pattern[i % 8] * (x < 10 ? .5 : 1); if (!v || !live(x)) continue;
      const o = ctx.createOscillator(); o.type = 'sine';
      o.frequency.setValueAtTime(95, at(x)); o.frequency.exponentialRampToValueAtTime(42, at(x + .25));
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, at(x)); g.gain.exponentialRampToValueAtTime(.55 * v, at(x + .008)); g.gain.exponentialRampToValueAtTime(.001, at(x + .5));
      o.connect(g); g.connect(master); o.start(at(x)); o.stop(at(x + .55));
      if (v > .7 && !style) {
        const n = ctx.createBufferSource(); n.buffer = noiseBuf;
        const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 900; bp.Q.value = 1.2;
        const g2 = ctx.createGain(); g2.gain.setValueAtTime(.18 * v, at(x)); g2.gain.exponentialRampToValueAtTime(.001, at(x + .12));
        n.connect(bp); bp.connect(g2); g2.connect(master); n.start(at(x)); n.stop(at(x + .15));
      }
    }
    // đàn gảy ngũ cung (gợi đàn tranh)
    const penta = style === 'hoathinh' ? [72, 74, 76, 79, 81, 84] : style === 'vientuong' ? [62, 64, 69, 71, 74, 76] : [62, 65, 67, 69, 72, 74, 77];
    const pr = rng(7), step = style === 'vientuong' ? beat / 2 : beat, prob = style === 'vientuong' ? .7 : style === 'hoathinh' ? .55 : .42;
    for (let x = 6; x < total - 3; x += step) {
      if (pr() > prob || !live(x)) continue;
      const m = penta[Math.floor(pr() * penta.length)];
      const o = ctx.createOscillator(); o.type = style === 'hoathinh' ? 'sine' : 'triangle'; o.frequency.value = mtof(m);
      const g = ctx.createGain(); g.gain.setValueAtTime(.0001, at(x)); g.gain.exponentialRampToValueAtTime(.09, at(x + .01)); g.gain.exponentialRampToValueAtTime(.001, at(x + 1.6));
      o.connect(g); g.connect(master); o.start(at(x)); o.stop(at(x + 1.7));
    }
    // cồng chiêng khi sang cảnh lớn
    sceneStarts.forEach(x => {
      if (!live(x)) return;
      [55, 82.4, 110.7, 147].forEach((fq, j) => {
        const o = ctx.createOscillator(); o.type = 'sine'; o.frequency.value = fq * (1 + j * .003);
        const g = ctx.createGain(); g.gain.setValueAtTime(.0001, at(x)); g.gain.exponentialRampToValueAtTime(.16 / (j + 1), at(x + .02)); g.gain.exponentialRampToValueAtTime(.001, at(x + 5));
        o.connect(g); g.connect(master); o.start(at(x)); o.stop(at(x + 5.1));
      });
    });
    return master;
  }

  /* ======================================================================
     PLAYER
     ====================================================================== */
  function build(battle, stage, opts = {}) {
    stage.innerHTML = '';
    const durs = opts.durs || [];
    const scenes = battle.scenes.map((sc, i) => {
      sc._i = i + 1;
      const d = durs[i] || sceneDur(sc);
      return { sc, d };
    });
    let acc = 0; scenes.forEach(S => { S.start = acc; acc += S.d; });
    const total = acc;
    stage.classList.remove('st-tailieu', 'st-vientuong', 'st-hoathinh'); if (battle.style) stage.classList.add('st-' + battle.style);
    const layer = h('div', { class: 'layer' }, stage);
    const subs = h('div', { class: 'subs' }, stage);
    const grain = h('canvas', { class: 'grain', width: 384, height: 216 }, stage);
    const gctx = grain.getContext('2d');
    const gimg = gctx.createImageData(384, 216);
    const fade = h('div', { class: 'fade' }, stage);
    h('div', { class: 'vign' }, stage);
    const brand = h('div', { class: 'brand' }, stage, esc(battle.series || 'SỬ VIỆT · NHỮNG TRẬN ĐÁNH LỪNG DANH'));
    let cur = -1, inst = null;
    scenes.forEach(S => { S.chunks = chunks(S.sc.say); const L = S.chunks.reduce((a, c) => a + c.length, 0) || 1; let a = .25; S.cuts = S.chunks.map(c => { const st = a; a += (S.d - .6) * c.length / L; return [st, a, c]; }); });
    function seek(t) {
      t = clamp(t, 0, total - 1e-3);
      let i = scenes.findIndex(S => t < S.start + S.d); if (i < 0) i = scenes.length - 1;
      const S = scenes[i];
      if (i !== cur) {
        layer.innerHTML = '';
        inst = SCENES[S.sc.type](S.sc, battle);
        layer.appendChild(inst.root); cur = i;
      }
      const lt = t - S.start;
      inst.update(lt, S.d);
      const c = S.cuts.find(c => lt >= c[0] && lt < c[1] + .25) || null;
      const txt = c ? c[2] : '';
      if (subs._t !== txt) { subs._t = txt; subs.innerHTML = txt ? `<span>${esc(txt)}</span>` : ''; }
      const fi = 1 - ramp(lt, 0, .35), fo = ramp(lt, S.d - .3, S.d);
      fade.style.opacity = Math.max(i === 0 ? fi : fi * .9, i === scenes.length - 1 ? 0 : fo * .9);
      brand.style.opacity = ['title', 'map', 'diagram'].includes(S.sc.type) ? 0 : .75;
      // hạt phim
      const gk = Math.floor(t * 4) % 4;
      if (gk !== grain._k) {
        grain._k = gk; const r = rng(gk + 1); const dd = gimg.data;
        for (let p = 0; p < dd.length; p += 4) { const v = r() * 255; dd[p] = dd[p + 1] = dd[p + 2] = v; dd[p + 3] = 10; }
        gctx.putImageData(gimg, 0, 0);
      }
      return i;
    }
    const gongs = scenes.filter(S => ['title', 'map', 'diagram', 'end'].includes(S.sc.type) || S.sc.big).map(S => S.start + .05);
    return { scenes, total, seek, gongs, music: (ctx, dest, off) => scheduleMusic(ctx, dest, total, gongs, off, battle.style || '') };
  }

  /* xuất WAV nhạc nền (dùng khi render MP4) */
  async function renderAudio(film) {
    const sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * film.total), sr);
    film.music(ctx, ctx.destination, 0);
    const buf = await ctx.startRendering();
    const L = buf.getChannelData(0), R = buf.getChannelData(1), n = L.length;
    const ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
    const ws = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) { v.setInt16(o, clamp(L[i], -1, 1) * 32767, true); v.setInt16(o + 2, clamp(R[i], -1, 1) * 32767, true); }
    let bin = ''; const u8 = new Uint8Array(ab); for (let i = 0; i < u8.length; i += 32768) bin += String.fromCharCode.apply(null, u8.subarray(i, i + 32768));
    return btoa(bin);
  }

  window.Studio = { build, renderAudio, sceneDur, W, H };
})();
