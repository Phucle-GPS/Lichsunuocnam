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
     PHONG CÁCH HÌNH NỀN cho dự án tự tạo: tailieu | vientuong | hoathinh | cotich | langque | vutru
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
    if (style === 'cotich') {
      // CỔ TÍCH: đêm trăng rằm, cây đa, mái đình, đom đóm, mây ngũ sắc
      const defs = s('defs', null, svg);
      const sky = s('linearGradient', { id: 'ctk' + seed, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      [[0, '#1b1440'], [.45, '#4a2a6e'], [.75, '#b0557a'], [1, '#f2b46b']].forEach(([o, c]) => s('stop', { offset: o, 'stop-color': c }, sky));
      s('rect', { width: W, height: H, fill: `url(#ctk${seed})` }, svg);
      const glow = s('radialGradient', { id: 'ctm' + seed }, defs);
      s('stop', { offset: 0, 'stop-color': '#fff6d8', 'stop-opacity': .9 }, glow); s('stop', { offset: 1, 'stop-color': '#fff6d8', 'stop-opacity': 0 }, glow);
      const halo = s('circle', { cx: 1380, cy: 230, r: 330, fill: `url(#ctm${seed})` }, svg);
      s('circle', { cx: 1380, cy: 230, r: 120, fill: '#fff3c9' }, svg);
      [[1340, 200, 22], [1420, 260, 16], [1395, 190, 10]].forEach(([x, y, rr]) => s('circle', { cx: x, cy: y, r: rr, fill: '#e8d9a8', opacity: .6 }, svg));
      const stars = [];
      for (let i = 0; i < 120; i++) stars.push([s('path', { d: 'M0,-6 L1.6,-1.6 6,0 1.6,1.6 0,6 -1.6,1.6 -6,0 -1.6,-1.6Z', fill: '#fff4cc', transform: `translate(${r() * W},${r() * H * .55}) scale(${.4 + r() * .9})` }, svg), r() * 6]);
      const clouds = [];
      for (let i = 0; i < 4; i++) {
        const g = s('g', { opacity: .55 }, svg), y = 120 + r() * 300, c = ['#f7b2d0', '#b6a4ff', '#ffd59a', '#9fe0e0'][i];
        s('path', { d: 'M0,0 q60,-50 120,0 q50,-40 100,0 q40,-30 80,10 q-150,30 -300,-10Z', fill: c }, g);
        s('path', { d: 'M20,4 q40,-30 80,0', fill: 'none', stroke: '#fff', 'stroke-width': 3, opacity: .7 }, g);
        clouds.push([g, r() * W, y, 6 + r() * 10, 1 + r() * .8]);
      }
      let d = `M0,${H} L0,700`; for (let x = 0; x <= W; x += 160) d += ` Q${x + 80},${600 + r() * 60} ${x + 160},${690 + r() * 30}`;
      s('path', { d: d + ` L${W},${H}Z`, fill: '#3b2453', opacity: .85 }, svg);
      const ink = '#140c22';
      s('path', { d: `M0,${H} L0,840 Q480,800 960,830 T${W},820 L${W},${H}Z`, fill: ink }, svg);
      // cây đa
      const tree = s('g', { transform: 'translate(300,840)', fill: ink }, svg);
      s('path', { d: 'M-40,0 Q-30,-160 -70,-260 L-20,-250 Q10,-180 0,-120 Q20,-200 70,-260 L100,-240 Q40,-160 50,0Z' }, tree);
      [[-180, -330, 170, 90], [40, -380, 200, 110], [230, -310, 150, 80], [-40, -470, 170, 90], [-260, -260, 120, 60]].forEach(([x, y, rx, ry]) => s('ellipse', { cx: x, cy: y, rx, ry }, tree));
      for (let i = 0; i < 16; i++) { const x = -300 + i * 38 + r() * 20; s('path', { d: `M${x},-270 Q${x + 6},-140 ${x - 4},${-40 - r() * 80}`, stroke: ink, 'stroke-width': 3, fill: 'none' }, tree); }
      // mái đình
      const dinh = s('g', { transform: 'translate(1500,830)', fill: ink }, svg);
      s('path', { d: 'M-260,-120 Q-300,-150 -320,-190 Q-280,-170 -230,-170 L230,-170 Q280,-170 320,-190 Q300,-150 260,-120Z' }, dinh);
      s('path', { d: 'M-170,-170 Q-200,-200 -215,-235 Q-180,-220 -150,-220 L150,-220 Q180,-220 215,-235 Q200,-200 170,-170Z' }, dinh);
      [-200, -100, 0, 100, 200].forEach(x => s('rect', { x: x - 10, y: -120, width: 20, height: 120 }, dinh));
      s('rect', { x: -250, y: -12, width: 500, height: 14 }, dinh);
      [-150, 0, 150].forEach(x => s('rect', { x: x - 30, y: -100, width: 60, height: 70, fill: '#ffcf70', opacity: .55 }, dinh));
      const flies = [];
      for (let i = 0; i < 40; i++) flies.push([s('circle', { r: 3 + r() * 3, fill: '#fff59a' }, svg), r() * W, 520 + r() * 420, r() * 6, 20 + r() * 50]);
      return { update(t) {
        stars.forEach(([p, ph]) => p.setAttribute('opacity', .35 + .65 * Math.abs(Math.sin(t * 1.3 + ph))));
        halo.setAttribute('r', 320 + Math.sin(t * .8) * 18);
        clouds.forEach(([g, x, y, v, k]) => g.setAttribute('transform', `translate(${((x + t * v) % (W + 400)) - 300},${y}) scale(${k})`));
        flies.forEach(([c, x, y, ph, a]) => { c.setAttribute('cx', x + Math.sin(t * .6 + ph) * a); c.setAttribute('cy', y + Math.cos(t * .9 + ph * 2) * a * .6); c.setAttribute('opacity', .25 + .75 * Math.abs(Math.sin(t * 2 + ph))); });
      } };
    }
    if (style === 'langque') {
      // LÀNG QUÊ: bình minh, lũy tre, ruộng lúa, dòng sông con đò, cánh diều, cò bay
      const defs = s('defs', null, svg);
      const sky = s('linearGradient', { id: 'lqs' + seed, x1: 0, y1: 0, x2: 0, y2: 1 }, defs);
      [[0, '#8fc9e8'], [.45, '#f9dca6'], [.62, '#ffe9c2']].forEach(([o, c]) => s('stop', { offset: o, 'stop-color': c }, sky));
      s('rect', { width: W, height: H, fill: `url(#lqs${seed})` }, svg);
      s('circle', { cx: 1450, cy: 470, r: 95, fill: '#ffb347', opacity: .9 }, svg);
      s('circle', { cx: 1450, cy: 470, r: 150, fill: '#ffd58a', opacity: .3 }, svg);
      let hill = `M0,${H} L0,560`; for (let x = 0; x <= W; x += 320) hill += ` Q${x + 160},${470 + r() * 50} ${x + 320},${545 + r() * 20}`;
      s('path', { d: hill + ` L${W},${H}Z`, fill: '#8fb3a6', opacity: .7 }, svg);
      // lũy tre
      const tre = s('g', { stroke: '#3f6b2e', fill: 'none', 'stroke-linecap': 'round' }, svg);
      for (let x = -20; x < W + 20; x += 18 + r() * 22) {
        if (x > 1250 && x < 1650 && r() < .7) continue;
        const hgt = 120 + r() * 120, bend = (r() - .5) * 70;
        s('path', { d: `M${x},610 Q${x + bend * .3},${610 - hgt * .6} ${x + bend},${610 - hgt}`, 'stroke-width': 4 }, tre);
        for (let k = 0; k < 4; k++) { const yy = 610 - hgt * (.45 + k * .15), xx = x + bend * (.3 + k * .2); s('path', { d: `M${xx},${yy} l${r() < .5 ? 26 : -26},${8 + r() * 10}`, 'stroke-width': 6, stroke: '#4f8a38' }, tre); }
      }
      s('rect', { x: 0, y: 600, width: W, height: 20, fill: '#557a35' }, svg);
      // ruộng lúa
      const field = s('g', null, svg);
      [['#9ccc4f', 620, 700], ['#86bb3e', 700, 800], ['#c9c34a', 800, 900]].forEach(([c, y1, y2]) => s('rect', { x: 0, y: y1, width: W, height: y2 - y1, fill: c }, field));
      const rice = s('g', { stroke: '#5f8f2a', 'stroke-width': 3 }, svg), stalks = [];
      for (let i = 0; i < 160; i++) { const x = r() * W, y = 640 + r() * 260, l = 10 + (y - 620) * .08; stalks.push([s('line', { x1: x, y1: y, x2: x, y2: y - l }, rice), x, y, l, r() * 6]); }
      // dòng sông
      s('path', { d: `M0,900 Q480,870 960,900 T${W},890 L${W},${H} L0,${H}Z`, fill: '#6fa3b8' }, svg);
      const waves = []; for (let i = 0; i < 26; i++) waves.push([s('path', { d: 'M0,0 q20,-6 40,0', stroke: '#e6f4f8', 'stroke-width': 3, fill: 'none', opacity: .7 }, svg), r() * W, 930 + r() * 130, 10 + r() * 20]);
      const boat = s('g', null, svg);
      s('path', { d: 'M-110,0 Q0,40 110,0 L80,-10 L-80,-10Z', fill: '#5a3a1e' }, boat);
      s('path', { d: 'M-40,-12 Q0,-60 40,-12Z', fill: '#7a5a34' }, boat);
      s('line', { x1: 70, y1: -10, x2: 75, y2: -70, stroke: '#2b2118', 'stroke-width': 5 }, boat);
      s('path', { d: 'M75,-70 l-24,14 l48,0Z', fill: '#e8d28a' }, boat);
      s('line', { x1: 75, y1: -50, x2: 140, y2: 40, stroke: '#2b2118', 'stroke-width': 4 }, boat);
      // cánh diều
      const kite = s('g', null, svg), str = s('path', { stroke: '#4a3a2a', 'stroke-width': 2, fill: 'none', opacity: .7 }, svg);
      s('path', { d: 'M0,-60 L40,0 L0,70 L-40,0Z', fill: '#e2473b', stroke: '#7a1e17', 'stroke-width': 3 }, kite);
      s('path', { d: 'M0,-60 L0,70 M-40,0 L40,0', stroke: '#7a1e17', 'stroke-width': 2 }, kite);
      const tail = s('path', { stroke: '#f5c542', 'stroke-width': 5, fill: 'none' }, kite);
      // cò bay
      const birds = []; for (let i = 0; i < 5; i++) birds.push([s('path', { fill: 'none', stroke: '#fff', 'stroke-width': 5, 'stroke-linecap': 'round' }, svg), r() * W, 160 + r() * 200, 30 + r() * 20, r() * 6]);
      return { update(t) {
        stalks.forEach(([l, x, y, len, ph]) => { const sw = Math.sin(t * 1.5 + ph + x * .01) * len * .35; l.setAttribute('x2', x + sw); });
        waves.forEach(([p, x, y, v]) => p.setAttribute('transform', `translate(${((x + t * v) % (W + 80)) - 40},${y})`));
        boat.setAttribute('transform', `translate(${((300 + t * 22) % (W + 300)) - 150},${985 + Math.sin(t * 1.4) * 5}) rotate(${Math.sin(t * 1.2) * 2})`);
        const kx = 560 + Math.sin(t * .5) * 50, ky = 230 + Math.sin(t * .8) * 30;
        kite.setAttribute('transform', `translate(${kx},${ky}) rotate(${Math.sin(t * 1.1) * 10})`);
        tail.setAttribute('d', `M0,70 q${Math.sin(t * 3) * 20},40 0,80 q${-Math.sin(t * 3) * 20},40 0,80`);
        str.setAttribute('d', `M${kx},${ky + 40} Q${kx + 200},${ky + 300} 980,640`);
        birds.forEach(([p, x, y, v, ph]) => { const f = Math.sin(t * 6 + ph) * 14; p.setAttribute('d', `M-24,${-f} Q-12,${-f * .3 - 6} 0,0 Q12,${-f * .3 - 6} 24,${-f}`); p.setAttribute('transform', `translate(${((x + t * v) % (W + 100)) - 50},${y + Math.sin(t + ph) * 10})`); });
      } };
    }
    if (style === 'vutru') {
      // VŨ TRỤ: dải ngân hà, thiên hà xoắn ốc, Trái Đất, sao chổi
      const defs = s('defs', null, svg);
      const bgg = s('radialGradient', { id: 'vtb' + seed, cx: '30%', cy: '40%', r: '90%' }, defs);
      [[0, '#13224a'], [.5, '#070c1f'], [1, '#010208']].forEach(([o, c]) => s('stop', { offset: o, 'stop-color': c }, bgg));
      s('rect', { width: W, height: H, fill: `url(#vtb${seed})` }, svg);
      const bl = s('filter', { id: 'vbl' + seed, x: '-50%', y: '-50%', width: '200%', height: '200%' }, defs); s('feGaussianBlur', { stdDeviation: 40 }, bl);
      const mw = s('g', { transform: 'rotate(-24 960 540)' }, svg);
      s('ellipse', { cx: 960, cy: 520, rx: 1300, ry: 120, fill: '#3d4f8f', opacity: .5, filter: `url(#vbl${seed})` }, mw);
      s('ellipse', { cx: 960, cy: 520, rx: 900, ry: 50, fill: '#c9b8e8', opacity: .25, filter: `url(#vbl${seed})` }, mw);
      for (let i = 0; i < 500; i++) { const x = -300 + r() * 2500, y = 520 + (r() + r() + r() - 1.5) * 140; s('circle', { cx: x, cy: y, r: r() * 1.5 + .3, fill: '#fff', opacity: .3 + r() * .6 }, mw); }
      const stars = []; for (let i = 0; i < 180; i++) stars.push([s('circle', { cx: r() * W, cy: r() * H, r: r() < .08 ? 2.6 : .8 + r() * 1.2, fill: ['#fff', '#cfe0ff', '#ffe6c4'][i % 3] }, svg), r() * 6]);
      const gal = s('g', null, svg), garm = s('g', null, gal);
      const gc = s('radialGradient', { id: 'vtg' + seed }, defs); s('stop', { offset: 0, 'stop-color': '#fff4dc', 'stop-opacity': .95 }, gc); s('stop', { offset: 1, 'stop-color': '#bcd2ff', 'stop-opacity': 0 }, gc);
      s('ellipse', { rx: 80, ry: 44, fill: `url(#vtg${seed})` }, gal);
      for (let a = 0; a < 2; a++) for (let i = 0; i < 160; i++) { const th = i / 160 * 4.2, rr = 8 * Math.exp(.42 * th) + r() * 10, ang = th + a * Math.PI; s('circle', { cx: Math.cos(ang) * rr, cy: Math.sin(ang) * rr * .45, r: 1 + r() * 1.6, fill: i % 4 ? '#bcd2ff' : '#ffd7f0', opacity: .75 }, garm); }
      // Trái Đất
      const eg = s('radialGradient', { id: 'vte' + seed, cx: '35%', cy: '35%', r: '75%' }, defs);
      [[0, '#7fc8ff'], [.45, '#2a6fc2'], [.85, '#0b2a63'], [1, '#04102a']].forEach(([o, c]) => s('stop', { offset: o, 'stop-color': c }, eg));
      const clip = s('clipPath', { id: 'vtc' + seed }, defs); s('circle', { cx: 1600, cy: 1020, r: 520 }, clip);
      s('circle', { cx: 1600, cy: 1020, r: 540, fill: '#5fb0ff', opacity: .25, filter: `url(#vbl${seed})` }, svg);
      s('circle', { cx: 1600, cy: 1020, r: 520, fill: `url(#vte${seed})` }, svg);
      const land = s('g', { 'clip-path': `url(#vtc${seed})` }, svg), lands = s('g', null, land);
      for (let k = 0; k < 2; k++) [[1250, 760, 160, 70], [1480, 680, 120, 50], [1700, 820, 200, 80], [1900, 700, 110, 60], [1420, 900, 140, 60]].forEach(([x, y, rx, ry]) => s('ellipse', { cx: x + k * 1100, cy: y, rx, ry, fill: '#3f8f4f', opacity: .8 }, lands));
      const cl = s('g', { opacity: .55 }, land);
      for (let k = 0; k < 2; k++) for (let i = 0; i < 8; i++) s('path', { d: `M${1100 + k * 1100 + i * 140},${640 + (i % 3) * 90} q60,-30 140,0`, stroke: '#fff', 'stroke-width': 14, 'stroke-linecap': 'round', fill: 'none' }, cl);
      s('circle', { cx: 1600, cy: 1020, r: 520, fill: 'none', stroke: '#9fd4ff', 'stroke-width': 6, opacity: .6 }, svg);
      s('circle', { cx: 380, cy: 260, r: 46, fill: '#d8d2c4' }, svg); s('circle', { cx: 395, cy: 250, r: 46, fill: '#070c1f', opacity: .55 }, svg);
      const comet = s('g', null, svg);
      const cg = s('linearGradient', { id: 'vtk' + seed, x1: 0, y1: 0, x2: 1, y2: 0 }, defs);
      s('stop', { offset: 0, 'stop-color': '#fff', 'stop-opacity': 0 }, cg); s('stop', { offset: 1, 'stop-color': '#dff3ff', 'stop-opacity': .95 }, cg);
      s('path', { d: 'M-320,-6 L0,-3 L0,3 L-320,6Z', fill: `url(#vtk${seed})` }, comet); s('circle', { r: 6, fill: '#fff' }, comet);
      return { update(t) {
        stars.forEach(([c, ph]) => c.setAttribute('opacity', .4 + .6 * Math.abs(Math.sin(t * 1.1 + ph))));
        gal.setAttribute('transform', `translate(1000,230) rotate(-18)`); garm.setAttribute('transform', `rotate(${t * 4})`);
        lands.setAttribute('transform', `translate(${-((t * 14) % 1100)},0)`); cl.setAttribute('transform', `translate(${-((t * 22) % 1100)},0)`);
        const p = (t % 9) / 9; comet.setAttribute('transform', `translate(${-200 + p * 2400},${80 + p * 520}) rotate(12)`); comet.setAttribute('opacity', Math.sin(p * Math.PI));
      } };
    }
    paintedBG(svg, seed, opts);
    return { update() {} };
  }


  /* ---------- biểu tượng người lính (nhìn nghiêng, quay sang phải; gốc tọa độ ở chân) ---------- */
  function drawSoldier(g, side, y0) {
    const G = s('g', { transform: `translate(0,${y0 || 0})` }, g);
    s('line', { x1: 10, y1: 4, x2: 10, y2: -52, class: 'u-shaft' }, G);
    s('path', { d: 'M7,-52 L10,-63 L13,-52 Z', class: 'u-tip' }, G);
    s('path', { d: 'M-5,0 L-3,-14 M3,-14 L6,0', class: 'u-leg' }, G);
    s('path', { d: 'M-7,-13 L-6,-30 Q0,-33 6,-30 L7,-13 Z', class: 'u-body ' + side }, G);
    s('line', { x1: -7, y1: -17, x2: 7, y2: -17, class: 'u-belt' }, G);
    s('line', { x1: 3, y1: -26, x2: 10, y2: -21, class: 'u-leg' }, G);
    s('circle', { cx: 0, cy: -36, r: 5, class: 'u-skin' }, G);
    if (side === 'ta') {
      s('path', { d: 'M-12,-37 L0,-48 L12,-37 Z', class: 'u-hat' }, G);
      s('ellipse', { cx: -7, cy: -21, rx: 6.5, ry: 8.5, class: 'u-shield ta' }, G);
      s('circle', { cx: -7, cy: -21, r: 2, class: 'u-boss' }, G);
    } else {
      s('path', { d: 'M-6.5,-37 Q0,-47 6.5,-37 Z', class: 'u-helm' }, G);
      s('line', { x1: 0, y1: -45, x2: -2, y2: -52, class: 'u-plume' }, G);
      s('rect', { x: -13, y: -30, width: 8, height: 17, rx: 1.5, class: 'u-shield dich' }, G);
    }
  }
  function drawHorse(g, side) {
    s('path', { d: 'M-14,0 L-12,-12 M-6,0 L-6,-12 M8,0 L7,-12 M14,0 L12,-12', class: 'u-leg' }, g);
    s('path', { d: 'M-17,-14 Q-18,-24 -6,-25 L9,-25 Q15,-25 17,-30 L22,-40 L29,-37 L26,-31 L19,-20 Q16,-12 8,-12 L-12,-12 Q-17,-12 -17,-14 Z', class: 'u-horse' }, g);
    s('path', { d: 'M-17,-20 Q-25,-16 -24,-6', class: 'u-tail' }, g);
    drawSoldier(g, side, -18);
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
        ? h('video', { class: 'card-media' + (sc.full ? ' full' : ''), src: sc.media.url, muted: '', playsinline: '', preload: 'auto' }, root)
        : h('img', { class: 'card-media' + (sc.full ? ' full' : ''), src: sc.media.url }, root);
      if (media.tagName === 'VIDEO') media.muted = true;
    }
    h('div', { class: 'shade card-shade' + (media ? ' has-media' : '') + (media && sc.full ? ' full' : '') }, root);
    const box = h('div', { class: 'card-box' }, root);
    const kick = sc.kicker ? h('div', { class: 'card-kick' }, box, esc(sc.kicker)) : null;
    const head = sc.heading ? h('div', { class: 'card-head' }, box, esc(sc.heading)) : null;
    const bar = h('div', { class: 'card-bar' }, box);
    let pull = (sc.pull != null ? sc.pull : (sc.say || '').split(/(?<=[.!?…])\s+/)[0] || '');
    if (pull.length > 110) pull = pull.slice(0, 107).replace(/\s+\S*$/, '') + '…';
    const pw = (sc.heading && !sc.pull) || (media && sc.full) ? [] : pull.split(' ').map(w => h('span', null, null, esc(w) + ' '));
    const pd = pw.length ? h('div', { class: 'card-pull' }, box) : null;
    // ảnh tư liệu: chú thích + nguồn/giấy phép (bắt buộc với ảnh CC BY / CC BY-SA)
    const cap = sc.caption ? h('div', { class: 'doc-cap' }, root, esc(sc.caption)) : null;
    if (sc.credit) h('div', { class: 'doc-credit' }, root, esc(sc.credit));
    pw.forEach(w => pd.appendChild(w));
    return {
      root, update(t, d) {
        bg.style.transform = `scale(${1.05 + t / d * .07})`; bgu.update(t);
        if (media) {
          media.style.transform = sc.full && media.tagName === 'VIDEO' ? '' : `scale(${1.04 + t / d * .1}) translate(${-t * 3}px,${-t * 1.5}px)`;
          media.style.opacity = eout(ramp(t, 0, .6));
          if (media.tagName === 'VIDEO' && media.readyState >= 1 && media.duration) {
            const want = t % media.duration;
            if (Math.abs(media.currentTime - want) > .3) media.currentTime = want;
          }
        }
        if (kick) kick.style.opacity = eout(ramp(t, .2, .7));
        if (cap) { const k = eout(ramp(t, .4, 1)); cap.style.opacity = k; cap.style.transform = `translateY(${(1 - k) * 16}px)`; }
        if (head) { const k = eout(ramp(t, .35, 1)); head.style.opacity = k; head.style.transform = `translateY(${(1 - k) * 30}px)`; }
        bar.style.width = eout(ramp(t, .8, 1.6)) * 260 + 'px';
        if (pd) { const k = eout(ramp(t, .8, 1.2)); pd.style.opacity = k; pd.style.transform = `scale(${.92 + k * .08})`; pd.style.transformOrigin = '0 50%'; }
        pw.forEach((w, i) => { const a = 1 + i * .09; w.style.opacity = eout(ramp(t, a, a + .4)); });
      }
    };
  };



  /* ----- NGƯỜI QUE HÀNH ĐỘNG (phim hoạt hình người que, đề tài lịch sử) -----
     Quân ta: nón lá, dải đỏ · Quân giặc: mũ trụ có chùm lông · Vũ khí: kiếm, giáo, cung, cờ.
     Khớp xương tính hoàn toàn từ t ⇒ tua/xuất từng khung chính xác. */
  const STICK_ACTS = { noi: 'Kể chuyện / thuyết trình', di: 'Đi bộ', chay: 'Chạy', danh: 'Giao chiến (kiếm – giáo)', hanhquan: 'Đoàn quân hành quân', cheo: 'Chèo thuyền chiến', ban: 'Bắn cung', cuoingua: 'Cưỡi ngựa xung trận', phatco: 'Chỉ huy phất cờ', vui: 'Ăn mừng chiến thắng', nghi: 'Suy nghĩ' };
  const TA = '#c8352b', GIAC = '#3a6fb0';
  /* Nhân vật kiểu A5 Historical Cartoon (skill directing-stickman-videos): đầu tròn trắng có mặt, cổ ngắn liền,
     áo có màu theo phe, tay chân nét đen mảnh có viền sáng (nổi trên nền tối), bàn tay đen hình găng không ngón. */
  const OUT = '#1d1a16', SKIN = '#fbf6ea';
  const ROLE = {
    ta: { tunic: '#6e4d2f', tunic2: '#4f3622', sash: '#c8352b', trim: '#d9b66a' },
    giac: { tunic: '#454c58', tunic2: '#2f343d', sash: '#7a8494', trim: '#a9b1bd' },
    tuong: { tunic: '#9e2a22', tunic2: '#6f1c16', sash: '#d9a441', trim: '#e8c46a' }
  };
  function stickFig(parent, ink, accent, o = {}) {
    const R = ROLE[o.side === 'giac' ? 'giac' : o.hat === 'khan' ? 'tuong' : 'ta'];
    const outer = s('g', null, parent), g = s('g', { 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, outer);
    const limb = (cloth) => { const h = s('polyline', { fill: 'none', stroke: '#e8d9b8', 'stroke-width': 11, opacity: .3 }, g), l = s('polyline', { fill: 'none', stroke: OUT, 'stroke-width': 8 }, g); const c = cloth ? [s('polyline', { fill: 'none', stroke: OUT, 'stroke-width': 21 }, g), s('polyline', { fill: 'none', stroke: cloth, 'stroke-width': 15 }, g)] : null; return (p, cp) => { h.setAttribute('points', p); l.setAttribute('points', p); if (c) c.forEach(e => e.setAttribute('points', cp)); }; };
    const hand = () => s('ellipse', { rx: 10, ry: 8.5, fill: SKIN, stroke: OUT, 'stroke-width': 3 }, g);
    const foot = () => s('ellipse', { rx: 14, ry: 7, fill: '#2a211a' }, g);
    const la = limb(R.tunic2), lh = hand(), ll = limb(R.tunic2), lf = foot(), rl = limb(R.tunic2), rf = foot();
    const tunic = s('path', { fill: R.tunic, stroke: OUT, 'stroke-width': 4 }, g), fold = s('path', { fill: 'none', stroke: R.tunic2, 'stroke-width': 5, opacity: .8 }, g);
    const sash = s('path', { fill: 'none', stroke: R.sash, 'stroke-width': 9 }, g), plates = R === ROLE.tuong || o.side === 'giac' ? s('path', { fill: 'none', stroke: R.trim, 'stroke-width': 3, opacity: .9 }, g) : null;
    const neck = s('path', { fill: SKIN, stroke: OUT, 'stroke-width': 3 }, g);
    const head = s('circle', { r: 30, fill: SKIN, stroke: OUT, 'stroke-width': 4 }, g);
    const face = s('g', null, g);
    const eyes = [0, 1].map(() => s('ellipse', { rx: 3.6, ry: 6.5, fill: OUT }, face)), brows = [0, 1].map(() => s('path', { fill: 'none', stroke: OUT, 'stroke-width': 3.2 }, face));
    const blush = s('circle', { r: 6, fill: '#e98a7a', opacity: .35 }, face), mouth = s('path', { fill: 'none', stroke: OUT, 'stroke-width': 3 }, face);
    const beard = R === ROLE.tuong ? s('path', { fill: '#2a211a', stroke: OUT, 'stroke-width': 2 }, face) : null;
    const hat = s('g', null, g), ra = limb(R.tunic), rh = hand(), wpn = s('g', null, g);
    if (o.hat === 'non') { s('path', { d: 'M-52,2 L0,-48 L52,2 Q0,12 -52,2Z', fill: '#e2c27a', stroke: OUT, 'stroke-width': 4 }, hat); s('path', { d: 'M-26,-22 L0,-46 M-8,-6 L0,-46 M14,-6 L0,-46 M30,-20 L0,-46', stroke: '#b08a4a', 'stroke-width': 2, fill: 'none' }, hat); }
    else if (o.hat === 'mu') { s('path', { d: 'M-34,2 A34,36 0 0 1 34,2 L40,9 L-40,9Z', fill: '#7d838e', stroke: OUT, 'stroke-width': 4 }, hat); s('path', { d: 'M-34,0 L34,0', stroke: '#c9ced6', 'stroke-width': 3 }, hat); s('path', { d: 'M0,-34 q-10,-30 12,-48 q2,26 -6,48Z', fill: accent, stroke: OUT, 'stroke-width': 2 }, hat); }
    else if (o.hat === 'khan') { s('path', { d: 'M-32,2 Q-30,-22 0,-26 Q30,-22 32,2 Q0,-6 -32,2Z', fill: '#2a211a', stroke: OUT, 'stroke-width': 3 }, hat); s('path', { d: 'M-32,2 Q0,-8 32,2', stroke: R.sash, 'stroke-width': 5, fill: 'none' }, hat); }
    else s('path', { d: 'M-30,-4 Q0,-12 30,-4', stroke: accent, 'stroke-width': 8, fill: 'none' }, hat);
    const W_ = { kiem: () => { s('line', { x1: 0, y1: 0, x2: 0, y2: -112, stroke: '#e6ebf2', 'stroke-width': 8 }, wpn); s('line', { x1: 0, y1: -8, x2: 0, y2: -112, stroke: '#9aa3ad', 'stroke-width': 2 }, wpn); s('line', { x1: -18, y1: -8, x2: 18, y2: -8, stroke: '#d9a441', 'stroke-width': 8 }, wpn); s('line', { x1: 0, y1: 0, x2: 0, y2: 16, stroke: '#5a3a1e', 'stroke-width': 8 }, wpn); },
      giao: () => { s('line', { x1: 0, y1: 90, x2: 0, y2: -190, stroke: '#8a5a2b', 'stroke-width': 7 }, wpn); s('path', { d: 'M0,-190 L-10,-160 L0,-228 L10,-160Z', fill: '#e6ebf2', stroke: OUT, 'stroke-width': 3 }, wpn); s('path', { d: 'M-6,-160 q-16,10 -8,26 M6,-160 q14,10 6,24', stroke: accent, 'stroke-width': 5, fill: 'none' }, wpn); },
      cung: () => { s('path', { d: 'M0,-82 Q50,0 0,82', stroke: '#8a5a2b', 'stroke-width': 7, fill: 'none' }, wpn); },
      co: () => { s('line', { x1: 0, y1: 60, x2: 0, y2: -262, stroke: '#5a3a1e', 'stroke-width': 7 }, wpn); s('circle', { cx: 0, cy: -266, r: 6, fill: '#d9a441' }, wpn); wpn._flag = s('path', { fill: accent, stroke: OUT, 'stroke-width': 3 }, wpn); wpn._trim = s('path', { fill: 'none', stroke: '#d9a441', 'stroke-width': 4 }, wpn); } };
    if (o.weapon && W_[o.weapon]) W_[o.weapon]();
    const string = o.weapon === 'cung' ? s('polyline', { fill: 'none', stroke: '#efe4cc', 'stroke-width': 2.5 }, g) : null;
    return function draw(x, y, dir, p, k = 1, t = 0) {
      outer.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
      const pt = (ox, oy, a, L) => [ox + dir * Math.sin(a) * L, oy + Math.cos(a) * L];
      const neckP = [dir * Math.sin(p.lean) * 118, -Math.cos(p.lean) * 118];
      const hc = [neckP[0] + dir * Math.sin(p.lean) * 40, neckP[1] - Math.cos(p.lean) * 40];
      const sh = [neckP[0] - dir * Math.sin(p.lean) * 4, neckP[1] + 10];
      const L = (o2, a1, a2, len) => { const e = pt(o2[0], o2[1], a1, len), h2 = pt(e[0], e[1], a2, len); return [e, h2, `${o2[0]},${o2[1]} ${e[0]},${e[1]} ${h2[0]},${h2[1]}`]; };
      const A1 = L(sh, p.la[0], p.la[1], 60), A2 = L(sh, p.ra[0], p.ra[1], 60), G1 = L([0, 0], p.ll[0], p.ll[1], 70), G2 = L([0, 0], p.rl[0], p.rl[1], 70);
      // tay áo / ống quần phủ gần hết chi, chỉ lộ bàn tay & bàn chân
      const part = (o2, X, f) => `${o2[0]},${o2[1]} ${X[0][0]},${X[0][1]} ${X[0][0] + (X[1][0] - X[0][0]) * f},${X[0][1] + (X[1][1] - X[0][1]) * f}`;
      la(A1[2], part(sh, A1, .72)); ra(A2[2], part(sh, A2, .72)); ll(G1[2], part([0, 0], G1, .8)); rl(G2[2], part([0, 0], G2, .8));
      lh.setAttribute('cx', A1[1][0]); lh.setAttribute('cy', A1[1][1]); rh.setAttribute('cx', A2[1][0]); rh.setAttribute('cy', A2[1][1]);
      lf.setAttribute('cx', G1[1][0] + dir * 6); lf.setAttribute('cy', G1[1][1] + 2); rf.setAttribute('cx', G2[1][0] + dir * 6); rf.setAttribute('cy', G2[1][1] + 2);
      // áo: từ vai xuống quá hông thành vạt
      const ux = -neckP[0] / 118, uy = -neckP[1] / 118, nx = -uy, ny = ux, hem = [ux * 30, uy * 30];
      const P2 = (b, w) => `${b[0] + nx * w},${b[1] + ny * w}`;
      const sw = 24, hw = 36, at = f => [neckP[0] * f, neckP[1] * f], top = at(1.06), shl = at(.9), wst = at(.4);
      tunic.setAttribute('d', `M${P2(top, 10)} Q${P2(top, sw + 4)} ${P2(shl, sw + 2)} Q${P2(wst, sw - 4)} ${P2(hem, hw)} Q${P2([hem[0] * 1.15, hem[1] * 1.15], 0)} ${P2(hem, -hw)} Q${P2(wst, -sw + 4)} ${P2(shl, -sw - 2)} Q${P2(top, -sw - 4)} ${P2(top, -10)} Q${P2(at(.98), 0)} ${P2(top, 10)}Z`);
      fold.setAttribute('d', `M${P2([neckP[0] * .35, neckP[1] * .35], 6)} L${P2(hem, 8)}`);
      const sp = [neckP[0] * .3, neckP[1] * .3]; sash.setAttribute('d', `M${P2(sp, sw + 4)} L${P2(sp, -sw - 4)}`);
      if (plates) plates.setAttribute('d', [.55, .7, .85].map(f => `M${P2([neckP[0] * f, neckP[1] * f], sw - 2)} L${P2([neckP[0] * f, neckP[1] * f], -sw + 2)}`).join(' '));
      neck.setAttribute('d', `M${neckP[0] - 8},${neckP[1] + 4} L${hc[0] - 9},${hc[1] + 20} L${hc[0] + 9},${hc[1] + 20} L${neckP[0] + 8},${neckP[1] + 4}Z`);
      head.setAttribute('cx', hc[0]); head.setAttribute('cy', hc[1]);
      const fx = hc[0] + dir * 8, fy = hc[1];
      eyes[0].setAttribute('cx', fx - dir * 7); eyes[1].setAttribute('cx', fx + dir * 9); eyes.forEach(e => e.setAttribute('cy', fy - 1));
      const ang = p.brow || 0; brows[0].setAttribute('d', `M${fx - dir * 13},${fy - 13 - ang} L${fx - dir * 2},${fy - 14 + ang}`); brows[1].setAttribute('d', `M${fx + dir * 4},${fy - 14 + ang} L${fx + dir * 15},${fy - 13 - ang}`);
      blush.setAttribute('cx', fx + dir * 16); blush.setAttribute('cy', fy + 10);
      const op = p.mouth || 0; mouth.setAttribute('d', `M${fx - dir * 2},${fy + 13} Q${fx + dir * 5},${fy + 18 + op * 6} ${fx + dir * 11},${fy + 12}`);
      if (beard) beard.setAttribute('d', `M${fx - dir * 6},${fy + 17} Q${fx + dir * 4},${fy + 36} ${fx + dir * 14},${fy + 17} Q${fx + dir * 4},${fy + 24} ${fx - dir * 6},${fy + 17}Z`);
      hat.setAttribute('transform', `translate(${hc[0]},${hc[1] - 18}) rotate(${dir * p.lean * 57}) scale(${dir},1)`);
      const handP = A2[1], wa = p.wa != null ? p.wa : p.ra[1];
      if (o.weapon === 'cung') { const bh = A1[1]; wpn.setAttribute('transform', `translate(${bh[0]},${bh[1]}) scale(${dir},1)`); const pull = p.pull || 0; string.setAttribute('points', `${bh[0]},${bh[1] - 82} ${bh[0] - dir * (8 + pull * 70)},${bh[1]} ${bh[0]},${bh[1] + 82}`); }
      else wpn.setAttribute('transform', `translate(${handP[0]},${handP[1]}) rotate(${180 - dir * wa * 57.3})`);
      if (wpn._flag) { const w = Math.sin(t * 7) * 18, w2 = Math.sin(t * 7 + 1.4) * 22, D = `M0,-260 C${-dir * 50},${-270 + w} ${-dir * 100},${-250 - w} ${-dir * 150},${-262 + w2} L${-dir * 150},${-172 + w2} C${-dir * 100},${-160 - w} ${-dir * 50},${-180 + w} 0,-170Z`; wpn._flag.setAttribute('d', D); wpn._trim.setAttribute('d', `M${-dir * 150},${-262 + w2} L${-dir * 150},${-172 + w2}`); }
      return { head: [x + hc[0] * k, y + hc[1] * k], hand: [x + handP[0] * k, y + handP[1] * k], bow: [x + A1[1][0] * k, y + A1[1][1] * k] };
    };
  }
  const STAND = { lean: 0, la: [-.15, -.05], ra: [.15, .05], ll: [-.12, -.12], rl: [.12, .12] };
  function poseRun(ph, amp = 1) {
    const sn = Math.sin(ph), sn2 = Math.sin(ph + Math.PI);
    const leg = (s1, c) => [.75 * amp * s1, .75 * amp * s1 - (.25 + 1.1 * amp * Math.max(0, -Math.cos(c)))];
    return { lean: .22 * amp, la: [-.9 * amp * sn, -.9 * amp * sn + 1.5 * amp], ra: [-.9 * amp * sn2, -.9 * amp * sn2 + 1.5 * amp], ll: leg(sn, ph), rl: leg(sn2, ph + Math.PI) };
  }
  function poseWalk(ph) {
    const sn = Math.sin(ph);
    return { lean: .04, la: [-.45 * sn, -.45 * sn + .3], ra: [.45 * sn, .45 * sn + .3], ll: [.38 * sn, .38 * sn - .25 * Math.max(0, -Math.cos(ph))], rl: [-.38 * sn, -.38 * sn - .25 * Math.max(0, Math.cos(ph))] };
  }
  /* Ngựa chiến vẽ đầy đặn: thân nâu đổ bóng, cổ cong, đầu có tai/mắt/mũi, bờm & đuôi bay, yên đỏ, chân phi có khớp và móng. */
  function drawHorseStick(parent, ink) {
    const BR = '#7a4a28', BR2 = '#5c3519', MANE = '#2a1a10', K = 1.65;
    const g = s('g', { 'stroke-linejoin': 'round', 'stroke-linecap': 'round' }, parent);
    const legsBack = [0, 1].map(() => [s('polyline', { fill: 'none', stroke: OUT, 'stroke-width': 17 }, g), s('polyline', { fill: 'none', stroke: BR2, 'stroke-width': 11 }, g), s('ellipse', { rx: 8, ry: 5, fill: '#1d1a16' }, g)]);
    const tail = s('path', { fill: MANE, stroke: OUT, 'stroke-width': 2 }, g);
    const body = s('g', null, g);
    s('ellipse', { cx: -60, cy: -4, rx: 42, ry: 38, fill: BR, stroke: OUT, 'stroke-width': 4 }, body);
    s('ellipse', { cx: 0, cy: 0, rx: 90, ry: 36, fill: BR, stroke: OUT, 'stroke-width': 4 }, body);
    s('ellipse', { cx: 56, cy: 2, rx: 40, ry: 36, fill: BR, stroke: OUT, 'stroke-width': 4 }, body);
    s('path', { d: 'M-95,-6 Q0,-30 90,-4 Q0,-12 -95,-6Z', fill: '#9a6338', opacity: .55 }, body);
    s('path', { d: 'M-80,22 Q0,40 80,22', fill: 'none', stroke: BR2, 'stroke-width': 8, opacity: .6 }, body);
    s('path', { d: 'M40,-22 C70,-60 92,-92 112,-104 L134,-92 C118,-70 104,-30 92,14 Z', fill: BR, stroke: OUT, 'stroke-width': 4 }, body);
    s('path', { d: 'M108,-110 C126,-112 150,-96 170,-80 C178,-74 176,-62 166,-60 C150,-58 132,-66 118,-74 C108,-80 102,-96 108,-110Z', fill: BR, stroke: OUT, 'stroke-width': 4 }, body);
    s('path', { d: 'M112,-108 L106,-128 L122,-112Z', fill: BR, stroke: OUT, 'stroke-width': 3 }, body);
    s('circle', { cx: 132, cy: -92, r: 4, fill: OUT }, body); s('circle', { cx: 166, cy: -70, r: 2.5, fill: OUT }, body);
    s('path', { d: 'M118,-76 L150,-60', stroke: '#8b2a20', 'stroke-width': 3, fill: 'none' }, body);
    s('path', { d: 'M-30,-34 Q0,-46 32,-34 L36,-8 Q0,-2 -34,-8Z', fill: '#c8352b', stroke: OUT, 'stroke-width': 3 }, body);
    s('path', { d: 'M-34,-8 Q0,-2 36,-8', fill: 'none', stroke: '#d9a441', 'stroke-width': 4 }, body);
    const mane = s('path', { fill: MANE, stroke: OUT, 'stroke-width': 2 }, g);
    const legsFront = [0, 1].map(() => [s('polyline', { fill: 'none', stroke: OUT, 'stroke-width': 17 }, g), s('polyline', { fill: 'none', stroke: BR, 'stroke-width': 11 }, g), s('ellipse', { rx: 8, ry: 5, fill: '#1d1a16' }, g)]);
    const leg = (L, lx, ly, a, b) => { const kx = lx + Math.sin(a) * 40, ky = ly + Math.cos(a) * 40, fx = kx + Math.sin(b) * 42, fy = ky + Math.cos(b) * 42, pts = `${lx},${ly} ${kx},${ky} ${fx},${fy}`; L[0].setAttribute('points', pts); L[1].setAttribute('points', pts); L[2].setAttribute('cx', fx + 4); L[2].setAttribute('cy', fy + 2); };
    return (X, Y, ph) => {
      g.setAttribute('transform', `translate(${X},${Y}) scale(${K})`);
      const bob = Math.sin(ph * 2) * 4; body.setAttribute('transform', `translate(0,${bob}) rotate(${Math.sin(ph) * 2})`);
      const w = Math.sin(ph * 2) * 10;
      mane.setAttribute('d', `M112,${-106 + bob} C96,${-90 + bob} 78,${-60 + bob} 52,${-28 + bob} L${40 - w * .5},${-40 + bob} C${66 - w},${-70 + bob} ${86 - w},${-98 + bob} ${104 - w * .4},${-116 + bob}Z`);
      tail.setAttribute('d', `M-98,${-14 + bob} C-130,${-20 + w} -150,${10 + w} ${-162 + w * .3},${46 + w} C-140,${30 + w} -120,${14 + bob} -96,${6 + bob}Z`);
      [[legsFront[0], 64, 0], [legsFront[1], 50, Math.PI * .45], [legsBack[0], -66, Math.PI], [legsBack[1], -52, Math.PI * 1.45]].forEach(([L, lx, off], i) => {
        const a = Math.sin(ph + off) * .75, bend = Math.max(0, Math.sin(ph + off + 1.2)) * 1.4 * (i < 2 ? -1 : 1);
        leg(L, lx, 18 + bob, a, a + bend);
      });
    };
  }
  /* Người que KIỂU CŨ (nét đơn) – dùng cho Xưởng film hoạt hình; kiểu A5 ở trên chỉ dùng cho Xưởng film Lịch sử Việt Nam */
  function stickFigClassic(parent, ink, accent, o = {}) {
    const outer = s('g', null, parent), g = s('g', { fill: 'none', stroke: ink, 'stroke-width': 14, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, outer);
    const P = () => s('polyline', null, g), back = s('g', null, g), body = P(), la = P(), ll = P(), rl = P();
    const head = s('circle', { r: 30, fill: ink }, g), ra = P(), wpn = s('g', null, g), hat = s('g', null, g);
    if (o.hat === 'non') s('path', { d: 'M-50,0 L0,-46 L50,0 Q0,10 -50,0Z', fill: '#d9b66a', stroke: ink, 'stroke-width': 6 }, hat);
    else if (o.hat === 'mu') { s('path', { d: 'M-34,0 A34,34 0 0 1 34,0 L40,6 L-40,6Z', fill: '#6b6f7a', stroke: ink, 'stroke-width': 6 }, hat); s('path', { d: 'M0,-34 q-6,-30 10,-44 q4,22 -4,44Z', fill: accent, stroke: 'none' }, hat); }
    else if (o.hat === 'khan') s('ellipse', { cx: 0, cy: -2, rx: 36, ry: 14, fill: '#1d1a16', stroke: accent, 'stroke-width': 5 }, hat);
    else s('path', { d: 'M-30,0 L30,0', stroke: accent, 'stroke-width': 9 }, hat);
    const W_ = { kiem: () => { s('line', { x1: 0, y1: 0, x2: 0, y2: -110, stroke: '#d8dde6', 'stroke-width': 9 }, wpn); s('line', { x1: -18, y1: -8, x2: 18, y2: -8, stroke: ink, 'stroke-width': 9 }, wpn); },
      giao: () => { s('line', { x1: 0, y1: 90, x2: 0, y2: -190, stroke: '#8a5a2b', 'stroke-width': 8 }, wpn); s('path', { d: 'M0,-190 L-10,-160 L0,-225 L10,-160Z', fill: '#d8dde6', stroke: ink, 'stroke-width': 4 }, wpn); s('path', { d: 'M-6,-160 q-16,10 -8,26', stroke: accent, 'stroke-width': 6, fill: 'none' }, wpn); },
      cung: () => { s('path', { d: 'M0,-80 Q46,0 0,80', stroke: '#8a5a2b', 'stroke-width': 8, fill: 'none' }, wpn); },
      co: () => { s('line', { x1: 0, y1: 60, x2: 0, y2: -260, stroke: '#5a3a1e', 'stroke-width': 8 }, wpn); wpn._flag = s('path', { fill: accent, stroke: ink, 'stroke-width': 4 }, wpn); } };
    if (o.weapon && W_[o.weapon]) W_[o.weapon]();
    const string = o.weapon === 'cung' ? s('polyline', { stroke: '#efe4cc', 'stroke-width': 3 }, g) : null;
    return function draw(x, y, dir, p, k = 1, t = 0) {
      outer.setAttribute('transform', `translate(${x},${y}) scale(${k})`);
      const pt = (ox, oy, a, L) => [ox + dir * Math.sin(a) * L, oy + Math.cos(a) * L];
      const neck = [dir * Math.sin(p.lean) * 125, -Math.cos(p.lean) * 125];
      const hc = [neck[0] + dir * Math.sin(p.lean) * 40, neck[1] - Math.cos(p.lean) * 40];
      const sh = [neck[0] - dir * Math.sin(p.lean) * 8, neck[1] + 8];
      const limb = (o2, a1, a2, L) => { const e = pt(o2[0], o2[1], a1, L), h2 = pt(e[0], e[1], a2, L); return [e, h2, `${o2[0]},${o2[1]} ${e[0]},${e[1]} ${h2[0]},${h2[1]}`]; };
      body.setAttribute('points', `0,0 ${neck[0]},${neck[1]}`);
      const L1 = limb(sh, p.la[0], p.la[1], 62), R1 = limb(sh, p.ra[0], p.ra[1], 62);
      la.setAttribute('points', L1[2]); ra.setAttribute('points', R1[2]);
      ll.setAttribute('points', limb([0, 0], p.ll[0], p.ll[1], 72)[2]); rl.setAttribute('points', limb([0, 0], p.rl[0], p.rl[1], 72)[2]);
      head.setAttribute('cx', hc[0]); head.setAttribute('cy', hc[1]);
      hat.setAttribute('transform', `translate(${hc[0]},${hc[1] - 18}) rotate(${dir * p.lean * 57})`);
      const hand = R1[1];
      // góc vũ khí: mặc định dọc theo cẳng tay; p.wa = góc riêng (tính như góc chi, 0 = chúc xuống)
      const wa = p.wa != null ? p.wa : p.ra[1];
      if (o.weapon === 'cung') { const bh = L1[1]; wpn.setAttribute('transform', `translate(${bh[0]},${bh[1]}) scale(${dir},1)`); const pull = p.pull || 0; string.setAttribute('points', `${bh[0]},${bh[1] - 80} ${bh[0] - dir * (8 + pull * 70)},${bh[1]} ${bh[0]},${bh[1] + 80}`); }
      else wpn.setAttribute('transform', `translate(${hand[0]},${hand[1]}) rotate(${180 - dir * wa * 57.3})`);
      if (wpn._flag) { const w = Math.sin(t * 7) * 18, w2 = Math.sin(t * 7 + 1.4) * 22; wpn._flag.setAttribute('d', `M0,-260 C${-dir * 50},${-270 + w} ${-dir * 100},${-250 - w} ${-dir * 150},${-262 + w2} L${-dir * 150},${-172 + w2} C${-dir * 100},${-160 - w} ${-dir * 50},${-180 + w} 0,-170Z`); }
      return { head: [x + hc[0] * k, y + hc[1] * k], hand: [x + hand[0] * k, y + hand[1] * k], bow: [x + L1[1][0] * k, y + L1[1][1] * k] };
    };
  }
  function drawHorseClassic(parent, ink) {
    const g = s('g', { fill: 'none', stroke: ink, 'stroke-width': 9, 'stroke-linecap': 'round', 'stroke-linejoin': 'round' }, parent);
    const body = s('polyline', { 'stroke-width': 16 }, g), tail = s('path', { 'stroke-width': 7 }, g), legs = [0, 1, 2, 3].map(() => s('polyline', null, g)), mane = s('path', { stroke: TA, 'stroke-width': 6 }, g);
    const head = s('path', { fill: ink }, g);
    const K = 1.65;
    return (X, Y, ph) => {
      g.setAttribute('transform', `translate(${X},${Y}) scale(${K})`);
      let x = 0, y = Math.sin(ph * 2) * 4;
      body.setAttribute('points', `${x - 95},${y} ${x + 70},${y - 8} ${x + 112},${y - 78}`);
      head.setAttribute('d', `M${x + 100},${y - 92} L${x + 160},${y - 70} L${x + 150},${y - 52} L${x + 104},${y - 64}Z`);
      mane.setAttribute('d', `M${x + 80},${y - 30} q10,-30 26,-52`);
      tail.setAttribute('d', `M${x - 95},${y} q-40,${10 + Math.sin(ph * 2) * 14} -60,${42 + Math.sin(ph * 2 + 1) * 10}`);
      [[x + 55, 0], [x + 70, Math.PI * .5], [x - 80, Math.PI], [x - 65, Math.PI * 1.5]].forEach(([lx, off], i) => {
        const a = Math.sin(ph + off) * .7, kx = lx + Math.sin(a) * 50, ky = y + Math.cos(a) * 50, b = a - (Math.max(0, Math.sin(ph + off + 1.2)) * 1.3) * (i < 2 ? -1 : 1);
        legs[i].setAttribute('points', `${lx},${y} ${kx},${ky} ${kx + Math.sin(b) * 52},${ky + Math.cos(b) * 52}`);
      });
    };
  }
  SCENES.stick = function (sc, B) {
    const a5 = B.xuong !== 'hh', FIG = a5 ? stickFig : stickFigClassic, HORSE = a5 ? drawHorseStick : drawHorseClassic;
    const root = h('div', { class: 'sc sc-stick' });
    const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root);
    const bgu = styleBG(bg, B.style, (B.seed || 7) + sc._i * 11, { ships: sc.action === 'cheo' ? 0 : 1 });
    const light = B.style === 'hoathinh' || B.style === 'langque';
    h('div', { class: 'shade stk-shade' + (light ? ' light' : '') }, root);
    const ink = light ? '#1d2330' : '#f6efdc';
    const svg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'stk-svg', preserveAspectRatio: 'xMidYMid meet' }, root);
    const GY = 780, act = STICK_ACTS[sc.action] ? sc.action : 'noi';
    if (act !== 'cheo') s('line', { x1: 80, y1: GY + 150, x2: W - 80, y2: GY + 150, stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .5 }, svg);
    const fx = s('g', null, svg), rr = rng(sc._i * 31 + 5);
    const kick = h('div', { class: 'stk-head' + (light ? ' light' : '') }, root, (sc.kicker ? `<small>${esc(sc.kicker)}</small>` : '') + esc(sc.heading || ''));
    const F = (o) => FIG(svg, ink, o.side === 'giac' ? GIAC : TA, o);
    let figs = [], extra = {}, lines = [], dust = [], conf = [];
    const dustOn = n => { for (let i = 0; i < n; i++) dust.push([s('circle', { fill: ink, opacity: .3 }, fx), rr()]); };
    if (act === 'noi') {
      figs = [F({ hat: 'khan' })];
      const board = extra.board = s('g', null, svg);
      s('rect', { x: 820, y: 290, width: 900, height: 460, rx: 26, fill: light ? '#fffdf6' : 'rgba(10,8,6,.72)', stroke: ink, 'stroke-width': 8 }, board);
      s('line', { x1: 1270, y1: 750, x2: 1270, y2: GY + 150, stroke: ink, 'stroke-width': 10 }, board);
      const ws = (sc.pull || (sc.say || '').split(/(?<=[.!?…])\s+/)[0] || '').split(' ');
      let ln = '', rows = []; ws.forEach(w => { if ((ln + ' ' + w).length > 30) { rows.push(ln); ln = w; } else ln = ln ? ln + ' ' + w : w; }); if (ln) rows.push(ln);
      rows = rows.slice(0, 5); if (rows.length === 5) rows[4] = rows[4].replace(/\s*\S*$/, '…');
      lines = rows.map((t, i) => s('text', { x: 870, y: 380 + i * 78, fill: light ? '#1d2330' : '#f6efdc', 'font-family': 'Be Vietnam Pro', 'font-weight': 700, 'font-size': 50 }, board, t));
    }
    if (act === 'nghi') {
      figs = [F({ hat: 'non' })];
      const bubble = extra.bubble = s('g', null, svg);
      [[1060, 520, 16], [1110, 460, 26]].forEach(([x, y, r2]) => s('circle', { cx: x, cy: y, r: r2, fill: light ? '#fff' : 'rgba(255,255,255,.12)', stroke: ink, 'stroke-width': 6 }, bubble));
      s('ellipse', { cx: 1330, cy: 320, rx: 260, ry: 150, fill: light ? '#fff' : 'rgba(255,255,255,.12)', stroke: ink, 'stroke-width': 7 }, bubble);
      s('text', { x: 1330, y: 365, 'text-anchor': 'middle', fill: TA, 'font-family': 'Oswald', 'font-weight': 700, 'font-size': 140 }, bubble, '?');
    }
    if (act === 'danh') {
      figs = [F({ hat: 'non', weapon: 'kiem' }), F({ hat: 'mu', weapon: 'giao', side: 'giac' })];
      const bang = extra.bang = s('g', null, svg);
      s('path', { d: 'M0,-90 L22,-30 L85,-50 L40,0 L90,45 L25,32 L0,95 L-20,35 L-85,50 L-40,0 L-88,-48 L-24,-30Z', fill: '#ffd23f', stroke: TA, 'stroke-width': 8 }, bang);
      s('text', { y: 18, 'text-anchor': 'middle', fill: '#1d2330', 'font-family': 'Oswald', 'font-weight': 700, 'font-size': 46 }, bang, 'KENG!');
    }
    if (act === 'chay') { figs = [F({ hat: 'non', weapon: 'giao' })]; for (let i = 0; i < 6; i++) lines.push(s('line', { stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .5 }, fx)); dustOn(8); }
    if (act === 'di') figs = [F({ hat: 'non' })];
    if (act === 'vui') { figs = [F({ hat: 'non' }), F({ hat: 'non', weapon: 'giao' }), F({ hat: 'non', weapon: 'co' })]; for (let i = 0; i < 60; i++) conf.push([s('rect', { width: 14, height: 22, fill: ['#c8352b', '#ffd23f', '#f6efdc', '#e2473b'][i % 4] }, fx), rr() * W, rr() * 2, rr() * 6, 120 + rr() * 160]); }
    if (act === 'hanhquan') { figs = [F({ hat: 'non', weapon: 'co' })]; for (let i = 0; i < 6; i++) figs.push(F({ hat: 'non', weapon: 'giao' })); dustOn(14); }
    if (act === 'cheo') {
      const wv = extra.waves = []; for (let i = 0; i < 30; i++) wv.push([s('path', { d: 'M0,0 q25,-8 50,0', stroke: ink, 'stroke-width': 4, fill: 'none', opacity: .5 }, fx), rr() * W, GY + 70 + rr() * 200, 20 + rr() * 30]);
      extra.boat = s('g', null, svg);
      s('path', { d: 'M-430,0 L430,0 Q470,-10 500,-90 Q470,-50 440,-40 L-420,-40 Q-470,-60 -500,-110 Q-480,-20 -430,0Z', fill: light ? '#8a5a2b' : '#5a3a1e', stroke: ink, 'stroke-width': 8 }, extra.boat);
      s('path', { d: 'M500,-90 q30,-20 20,-50 q-20,10 -20,50', fill: TA, stroke: ink, 'stroke-width': 4 }, extra.boat);
      for (let i = 0; i < 5; i++) figs.push(FIG(extra.boat, ink, TA, { hat: 'non' }));
      extra.oars = []; for (let i = 0; i < 4; i++) extra.oars.push(s('line', { stroke: '#8a5a2b', 'stroke-width': 9, 'stroke-linecap': 'round' }, extra.boat));
    }
    if (act === 'ban') {
      figs = [F({ hat: 'non', weapon: 'cung' }), F({ hat: 'non', weapon: 'cung' })];
      extra.arrows = []; for (let i = 0; i < 9; i++) { const a = s('g', null, fx); s('line', { x1: -60, y1: 0, x2: 0, y2: 0, stroke: ink, 'stroke-width': 5 }, a); s('path', { d: 'M0,0 l-16,-8 l0,16Z', fill: ink }, a); s('path', { d: 'M-60,0 l-12,-8 M-60,0 l-12,8', stroke: TA, 'stroke-width': 4 }, a); extra.arrows.push([a, i]); }
    }
    if (act === 'cuoingua') { extra.horse = HORSE(svg, ink); figs = [F({ hat: 'non', weapon: 'giao' })]; dustOn(12); for (let i = 0; i < 5; i++) lines.push(s('line', { stroke: ink, 'stroke-width': 6, 'stroke-linecap': 'round', opacity: .45 }, fx)); }
    if (act === 'phatco') {
      s('path', { d: 'M420,930 Q470,790 640,780 Q760,800 800,930Z', fill: light ? '#a08a6a' : '#3b3226', stroke: ink, 'stroke-width': 6 }, svg);
      figs = [F({ hat: 'khan', weapon: 'co' })]; for (let i = 0; i < 4; i++) figs.push(F({ hat: 'non', weapon: i % 2 ? 'kiem' : 'giao' }));
    }
    return {
      root, update(t, d) {
        bg.style.transform = `scale(${1.04 + t / d * .05})`; bgu.update(t);
        kick.style.opacity = eout(ramp(t, .1, .6)); svg.style.opacity = eout(ramp(t, 0, .6));
        const A = figs[0];
        if (act === 'chay') {
          const ph = t * 9, x = 300 + ((t * 260) % 1500), y = GY - Math.abs(Math.sin(ph)) * 18;
          const p = poseRun(ph); p.wa = 1.75; A(x, y, 1, p, 1, t);
          lines.forEach((l, i) => { const yy = y - 120 + i * 30, len = 60 + (i % 3) * 40; l.setAttribute('x1', x - 90 - len); l.setAttribute('x2', x - 70); l.setAttribute('y1', yy); l.setAttribute('y2', yy); });
          dust.forEach(([c, ph0], i) => { const a = ((t * 2 + ph0 + i / 8) % 1); c.setAttribute('cx', x - 40 - a * 160); c.setAttribute('cy', GY + 140 - a * 30); c.setAttribute('r', 6 + a * 18); c.setAttribute('opacity', .35 * (1 - a)); });
        } else if (act === 'di') {
          const ph = t * 4.2; A(260 + t * 120 % 1400, GY - Math.abs(Math.sin(ph)) * 6, 1, poseWalk(ph), 1, t);
        } else if (act === 'danh') {
          const c = t % 1.6, pa = ramp(c, 0, .18) - ramp(c, .35, .5), pb = ramp(c, .8, .98) - ramp(c, 1.15, 1.3);
          const bob = Math.sin(t * 7) * 5;
          const a = { brow: 3, mouth: pa, lean: .1 + pa * .2 - pb * .3, la: [.4, 1.2], ra: [.6 + pa * 1.2, 2.4 - pa * .9], ll: [.35, .2], rl: [-.3, -.35], wa: 2.6 - pa * 1.1 };
          const b = { brow: 3, mouth: pa, lean: .08 - pa * .35, la: [.9, 1.6], ra: [.7 + pb * .8, 1.3 + pb * .3], ll: [.35, .2], rl: [-.3, -.35], wa: 1.62 };
          A(760 - pb * 50, GY + bob, 1, a, 1, t); figs[1](1160 + pa * 50 - pb * 60, GY - bob, -1, b, 1, t);
          const hit = Math.max(pa, pb); extra.bang.setAttribute('opacity', hit > .85 ? 1 : 0);
          extra.bang.setAttribute('transform', `translate(960,${GY - 170}) scale(${.8 + hit * .3}) rotate(${(t * 40) % 30 - 15})`);
        } else if (act === 'vui') {
          figs.forEach((F2, i) => { const ph = t * Math.PI * 1.4 + i * 1.1, air = Math.abs(Math.sin(ph)); F2(600 + i * 360, GY - air * 110, 1, { mouth: 1.4, brow: -1, lean: 0, la: [-(2.55 + Math.sin(t * 9 + i) * .15), -2.9], ra: [2.55 + Math.sin(t * 9 + 1 + i) * .15, 2.9], ll: [-.25 - air * .3, -.25 + air * .9], rl: [.25 + air * .3, .25 - air * .9], wa: 3.1 }, i ? .9 : 1, t); });
          conf.forEach(([c, x, ph0, rot, v]) => { const yy = ((t * v + ph0 * 400) % 1200) - 100; c.setAttribute('transform', `translate(${x + Math.sin(t * 2 + rot) * 40},${yy}) rotate(${t * 180 + rot * 60})`); });
        } else if (act === 'nghi') {
          A(880, GY, 1, { lean: Math.sin(t * 1.2) * .04, la: [.35, 2.9 + Math.sin(t * 2) * .05], ra: [-.25, .25], ll: [-.12, -.12], rl: [.12, .12] }, 1, t);
          const k = eout(ramp(t, .6, 1.2)); extra.bubble.setAttribute('opacity', k); extra.bubble.style.transformOrigin = '1330px 320px'; extra.bubble.style.transform = `scale(${.9 + .1 * k + Math.sin(t * 2) * .01})`;
        } else if (act === 'hanhquan') {
          const base = -200 + t * 110;
          figs.forEach((F2, i) => { const ph = t * 4.2 + i * .9, x = base + (figs.length - 1 - i) * 170 + 400, p = poseWalk(ph); p.ra = [.55, 2.2]; p.wa = 3.05; F2(((x % (W + 600)) + W + 600) % (W + 600) - 300, GY + 40 - Math.abs(Math.sin(ph)) * 5, 1, p, .82, t); });
          dust.forEach(([c, ph0], i) => { const a = ((t * .8 + ph0) % 1); c.setAttribute('cx', ((base + i * 140) % (W + 400)) - 100); c.setAttribute('cy', GY + 150 - a * 40); c.setAttribute('r', 8 + a * 24); c.setAttribute('opacity', .2 * (1 - a)); });
        } else if (act === 'cheo') {
          const bx = 400 + (t * 70) % 1100, by = GY + 60 + Math.sin(t * 1.5) * 8;
          extra.boat.setAttribute('transform', `translate(${bx},${by}) rotate(${Math.sin(t * 1.2) * 1.5})`);
          extra.waves.forEach(([p, x, y, v]) => p.setAttribute('transform', `translate(${W - (((x + t * v * 3) % (W + 100)))},${y})`));
          const c = t * 3.2;
          figs.forEach((F2, i) => {
            const ph = c - i * .15, sw = Math.sin(ph);
            if (i === 4) { F2(380, -40, -1, { lean: .1, la: [1.2, 2], ra: [.9, 1.5], ll: [-.12, -.12], rl: [.12, .12] }, .8, t); return; }
            const hx = -300 + i * 170, p = { lean: .35 + sw * .25, la: [1.1 + sw * .5, 1.5 + sw * .5], ra: [1.2 + sw * .5, 1.6 + sw * .5], ll: [1.4, .3], rl: [1.5, .2] };
            const r = F2(hx, -40, 1, p, .7, t), hx2 = r.hand[0], hy2 = r.hand[1];
            extra.oars[i].setAttribute('x1', hx2); extra.oars[i].setAttribute('y1', hy2); extra.oars[i].setAttribute('x2', hx2 - 70 - sw * 60); extra.oars[i].setAttribute('y2', 90);
          });
        } else if (act === 'ban') {
          const cyc = 1.8;
          figs.forEach((F2, i) => {
            const c = (t + i * .7) % cyc, pull = ramp(c, .2, 1.1) * (c < 1.25 ? 1 : 0);
            F2(420 + i * 260, GY, 1, { lean: -.05, la: [1.57, 1.57], ra: [1.2 - pull * .9, 1.6 - pull * 2.4], ll: [.35, .2], rl: [-.3, -.35], pull }, 1, t);
          });
          extra.arrows.forEach(([a, i]) => { const c = (t + i * .37) % 1.6, x = 640 + c * 1050, y = GY - 130 - Math.sin(c / 1.6 * Math.PI) * 260 + c * 60; const vy = -Math.cos(c / 1.6 * Math.PI) * 260 * Math.PI / 1.6 + 60; a.setAttribute('transform', `translate(${x},${y}) rotate(${Math.atan2(vy, 1050) * 57.3})`); a.setAttribute('opacity', c < .05 || c > 1.5 ? 0 : 1); });
        } else if (act === 'cuoingua') {
          const ph = t * 8, x = 200 + (t * 300) % 1600, y = GY - 25;
          extra.horse(x, y, ph);
          A(x - (a5 ? 10 : 15), y - (a5 ? 50 : 14) + Math.sin(ph * 2) * 6.6, 1, { lean: .22, la: [.9, 1.5], ra: [1.4, 1.62], ll: [.75, .25], rl: [.85, .2], wa: 1.62, brow: 2, mouth: 1 }, .85, t);
          lines.forEach((l, i) => { const yy = y - 160 + i * 40; l.setAttribute('x1', x - 260 - (i % 2) * 60); l.setAttribute('x2', x - 140); l.setAttribute('y1', yy); l.setAttribute('y2', yy); });
          dust.forEach(([c, ph0], i) => { const a = ((t * 2.5 + ph0 + i / 12) % 1); c.setAttribute('cx', x - 100 - a * 220); c.setAttribute('cy', GY + 140 - a * 40); c.setAttribute('r', 8 + a * 22); c.setAttribute('opacity', .35 * (1 - a)); });
        } else if (act === 'phatco') {
          const sw = Math.sin(t * 2.4);
          A(610, GY - 10, 1, { lean: -.05, la: [-.3, -.1], ra: [2.2 + sw * .5, 2.9 + sw * .3], ll: [-.15, -.1], rl: [.15, .1], wa: 2.95 + sw * .35 }, 1.05, t);
          figs.slice(1).forEach((F2, i) => { const up = Math.max(0, Math.sin(t * 3.2 + i * .8)); F2(900 + i * 220, GY + 40, -1, { lean: .05, la: [-.2, -.1], ra: [1.2 + up * 1.6, 1.6 + up * 1.4], ll: [.15, .1], rl: [-.15, -.1], wa: 2.2 + up * .9 }, .85, t); });
        } else {
          const talk = Math.sin(t * 5) * .08, pt = ramp(t, .4, 1);
          A(560, GY, 1, { lean: .02 + talk * .3, la: [-.2, -.1 + talk], ra: [.4 + pt * 1.05, .4 + pt * 1.2 + Math.sin(t * 3) * .08], ll: STAND.ll, rl: STAND.rl }, 1, t);
          extra.board.setAttribute('opacity', eout(ramp(t, .2, .7)));
          lines.forEach((l, i) => l.setAttribute('opacity', eout(ramp(t, .8 + i * .5, 1.3 + i * .5))));
        }
      }
    };
  };

  /* ----- THẺ THÔNG TIN kiểu podcast/giải thích: chương, cảnh báo, chuỗi bước, tự kiểm tra, so sánh, chữ to -----
     *cụm từ* trong tiêu đề được tô màu nổi bật. */
  const hl = t => esc(t || '').replace(/\*([^*]+)\*/g, '<em class="hl">$1</em>');
  function infoBG(root, sc, B, k) {
    if (B.style) { const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root); root._bgu = styleBG(bg, B.style, (B.seed || 7) + sc._i * k, { ships: 1 }); h('div', { class: 'shade info-shade' }, root); }
    return t => { if (root._bgu) root._bgu.update(t); };
  }
  const ICON = {
    warning: '<svg viewBox="0 0 100 100"><path d="M50 8 L96 90 H4Z" fill="#e2473b"/><rect x="45" y="36" width="10" height="30" rx="4" fill="#fff"/><circle cx="50" cy="77" r="6" fill="#fff"/></svg>',
    check: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#2f9a5a"/><path d="M28 52 L44 68 L74 34" stroke="#fff" stroke-width="10" fill="none" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    cross: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="46" fill="#c8352b"/><path d="M32 32 L68 68 M68 32 L32 68" stroke="#fff" stroke-width="10" stroke-linecap="round"/></svg>'
  };
  const reveal = (el, t, a, dx = 0, dy = 30) => { const k = eout(ramp(t, a, a + .5)); el.style.opacity = k; el.style.transform = `translate(${(1 - k) * dx}px,${(1 - k) * dy}px)`; return k; };

  SCENES.chapter = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-chapter' }), bgu = infoBG(root, sc, B, 17);
    const box = h('div', { class: 'ch-box' }, root);
    const kick = h('div', { class: 'ch-kick' }, box, esc(sc.kicker || 'CHƯƠNG MỚI'));
    const title = h('div', { class: 'ch-title' }, box, hl(sc.title || sc.heading));
    const bar = h('div', { class: 'ch-bar' }, box);
    const sub = sc.sub ? h('div', { class: 'ch-sub' }, box, hl(sc.sub)) : null;
    return { root, update(t) { bgu(t); reveal(kick, t, .1, 0, -20); reveal(title, t, .35); bar.style.width = eout(ramp(t, .8, 1.5)) * 320 + 'px'; if (sub) reveal(sub, t, 1.2); } };
  };

  SCENES.warning = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-warning' }), bgu = infoBG(root, sc, B, 19);
    const ic = h('div', { class: 'wr-icon' }, root, ICON.warning);
    const box = h('div', { class: 'wr-box' }, root);
    const kick = sc.kicker ? h('div', { class: 'wr-kick' }, box, esc(sc.kicker)) : null;
    const title = h('div', { class: 'wr-title' }, box, hl(sc.title || sc.heading));
    const sub = sc.sub ? h('div', { class: 'wr-sub' }, box, hl(sc.sub)) : null;
    return { root, update(t) {
      bgu(t); const k = eout(ramp(t, 0, .5)); ic.style.opacity = k; ic.style.transform = `scale(${(.6 + .4 * k) * (1 + Math.max(0, Math.sin(t * 4)) * .05)})`;
      if (kick) reveal(kick, t, .3, -40, 0); reveal(title, t, .5, -40, 0); if (sub) reveal(sub, t, 1.1, -40, 0);
    } };
  };

  SCENES.steps = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-steps' }), bgu = infoBG(root, sc, B, 23);
    const title = h('div', { class: 'in-title' }, root, hl(sc.title || sc.heading));
    const row = h('div', { class: 'st-row n' + Math.min(4, (sc.steps || []).length) }, root);
    const els = (sc.steps || []).slice(0, 4).map((x, i) => {
      if (i) h('div', { class: 'st-arrow' }, row, '➜');
      return h('div', { class: 'st-step' }, row, `<b>${String(i + 1).padStart(2, '0')}</b><span>${hl(x)}</span>`);
    });
    const arrows = [...row.querySelectorAll('.st-arrow')];
    return { root, update(t, d) {
      bgu(t); reveal(title, t, .1); const step = Math.max(.6, (d - 2) / Math.max(1, els.length));
      els.forEach((e, i) => { reveal(e, t, .6 + i * step, 0, 40); if (arrows[i - 1]) arrows[i - 1].style.opacity = eout(ramp(t, .4 + i * step, .7 + i * step)); });
    } };
  };

  SCENES.checklist = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-check' }), bgu = infoBG(root, sc, B, 29);
    const title = h('div', { class: 'in-title' }, root, hl(sc.title || sc.heading));
    const list = h('div', { class: 'ck-list' }, root), ico = sc.icon === 'check' ? ICON.check : ICON.warning;
    const els = (sc.items || []).slice(0, 5).map(x => h('div', { class: 'ck-item' }, list, `<i>${ico}</i><span>${hl(x)}</span>`));
    const note = sc.note ? h('div', { class: 'ck-note' }, root, hl(sc.note)) : null;
    return { root, update(t, d) {
      bgu(t); reveal(title, t, .1); const step = Math.max(.7, (d - 2.5) / Math.max(1, els.length));
      els.forEach((e, i) => { reveal(e, t, .6 + i * step, 50, 0); const ic = e.firstChild; ic.style.transform = `scale(${.4 + .6 * eout(ramp(t, .8 + i * step, 1.2 + i * step))})`; });
      if (note) reveal(note, t, .8 + els.length * step);
    } };
  };

  SCENES.vs = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-vs' }), bgu = infoBG(root, sc, B, 31);
    const title = h('div', { class: 'in-title' }, root, hl(sc.title || sc.heading));
    const a = sc.a || ['', ''], b = sc.b || ['', ''];
    const ca = h('div', { class: 'vs-card good' }, root, `<i>${ICON.check}</i><b>${hl(a[0])}</b><span>${hl(a[1])}</span>`);
    const cb = h('div', { class: 'vs-card bad' }, root, `<i>${ICON.cross}</i><b>${hl(b[0])}</b><span>${hl(b[1])}</span>`);
    const mid = h('div', { class: 'vs-mid' }, root, 'VS');
    return { root, update(t) { bgu(t); reveal(title, t, .1); reveal(ca, t, .5, -80, 0); reveal(cb, t, .9, 80, 0); const k = eout(ramp(t, 1.3, 1.7)); mid.style.opacity = k; mid.style.transform = `translate(-50%,-50%) scale(${.5 + k * .5}) rotate(${(1 - k) * -90}deg)`; } };
  };

  SCENES.bigword = function (sc, B) {
    const root = h('div', { class: 'sc sc-info sc-big' + (sc.media && sc.media.url ? ' has-media' : '') }), bgu = infoBG(root, sc, B, 37);
    let media = null;
    if (sc.media && sc.media.url) { media = h(sc.media.kind === 'video' ? 'video' : 'img', { class: 'bw-media', src: sc.media.url, muted: '', playsinline: '' }, root); if (media.tagName === 'VIDEO') media.muted = true; }
    const box = h('div', { class: 'bw-box' }, root);
    const big = h('div', { class: 'bw-big' }, box, hl(sc.big || sc.title || ''));
    const cap = sc.caption ? h('div', { class: 'bw-cap' }, box, hl(sc.caption)) : null;
    const sub = sc.sub ? h('div', { class: 'bw-sub' }, box, hl(sc.sub)) : null;
    const len = (sc.big || sc.title || '').replace(/\*/g, '').length; big.style.fontSize = Math.min(220, Math.max(90, (media ? 1700 : 2600) / Math.max(4, len))) + 'px';
    return { root, update(t, d) {
      bgu(t); const k = eout(ramp(t, .1, .7)); big.style.opacity = k; big.style.transform = `scale(${1.25 - .25 * k})`;
      if (media) { media.style.opacity = eout(ramp(t, 0, .6)); media.style.transform = `scale(${1.05 + t / d * .08})`; if (media.tagName === 'VIDEO' && media.duration && Math.abs(media.currentTime - t % media.duration) > .3) media.currentTime = t % media.duration; }
      if (cap) reveal(cap, t, .7); if (sub) reveal(sub, t, 1.2);
    } };
  };

  /* ----- Thống kê: số liệu lớn chạy đếm (tự nhận diện từ kịch bản) ----- */
  SCENES.stat = function (sc, B) {
    const root = h('div', { class: 'sc sc-stat' });
    if (B.style) { const bg = s('svg', { viewBox: `0 0 ${W} ${H}`, class: 'bgsvg', preserveAspectRatio: 'xMidYMid slice' }, root); root._bgu = styleBG(bg, B.style, (B.seed || 7) + sc._i * 7, { ships: 1 }); h('div', { class: 'shade stat-shade' }, root); }
    const head = h('div', { class: 'stat-head' }, root, (sc.kicker ? `<small>${esc(sc.kicker)}</small>` : '') + esc(sc.heading || ''));
    const row = h('div', { class: 'stat-row n' + (sc.stats || []).length }, root);
    const fmt = (v, dec) => v.toLocaleString('vi-VN', { maximumFractionDigits: dec, minimumFractionDigits: dec });
    const items = (sc.stats || []).slice(0, 3).map(st => {
      const it = h('div', { class: 'stat' }, row);
      if (st.pre) h('div', { class: 'stat-pre' }, it, esc(st.pre.toUpperCase()));
      const num = h('div', { class: 'stat-num' }, it);
      const val = h('span', null, num, '0');
      if (st.scale || st.pct) h('em', null, num, st.pct ? '%' : ' ' + esc(st.scale));
      const bar = h('div', { class: 'stat-bar' }, it);
      h('div', { class: 'stat-unit' }, it, esc(st.unit || ''));
      const dec = Math.round(st.shown) === st.shown ? 0 : 1;
      // co chữ theo độ dài con số để không chồng nhau
      const n = Math.min(3, (sc.stats || []).length), chars = fmt(st.shown, dec).length + (st.pct ? 1 : st.scale ? st.scale.length * .45 + .5 : 0);
      num.style.fontSize = Math.min(n === 3 ? 150 : 190, ((1680 - (n - 1) * 90) / n) / (chars * .62)) + 'px';
      return { it, val, bar, st, dec };
    });
    return {
      root, update(t, d) {
        if (root._bgu) root._bgu.update(t);
        head.style.opacity = eout(ramp(t, .1, .6));
        items.forEach((I, i) => {
          const a = .35 + i * .35, k = eout(ramp(t, a, a + 1.6));
          I.it.style.opacity = eout(ramp(t, a, a + .4)); I.it.style.transform = `translateY(${(1 - eout(ramp(t, a, a + .5))) * 40}px)`;
          I.val.textContent = fmt(I.st.shown * k, k < 1 ? 0 : I.dec);
          I.bar.style.width = k * 100 + '%';
        });
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
    if (B.sources && B.sources.length) h('div', { class: 'end-src' }, box, 'Nguồn tham khảo: ' + B.sources.map(esc).join(' · ') + '<br><small>Số liệu cổ là ước lượng theo sử sách, các nguồn có thể chênh lệch.</small>');
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
        const isCmd = U.cmd && i === 0;
        let flag = null;
        if (U.kind === 'troop' || U.kind === 'horse') {
          const body = s('g', { transform: isCmd ? 'scale(1.75)' : 'scale(1.3)' }, inner);
          if (isCmd) {
            s('line', { x1: -15, y1: 2, x2: -15, y2: -74, class: 'u-pole' }, body);
            flag = s('path', { d: 'M-15,-74 L18,-68 L10,-62 L18,-56 L-15,-52 Z', class: 'u-flag ' + U.side }, body);
          }
          if (U.kind === 'horse') drawHorse(body, U.side); else drawSoldier(body, U.side, 0);
        } else {
          const sc2 = U.big ? 1.25 : .9;
          s('path', { d: `M${-26 * sc2},0 Q${-22 * sc2},${10 * sc2} ${-12 * sc2},${11 * sc2} L${14 * sc2},${11 * sc2} Q${24 * sc2},${9 * sc2} ${28 * sc2},${-3 * sc2} L${18 * sc2},1 L${-18 * sc2},1Z`, class: 'u-body ' + U.side }, inner);
          s('path', { d: `M${-10 * sc2},${-2 * sc2} L${-8 * sc2},${-30 * sc2} L${8 * sc2},${-30 * sc2} L${10 * sc2},${-2 * sc2}Z`, class: 'u-sail ' + U.side }, inner);
          if (isCmd) { s('line', { x1: 0, y1: -30 * sc2, x2: 0, y2: -52 * sc2, class: 'u-pole' }, inner); flag = s('path', { d: `M0,${-52 * sc2} L${22 * sc2},${-48 * sc2} L${16 * sc2},${-44 * sc2} L${22 * sc2},${-40 * sc2} L0,${-38 * sc2} Z`, class: 'u-flag ' + U.side }, inner); }
        }
        const fire = s('g', { class: 'u-fire', opacity: 0 }, m);
        for (let j = 0; j < 3; j++) s('path', { d: 'M-8,0 Q-10,-18 0,-34 Q10,-18 8,0Z', fill: j ? '#ffb02e' : '#ff5a1f', transform: `translate(${(j - 1) * 9},-6) scale(${1 - j * .2})` }, fire);
        members.push({ m, inner, fire, flag, ox: isCmd ? 0 : ox, oy: isCmd ? 0 : oy, ph: rr() * 6, delay: isCmd ? 0 : rr() * .04 });
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
            if (M.flag) M.flag.setAttribute('transform', `skewY(${Math.sin(t * 5 + M.ph) * 5})`);
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
    const at = x => Math.max(t0, t0 + x - offset);
    master.gain.setValueAtTime(0, at(Math.max(0, offset)));
    master.gain.linearRampToValueAtTime(.9, at(Math.max(offset + .01, 2)));
    master.gain.setValueAtTime(.9, at(Math.max(offset + .02, total - 3)));
    master.gain.linearRampToValueAtTime(0, at(total));
    const noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 1, ctx.sampleRate);
    const nd = noiseBuf.getChannelData(0); const rr = rng(42); for (let i = 0; i < nd.length; i++) nd[i] = rr() * 2 - 1;
    const live = x => x >= offset - .05;
    // nền trầm: Rê thứ ngũ cung (viễn tưởng: hợp âm mở; hoạt hình: Đô trưởng)
    // phong cách mới: cổ tích (hộp nhạc huyền ảo), làng quê (ngũ cung, trống cơm nhẹ), vũ trụ (nền pad, không trống)
    const MX = {
      cotich: { chords: [[57, 60, 64], [53, 57, 60], [48, 52, 55], [55, 59, 62]], bpm: 70, pattern: [.3, 0, 0, 0, .2, 0, 0, 0], penta: [76, 79, 81, 84, 86, 88], wave: 'sine', prob: .5 },
      langque: { chords: [[50, 57, 62], [48, 55, 60], [45, 52, 57], [47, 54, 59]], bpm: 84, pattern: [.4, 0, .2, 0, .3, 0, .2, .15], penta: [62, 64, 67, 69, 72, 74], wave: 'triangle', prob: .5 },
      vutru: { chords: [[45, 52, 59], [41, 48, 55], [43, 50, 57], [40, 47, 54]], bpm: 60, pattern: [.25, 0, 0, 0, 0, 0, 0, 0], penta: [69, 71, 76, 79, 83, 88], wave: 'sine', prob: .35, half: true }
    }[style];
    const chords = MX ? MX.chords : style === 'vientuong' ? [[50, 57, 64], [46, 53, 60], [48, 55, 62], [43, 50, 57]]
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
    const bpm = MX ? MX.bpm : style === 'hoathinh' ? 108 : style === 'vientuong' ? 92 : 76, beat = 60 / bpm;
    const pattern = MX ? MX.pattern : style === 'vientuong' ? [.7, 0, .25, 0, .5, 0, .25, 0] : style === 'hoathinh' ? [.5, 0, .3, .3, .5, 0, .3, 0] : [1, 0, .4, 0, .8, .3, .5, 0];
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
    const penta = MX ? MX.penta : style === 'hoathinh' ? [72, 74, 76, 79, 81, 84] : style === 'vientuong' ? [62, 64, 69, 71, 74, 76] : [62, 65, 67, 69, 72, 74, 77];
    const pr = rng(7), step = (MX ? MX.half : style === 'vientuong') ? beat / 2 : beat, prob = MX ? MX.prob : style === 'vientuong' ? .7 : style === 'hoathinh' ? .55 : .42;
    for (let x = 6; x < total - 3; x += step) {
      if (pr() > prob || !live(x)) continue;
      const m = penta[Math.floor(pr() * penta.length)];
      const o = ctx.createOscillator(); o.type = MX ? MX.wave : style === 'hoathinh' ? 'sine' : 'triangle'; o.frequency.value = mtof(m);
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
     HIỆU ỨNG CHỮ (GSAP + SplitText + ScrambleText) – timeline tạm dừng,
     tua theo thời gian cảnh ⇒ vẫn xuất từng khung chính xác.
     ====================================================================== */
  const FX_TARGETS = '.card-head, .hero-name, .sec-title, .stat-head, .end-big, .title-sub, .kicker, .card-kick';
  function fxAuto(style, el) {
    const small = el.matches('.title-sub, .kicker, .card-kick, .sec-title');
    if (style === 'vientuong') return small ? 'quet' : 'giaima';
    if (style === 'hoathinh' || style === 'langque') return small ? 'quet' : 'nay';
    if (style === 'vutru') return small ? 'quet' : 'giaima';
    return small ? 'quet' : 'tach';
  }
  function textFx(root, kind, style) {
    const G = window.gsap; if (!G || !kind || kind === 'none') return null;
    if (window.SplitText && !textFx._reg) { G.registerPlugin(window.SplitText); if (window.ScrambleTextPlugin) G.registerPlugin(window.ScrambleTextPlugin); textFx._reg = 1; }
    const tl = G.timeline({ paused: true });
    root.querySelectorAll(FX_TARGETS).forEach((el, k) => {
      if (!el.textContent.trim()) return;
      let K = kind === 'auto' ? fxAuto(style, el) : kind; const at = .25 + k * .22;
      if (K === 'giaima' && el.children.length) K = 'tach';
      if (K === 'tach' && window.SplitText) {
        const sp = new SplitText(el, { type: 'chars,words', charsClass: 'fx-ch' });
        G.set(el, { perspective: 600 });
        tl.from(sp.chars, { duration: .7, yPercent: 110, rotateX: -80, opacity: 0, ease: 'back.out(1.6)', stagger: .03 }, at);
      } else if (K === 'nay' && window.SplitText) {
        const sp = new SplitText(el, { type: 'words' });
        tl.from(sp.words, { duration: .8, scale: 0, opacity: 0, ease: 'elastic.out(1, .45)', stagger: .09, transformOrigin: '50% 80%' }, at);
      } else if (K === 'mo' && window.SplitText) {
        const sp = new SplitText(el, { type: 'words' });
        tl.from(sp.words, { duration: .9, filter: 'blur(14px)', opacity: 0, y: 18, ease: 'power2.out', stagger: .06 }, at);
      } else if (K === 'giaima' && window.ScrambleTextPlugin && !el.children.length) {
        const txt = el.textContent;
        tl.fromTo(el, { scrambleText: { text: ' ', chars: 'upperCase' } }, { duration: Math.min(1.8, .4 + txt.length * .05), scrambleText: { text: txt, chars: 'ĐĂÂÊÔƠƯXYZ01', revealDelay: .25, speed: .6 }, ease: 'none' }, at);
      } else if (K === 'go' && window.SplitText) {
        // gõ chữ từng ký tự, có con trỏ nhấp nháy
        const sp = new SplitText(el, { type: 'chars', charsClass: 'fx-ch' }), cur = document.createElement('span'); cur.className = 'fx-cur'; cur.textContent = '▍'; el.appendChild(cur);
        const n = sp.chars.length, dur = Math.min(2.2, n * .045);
        tl.set(sp.chars, { opacity: 0 }, 0); tl.to(sp.chars, { opacity: 1, duration: .01, stagger: dur / Math.max(1, n) }, at);
        tl.fromTo(cur, { opacity: 1 }, { opacity: 0, duration: .25, repeat: 9, yoyo: true, ease: 'steps(1)' }, at); tl.set(cur, { display: 'none' }, at + dur + 2.4);
      } else if (K === 'quet') {
        tl.fromTo(el, { clipPath: 'inset(0 100% 0 0)' }, { duration: .9, clipPath: 'inset(0 0% 0 0)', ease: 'power3.inOut' }, at);
      }
    });
    return tl.getChildren().length ? tl : null;
  }

  /* ======================================================================
     LỚP HOẠT HÌNH (Lottie / Rive) – app đăng ký trình phát qua Studio.plugins
     ====================================================================== */
  const plugins = {};
  function animLayer(root, sc) {
    const A = sc.anim; if (!A || !A.url || !plugins[A.kind]) return null;
    const box = h('div', { class: 'anim-layer pos-' + (A.pos || 'center') });
    const cv = h('canvas', { width: A.pos === 'full' ? 1920 : 900, height: A.pos === 'full' ? 1080 : 900 }, box);
    const anchor = root.querySelector('.card-box, .stat-head, .title-box, .end-box, .q-mark, .sec-title');
    anchor ? root.insertBefore(box, anchor) : root.appendChild(box);
    let hd = null; try { hd = plugins[A.kind].create(cv, A); } catch (e) { console.warn('anim', e); }
    return { seek(t) { box.style.opacity = Math.min(1, t / .5); if (hd && hd.seek) hd.seek(t); }, destroy() { if (hd && hd.destroy) hd.destroy(); } };
  }

  /* ======================================================================
     PLAYER
     ====================================================================== */
  /* THẺ GIỚI THIỆU GÓC DƯỚI (lower third): tên + chức danh + 2 cặp nhãn/giá trị */
  function lowerThird(root, L) {
    if (!L || !(L.title || L.label)) return null;
    const box = h('div', { class: 'lt3' }, root);
    if (L.label) h('div', { class: 'lt3-label' }, box, esc(L.label));
    h('div', { class: 'lt3-title' }, box, esc(L.title || ''));
    const cols = (L.cols || []).filter(c => c && (c[0] || c[1])).slice(0, 2);
    const row = cols.length ? h('div', { class: 'lt3-cols' }, box, cols.map(c => `<div><small>${esc(c[0] || '')}</small><b>${esc(c[1] || '')}</b></div>`).join('')) : null;
    return (t, d) => { const k = eout(ramp(t, .5, 1.1)) * (1 - ramp(t, d - .9, d - .4)); box.style.opacity = k; box.style.transform = `translateX(${(1 - k) * -60}px)`; if (row) row.style.opacity = eout(ramp(t, 1, 1.5)); };
  }
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
    stage.classList.remove('st-tailieu', 'st-vientuong', 'st-hoathinh', 'st-cotich', 'st-langque', 'st-vutru'); if (battle.style) stage.classList.add('st-' + battle.style);
    const layer = h('div', { class: 'layer' }, stage);
    const fxLeak = h('div', { class: 'tr-leak' }, stage), fxBar = h('div', { class: 'tr-bar' }, stage), fxScan = h('div', { class: 'tr-scan' }, stage);
    const subs = h('div', { class: 'subs' }, stage);
    const grain = h('canvas', { class: 'grain', width: 384, height: 216 }, stage);
    const gctx = grain.getContext('2d');
    const gimg = gctx.createImageData(384, 216);
    const fade = h('div', { class: 'fade' }, stage);
    h('div', { class: 'vign' }, stage);
    // NGƯỜI DẪN Ở GÓC (PiP): người que khăn đóng kể chuyện ở góc trái dưới, hiện ở các cảnh thông tin
    let pipU = null;
    if (opts.pip) {
      const box = h('div', { class: 'pip' }, stage), ps = s('svg', { viewBox: '0 0 400 400' }, box);
      s('circle', { cx: 200, cy: 200, r: 196, fill: 'rgba(16,12,8,.78)', stroke: '#c9a45c', 'stroke-width': 6 }, ps);
      const fig = (battle.xuong === 'hh' ? stickFigClassic : stickFig)(ps, '#f6efdc', TA, { hat: 'khan' });
      pipU = (t, on, lt, d) => {
        const vis = on ? eout(ramp(lt, .3, .8)) * (1 - ramp(lt, d - .7, d - .3)) : 0;
        box.style.opacity = vis; box.style.transform = `scale(${.8 + .2 * vis})`;
        if (vis > 0) { const g = Math.sin(t * 2.3), talk = Math.sin(t * 6) * .06; fig(185, 262, 1, { lean: .03 + talk, la: [-.15, -.05], ra: [.5 + g * .45, 1.1 + g * .7], ll: [-.12, -.12], rl: [.12, .12] }, .78, t); }
      };
    }
    const brand = h('div', { class: 'brand' }, stage, esc(battle.series || 'SỬ VIỆT · NHỮNG TRẬN ĐÁNH LỪNG DANH'));
    let cur = -1, inst = null;
    scenes.forEach(S => { S.chunks = chunks(S.sc.say); const L = S.chunks.reduce((a, c) => a + c.length, 0) || 1; let a = .25; S.cuts = S.chunks.map(c => { const st = a; a += (S.d - .6) * c.length / L; return [st, a, c]; }); });
    /* ---------- chuyển cảnh kiểu After Effects ---------- */
    const TR_T = .8;
    const TR_SETS = { tailieu: ['zoom', 'flash', 'whip', 'wipe'], vientuong: ['glitch', 'zoom', 'iris', 'whip'], hoathinh: ['iris', 'slide', 'zoom', 'wipe'], cotich: ['iris', 'zoom', 'black', 'wipe'], langque: ['slide', 'wipe', 'zoom', 'iris'], vutru: ['zoom', 'iris', 'black', 'glitch'] };
    const trOpt = opts.tr || 'auto';
    function trKind(i) {
      if (scenes[i].sc.tr) return scenes[i].sc.tr;
      if (trOpt !== 'auto') return trOpt;
      const set = TR_SETS[battle.style] || TR_SETS.tailieu;
      return set[(i - 1) % set.length];
    }
    const insts = new Map();
    function getInst(i) {
      if (!insts.has(i)) {
        const sc = scenes[i].sc, it = SCENES[sc.type](sc, battle);
        const fxKind = sc.textFx || opts.textFx || 'none';
        it._fx = null; it._fxKind = fxKind; it._anim = animLayer(it.root, sc); it._lower = lowerThird(it.root, sc.lower);
        const up = it.update.bind(it);
        it.update = (t, d) => {
          up(t, d);
          if (it._fxKind !== 'none' && !it._fx && it.root.isConnected) it._fx = textFx(it.root, it._fxKind, battle.style) || false;
          if (it._fx) it._fx.time(Math.max(0, t), false);
          if (it._anim) it._anim.seek(t);
          if (it._lower) it._lower(t, d);
        };
        insts.set(i, it);
      }
      return insts.get(i);
    }
    function show(list) {
      for (const [k, it] of insts) if (!list.includes(k)) { it.root.remove(); if (it._fx) it._fx.kill(); if (it._anim) it._anim.destroy(); insts.delete(k); }
      const roots = list.map(k => getInst(k).root);
      if (roots.some((r, j) => layer.children[j] !== r) || layer.children.length !== roots.length) roots.forEach(r => layer.appendChild(r));
      roots.forEach(r => { r.style.transform = ''; r.style.opacity = ''; r.style.filter = ''; r.style.clipPath = ''; });
    }
    function applyTr(kind, p, a, b) {
      const e = ease(p);
      fxLeak.style.opacity = 0; fxBar.style.opacity = 0; fxScan.style.opacity = 0;
      if (kind === 'zoom') {
        a.style.transform = `scale(${1 + e * .35})`; a.style.filter = `blur(${e * 10}px)`; a.style.opacity = 1 - e;
        b.style.transform = `scale(${1.25 - e * .25})`; b.style.filter = `blur(${(1 - e) * 10}px)`; b.style.opacity = e;
      } else if (kind === 'flash') {
        b.style.opacity = p < .5 ? 0 : 1; a.style.opacity = p < .5 ? 1 : 0;
        a.style.transform = `scale(${1 + p * .06})`; b.style.transform = `scale(${1.06 - p * .06})`;
        fxLeak.style.opacity = Math.pow(1 - Math.abs(p - .5) * 2, 1.5);
      } else if (kind === 'whip') {
        a.style.transform = `translateX(${-e * 70}%)`; a.style.filter = `blur(${Math.sin(e * Math.PI) * 28}px)`;
        b.style.transform = `translateX(${(1 - e) * 70}%)`; b.style.filter = `blur(${Math.sin(e * Math.PI) * 28}px)`;
        b.style.opacity = e < .5 ? e * 2 : 1;
      } else if (kind === 'wipe') {
        b.style.clipPath = `inset(0 ${(1 - e) * 100}% 0 0)`;
        fxBar.style.opacity = Math.sin(p * Math.PI); fxBar.style.left = (e * 100) + '%';
      } else if (kind === 'slide') {
        a.style.transform = `translateX(${-e * 100}%)`; b.style.transform = `translateX(${(1 - e) * 100}%)`;
      } else if (kind === 'iris') {
        b.style.clipPath = `circle(${e * 80}% at 50% 50%)`; a.style.transform = `scale(${1 + e * .1})`;
      } else if (kind === 'glitch') {
        const j = Math.sin(p * 97) * 40 * Math.sin(p * Math.PI), split = 14 * Math.sin(p * Math.PI);
        const sh = `drop-shadow(${split}px 0 rgba(255,0,80,.8)) drop-shadow(${-split}px 0 rgba(0,240,255,.8))`;
        a.style.opacity = p < .5 ? 1 : 0; b.style.opacity = p < .5 ? 0 : 1;
        [a, b].forEach(r => { r.style.transform = `translateX(${j}px) skewX(${j * .1}deg)`; r.style.filter = sh; });
        fxScan.style.opacity = Math.sin(p * Math.PI) * .8;
      } else if (kind === 'black') {
        a.style.opacity = 1 - Math.min(1, p * 2); b.style.opacity = Math.max(0, p * 2 - 1);
      } else { b.style.opacity = e; }
    }

    function seek(t) {
      t = clamp(t, 0, total - 1e-3);
      let i = scenes.findIndex(S => t < S.start + S.d); if (i < 0) i = scenes.length - 1;
      const S = scenes[i];
      const lt = t - S.start;
      // có đang ở vùng giao giữa hai cảnh không?
      let pair = null;
      if (i > 0 && lt < TR_T / 2 && trKind(i) !== 'cut') pair = [i - 1, i, (lt + TR_T / 2) / TR_T];
      else if (i < scenes.length - 1 && S.d - lt < TR_T / 2 && trKind(i + 1) !== 'cut') pair = [i, i + 1, (lt - (S.d - TR_T / 2)) / TR_T];
      if (pair) {
        const [a, b, p] = pair;
        show([a, b]);
        getInst(a).update(Math.min(t - scenes[a].start, scenes[a].d), scenes[a].d);
        getInst(b).update(Math.max(0, t - scenes[b].start), scenes[b].d);
        applyTr(trKind(b), clamp(p, 0, 1), getInst(a).root, getInst(b).root);
      } else {
        show([i]); getInst(i).update(lt, S.d);
        fxLeak.style.opacity = 0; fxBar.style.opacity = 0; fxScan.style.opacity = 0;
      }
      inst = getInst(i); cur = i;
      const c = S.cuts.find(c => lt >= c[0] && lt < c[1] + .25) || null;
      const txt = c ? c[2] : '';
      if (subs._t !== txt) { subs._t = txt; subs.innerHTML = txt ? `<span>${esc(txt)}</span>` : ''; }
      fade.style.opacity = i === 0 ? 1 - ramp(lt, 0, .5) : i === scenes.length - 1 ? ramp(lt, S.d - .6, S.d) : 0;
      brand.style.opacity = ['title', 'map', 'diagram'].includes(S.sc.type) ? 0 : .75;
      if (pipU) { const on = !['stick', 'title', 'end', 'hero'].includes(S.sc.type) && !(S.sc.media && S.sc.full) && !pair; pipU(t, on, lt, S.d); }
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

  window.Studio = { build, renderAudio, sceneDur, W, H, music: scheduleMusic, chunks, plugins, textFx, STICK_ACTS, stickFig, drawHorse: drawHorseStick, svgEl: s };
})();
