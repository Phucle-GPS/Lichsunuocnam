#!/usr/bin/env node
/* =========================================================================
   DỰNG 1 TẬP PHIM BẢN ĐỒ CHIẾN DỊCH BẰNG HYPERFRAMES – Xưởng film Lịch sử Việt Nam
   node tools/hf-tap.mjs <id-trận>            → hyperframes/<id>/ (dự án HyperFrames)
   Sau đó:  cd hyperframes/<id> && npx hyperframes check && npx hyperframes render -o ../<id>.mp4
            node tools/kiem-phim.mjs hyperframes/<id>   (tự kiểm: clip thiếu, tư liệu lặp, đường dẫn máy)
   Cần: battles.js (lời dẫn), loi-dan/<id>/NN.mp3 (giọng Manus), anh/<id>/ (ảnh tư liệu),
        maps/<id>/{nen-2k.jpg,do-cao.png,tuyen.json,kich-ban-ban-do.json} (tools/ban-do.mjs).
   Khung 8 cảnh của app → 1920×1080, 30 fps:
     1 mở đầu (tư liệu) · 2 nhân vật (tư liệu) · 3–5 BẢN ĐỒ CHIẾN DỊCH 3D · 6 trích dẫn (tư liệu)
     7 sau trận (bản đồ 3D: đất cháy còn lại) · 8 kết (tư liệu); chuyển cảnh mực bắn giữa các cảnh.
   ========================================================================= */
import fs from 'node:fs'; import path from 'node:path'; import vm from 'node:vm';
import { execFileSync } from 'node:child_process'; import { fileURLToPath, pathToFileURL } from 'node:url'; import { createRequire } from 'node:module';
const require = createRequire(import.meta.url);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const id = process.argv[2]; if (!id) { console.log('Cách dùng: node tools/hf-tap.mjs <id-trận>'); process.exit(1); }
const ctx = { window: {} }; vm.createContext(ctx); vm.runInContext(fs.readFileSync(path.join(ROOT, 'battles.js'), 'utf8'), ctx);
const B = ctx.window.BATTLES.find(b => b.id === id); if (!B) throw new Error('Không có trận ' + id);
const OUT = path.join(ROOT, 'hyperframes', id), A = path.join(OUT, 'assets'), CP = path.join(OUT, 'compositions');
fs.rmSync(OUT, { recursive: true, force: true }); [OUT, A, CP, path.join(A, 'fonts'), path.join(A, 'anh')].forEach(d => fs.mkdirSync(d, { recursive: true }));
const cp = (src, dst) => fs.copyFileSync(path.join(ROOT, src), path.join(A, dst));
const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
const r3 = x => Math.round(x * 1000) / 1000;

/* ---------- giọng Manus & thời lượng từng khối (giọng + 1 s, giọng vào sau 0,4 s) ---------- */
const probe = f => +execFileSync('ffprobe', ['-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', f]).toString().trim();
const vd = B.scenes.map((_, i) => { const f = path.join(ROOT, 'loi-dan', id, String(i + 1).padStart(2, '0') + '.mp3'); if (!fs.existsSync(f)) throw new Error('Thiếu giọng ' + f); cp(path.relative(ROOT, f), `giong-${String(i + 1).padStart(2, '0')}.mp3`); return probe(f); });
const S = [0]; vd.forEach(d => S.push(r3(S[S.length - 1] + d + 1))); const TOTAL = S[S.length - 1];
const khoi = (a, b = a) => ({ start: S[a], dur: r3(S[b + 1] - S[a]) });

/* ---------- tài nguyên ---------- */
['BeVietnamPro-600.ttf', 'BeVietnamPro-800.ttf', 'Oswald-700.ttf'].forEach(f => fs.copyFileSync(path.join(ROOT, 'tools', 'fonts', f), path.join(A, 'fonts', f)));
cp('lib/three.min.js', 'three.min.js'); cp('lib/vendor/gsap.min.js', 'gsap.min.js'); fs.copyFileSync(path.join(ROOT, 'hyperframes', '_chung', 'bando3d.js'), path.join(A, 'bando3d.js'));
cp(`maps/${id}/nen-3d.jpg`, 'nen-2k.jpg'); cp(`maps/${id}/do-cao.png`, 'do-cao.png');
const DU = JSON.parse(fs.readFileSync(path.join(ROOT, 'maps', id, 'tuyen.json'), 'utf8')), KB = JSON.parse(fs.readFileSync(path.join(ROOT, 'maps', id, 'kich-ban-ban-do.json'), 'utf8'));
fs.writeFileSync(path.join(A, 'du-lieu.js'), `/* dữ liệu bản đồ ${id} (tools/ban-do.mjs) + kịch bản (maps/${id}/kich-ban-ban-do.json) */\nwindow.BANDO = ${JSON.stringify({ du_lieu: { khung: DU.khung, tuyen: DU.tuyen.map(t => ({ ten: t.ten, ben: t.ben, xy: t.xy })), dia_danh: DU.dia_danh }, kich_ban: KB })};\n`);
const ANH = Object.fromEntries((B.anh || []).map(a => [a.slot, a])), anh = slot => { const a = ANH[slot]; if (!a) return null; cp(`anh/${id}/${a.file}`, `anh/${a.file}`); return a; };

/* ---------- nhạc nền Hùng ca (bộ tổng hợp của app) → maps/<id>/nhac-nen.mp3 (lưu lại, máy khác khỏi cần Playwright) ---------- */
{
  const luu = path.join(ROOT, 'maps', id, 'nhac-nen.mp3');
  if (!fs.existsSync(luu)) {
    const { chromium } = (() => { try { return require('playwright'); } catch (e) { return require(path.join(ROOT, 'tools', 'node_modules', 'playwright')); } })();
    const br = await chromium.launch(), pg = await br.newPage();
    await pg.goto(pathToFileURL(path.join(ROOT, 'index.html')).href + `?render=${id}&nhac=hungca-${(B.year.match(/\d+/) || ['7'])[0]}`); await pg.waitForFunction(() => window.STUDIO);
    const wav = path.join(A, '_nhac.wav'); fs.writeFileSync(wav, Buffer.from(await pg.evaluate(() => window.STUDIO.audio()), 'base64')); await br.close();
    execFileSync('ffmpeg', ['-v', 'error', '-y', '-i', wav, '-c:a', 'libmp3lame', '-b:a', '192k', luu]); fs.rmSync(wav);
  }
  fs.copyFileSync(luu, path.join(A, 'nhac.mp3'));
}

/* ---------- phần CSS dùng chung cho mọi cảnh ---------- */
const FONT = `@font-face{font-family:'Be Vietnam Pro';font-weight:600;src:url('assets/fonts/BeVietnamPro-600.ttf')}
@font-face{font-family:'Be Vietnam Pro';font-weight:800;src:url('assets/fonts/BeVietnamPro-800.ttf')}
@font-face{font-family:'Oswald VN';font-weight:700;src:url('assets/fonts/Oswald-700.ttf')}`;

/* ---------- cảnh tư liệu (ảnh thật, máy quay chậm, chú thích + nguồn) ---------- */
function tuLieu(cid, slot, dur, opt = {}) {
  const a = anh(slot) || anh('hook'); const p = cid;
  const html = `<template>
  <style>${FONT}
    #root{position:absolute;inset:0;background:#0b0907;overflow:hidden}
    #${p}-khung{position:absolute;inset:0}
    #${p}-anh{position:absolute;left:0;top:0;width:1920px;height:1080px;object-fit:${opt.contain ? 'contain' : 'cover'}}
    #${p}-toi{position:absolute;inset:0;background:linear-gradient(0deg,rgba(8,6,4,.85),rgba(8,6,4,0) 45%),linear-gradient(90deg,rgba(8,6,4,.6),rgba(8,6,4,0) 55%)}
    #${p}-hat{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 55%,rgba(0,0,0,.55))}
    #${p}-cap{position:absolute;left:110px;bottom:200px;max-width:1000px;font:italic 600 34px/1.35 'Be Vietnam Pro';color:#f4ead3;border-left:6px solid #c8352b;padding:10px 22px;background:rgba(10,8,6,.55)}
    #${p}-credit{position:absolute;right:30px;bottom:18px;font:600 16px 'Be Vietnam Pro';color:rgba(244,234,211,.7)}
    #${p}-kick{position:absolute;left:110px;top:150px;font:700 30px 'Oswald VN';letter-spacing:.3em;color:#d9c9a3}
    #${p}-tua{position:absolute;left:104px;top:196px;max-width:1500px;font:700 104px/1.05 'Oswald VN';color:#f4ead3;text-shadow:0 6px 30px rgba(0,0,0,.8)}
    #${p}-gach{position:absolute;left:110px;top:${opt.tua && opt.tua.length > 26 ? 440 : 330}px;height:6px;width:0;background:linear-gradient(90deg,#c8352b,#c9a45c)}
    #${p}-trich{position:absolute;left:180px;right:180px;top:300px;font:italic 600 54px/1.45 'Be Vietnam Pro';color:#f4ead3;text-shadow:0 4px 20px #000}
    #${p}-tacgia{position:absolute;right:200px;top:640px;font:700 30px 'Oswald VN';color:#c9a45c;letter-spacing:.08em}
  </style>
  <div id="root" data-composition-id="${cid}" data-width="1920" data-height="1080">
    <div id="${p}-khung"><img id="${p}-anh" src="assets/anh/${esc(a.file)}" alt=""></div>
    <div id="${p}-toi"></div><div id="${p}-hat"></div>
    ${opt.tua ? `<div id="${p}-kick">${esc(opt.kick || 'SỬ VIỆT')}</div><div id="${p}-tua">${esc(opt.tua)}</div><div id="${p}-gach"></div>` : ''}
    ${opt.trich ? `<div id="${p}-trich">“${esc(opt.trich)}”</div><div id="${p}-tacgia">— ${esc(opt.tacgia || '')}</div>` : ''}
    ${!opt.tua && !opt.trich ? `<div id="${p}-cap">${esc(a.caption)}</div>` : ''}
    <div id="${p}-credit">${esc(a.credit)}</div>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    tl.fromTo("#${p}-khung", { scale: ${opt.zoomRa ? 1.18 : 1.04}, x: 0 }, { scale: ${opt.zoomRa ? 1.04 : 1.16}, x: ${opt.lia || -40}, duration: ${dur}, ease: "none" }, 0);
    ${opt.tua ? `tl.fromTo("#${p}-kick", { opacity: 0, y: -16 }, { opacity: 1, y: 0, duration: .6, ease: "power3.out" }, .5);
    tl.fromTo("#${p}-tua", { opacity: 0, y: 30 }, { opacity: 1, y: 0, duration: .8, ease: "power3.out" }, .8);
    tl.fromTo("#${p}-gach", { width: 0 }, { width: 420, duration: .9, ease: "power2.out" }, 1.4);` : ''}
    ${opt.trich ? `tl.fromTo("#${p}-trich", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, .8);
    tl.fromTo("#${p}-tacgia", { opacity: 0 }, { opacity: 1, duration: .8 }, 2.2);` : ''}
    ${!opt.tua && !opt.trich ? `tl.fromTo("#${p}-cap", { opacity: 0, y: 16 }, { opacity: 1, y: 0, duration: .7, ease: "power2.out" }, .6);` : ''}
    window.__timelines["${cid}"] = tl;
  </script>
</template>
`;
  fs.writeFileSync(path.join(CP, cid + '.html'), html);
}

/* ---------- cảnh bản đồ chiến dịch 3D ---------- */
function banDo(cid, dur, sau, chu) {
  const p = cid;
  fs.writeFileSync(path.join(CP, cid + '.html'), `<template>
  <style>${FONT}
    #root{position:absolute;inset:0;background:#0d0b09;overflow:hidden}
    #${p}-khung{position:absolute;inset:0}
    #${p}-khung .bd-nhan{position:absolute;left:0;top:0;font:800 26px 'Be Vietnam Pro';color:#fff;padding:6px 14px;border-radius:6px;background:rgba(15,12,9,.78);white-space:nowrap;box-shadow:0 4px 18px rgba(0,0,0,.5)}
    #${p}-khung .bd-nhan.bd-ta{border-left:6px solid #c8352b}
    #${p}-khung .bd-nhan.bd-dich{border-left:6px solid #1f5fa8}
    #${p}-khung .bd-nhan:not(.bd-dia)::after{content:'';position:absolute;left:50%;top:100%;width:2px;margin-left:-1px;height:var(--chan,0px);background:linear-gradient(rgba(255,255,255,.85),rgba(255,255,255,.2))}
    #${p}-khung .bd-nhan.bd-dia{font:700 22px 'Be Vietnam Pro';color:#2b2118;background:rgba(244,234,211,.88);padding:3px 10px;box-shadow:none}
    #${p}-vien{position:absolute;inset:0;background:radial-gradient(ellipse at center,rgba(0,0,0,0) 60%,rgba(0,0,0,.5))}
    #${p}-the{position:absolute;left:90px;top:80px;font:700 30px 'Oswald VN';letter-spacing:.25em;color:#e9d9b4;text-shadow:0 2px 10px #000}
    ${chu ? `#${p}-chu{position:absolute;left:110px;bottom:210px;max-width:1100px}
    #${p}-chu div{font:700 64px/1.15 'Oswald VN';color:#f4ead3;text-shadow:0 4px 24px #000}
    #${p}-chu small{display:block;margin-top:14px;font:600 32px 'Be Vietnam Pro';color:#e9c98f}` : ''}
  </style>
  <div id="root" data-composition-id="${cid}" data-width="1920" data-height="1080" data-layout-allow-overflow>
    <div id="${p}-khung" data-layout-ignore></div>
    <img id="${p}-nen" src="assets/nen-2k.jpg" alt="" style="display:none">
    <img id="${p}-docao" src="assets/do-cao.png" alt="" style="display:none">
    <div id="${p}-vien"></div>
    <div id="${p}-the">${sau ? 'SAU TRẬN ĐÁNH' : 'BẢN ĐỒ CHIẾN DỊCH'} · ${esc(B.name.toUpperCase())}</div>
    ${chu ? `<div id="${p}-chu"><div>${esc(chu[0])}</div><small>${esc(chu[1])}</small></div>` : ''}
  </div>
  <script>
    (function () {
      const nen = document.getElementById("${p}-nen"), docao = document.getElementById("${p}-docao");
      const build = Promise.all([nen.decode(), docao.decode()]).then(() => {
        const kb = Object.assign({}, window.BANDO.kich_ban${sau ? ', { may_quay: window.BANDO.kich_ban.may_quay_sau }' : ''});
        const bd = window.BanDo3D(document.getElementById("${p}-khung"), { nen, doCao: docao, du_lieu: window.BANDO.du_lieu, kich_ban: kb, sau_tran: ${sau} });
        const tl = gsap.timeline({ paused: true }), dong = { t: 0 };
        tl.to(dong, { t: ${dur}, duration: ${dur}, ease: "none", onUpdate: () => bd.ve(dong.t) }, 0);
        tl.fromTo("#${p}-the", { opacity: 0 }, { opacity: 1, duration: .8 }, .3);
        ${chu ? `tl.fromTo("#${p}-chu", { opacity: 0, y: 24 }, { opacity: 1, y: 0, duration: 1, ease: "power2.out" }, 1.2);` : ''}
        bd.ve(0);
        window.__timelines["${cid}"] = tl;
      });
      window.__hf = window.__hf || {}; window.__hf.buildReady = window.__hf.buildReady || {}; window.__hf.buildReady["${cid}"] = build;
    })();
  </script>
</template>
`);
}

/* ---------- phụ đề: cắt câu, chia thời gian theo số chữ trong đoạn giọng ---------- */
function phuDe() {
  const items = []; B.scenes.forEach((sc, i) => {
    const parts = sc.say.replace(/\s+/g, ' ').trim().split(/(?<=[.!?;:,])\s+/).reduce((o, s) => { const L = o[o.length - 1]; if (L && (L + ' ' + s).split(' ').length <= 14) o[o.length - 1] = L + ' ' + s; else o.push(s); return o; }, []);
    const W = parts.reduce((a, s) => a + s.split(' ').length, 0); let t = S[i] + .4;
    parts.forEach(s => { const d = vd[i] * s.split(' ').length / W; items.push([r3(t), r3(d), s]); t += d; });
  });
  fs.writeFileSync(path.join(CP, 'phu-de.html'), `<template>
  <style>${FONT}
    #root{position:absolute;inset:0;pointer-events:none}
    #root .pd{position:absolute;left:240px;right:240px;bottom:64px;text-align:center;font:600 40px/1.35 'Be Vietnam Pro';color:#fff;text-shadow:0 2px 3px #000,0 0 14px rgba(0,0,0,.9)}
  </style>
  <div id="root" data-composition-id="phu-de" data-width="1920" data-height="1080" data-layout-allow-caption-zone>
${items.map(([s, d, t], k) => `    <div id="pd-${k}" class="clip pd" data-start="${s}" data-duration="${d}" data-track-index="1">${esc(t)}</div>`).join('\n')}
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
    window.__timelines["phu-de"] = tl;
  </script>
</template>
`);
}

/* ---------- dựng các cảnh ---------- */
const sc = B.scenes, ttl = sc[0];
tuLieu('mo-dau', 'hook', khoi(0).dur, { tua: B.name.replace(/\s\d{3,4}$/, '').toUpperCase() + ' ' + B.year, kick: (B.series || 'SỬ VIỆT · TRẬN ĐÁNH LỪNG DANH') });
tuLieu('nhan-vat', 'hero', khoi(1).dur, { contain: true, lia: 0 });
banDo('ban-do', khoi(2, 4).dur, false);
const q = sc.find(x => x.type === 'quote'); tuLieu('trich-dan', ANH.moc ? 'moc' : 'dienbien', khoi(5).dur, q && q.quote ? { trich: q.quote, tacgia: q.by, zoomRa: true } : { zoomRa: true });
const pts = sc.find(x => x.type === 'points'); banDo('sau-tran', khoi(6).dur, true, pts && pts.items ? [pts.items[0], pts.items.slice(1).join(' · ')] : null);
tuLieu('ket', ANH.ket ? 'ket' : 'hook', khoi(7).dur, {});
phuDe();

/* ---------- bản dựng gốc: cảnh, giọng, nhạc, chuyển cảnh mực bắn ---------- */
const CANH = [['mo-dau', khoi(0)], ['nhan-vat', khoi(1)], ['ban-do', khoi(2, 4)], ['trich-dan', khoi(5)], ['sau-tran', khoi(6)], ['ket', khoi(7)]];
const CAT = CANH.slice(1).map(([, k]) => k.start);
const muc = (k, t) => {   // vệt mực bắn: các đốm loang có răng cưa (hạt giống cố định)
  let seed = 1234 + k * 97; const R = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  // vệt mực trơn: điểm biên ngẫu nhiên (hạt giống cố định) nối bằng đường cong bậc hai qua trung điểm → mép mềm, không răng cưa
  const blob = (cx, cy, r, n = 28, gai = .32) => { const p = []; for (let i = 0; i < n; i++) { const a = i / n * Math.PI * 2, rr = r * (1 - gai / 2 + R() * gai); p.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr]); }
    const mid = i => [(p[i][0] + p[(i + 1) % n][0]) / 2, (p[i][1] + p[(i + 1) % n][1]) / 2], f = v => v.toFixed(1); let d = `M${f(mid(n - 1)[0])} ${f(mid(n - 1)[1])}`;
    for (let i = 0; i < n; i++) { const m = mid(i); d += `Q${f(p[i][0])} ${f(p[i][1])} ${f(m[0])} ${f(m[1])}`; } return d + 'Z'; };
  const cx = 760 + R() * 400, cy = 400 + R() * 280, giot = [];
  for (let i = 0; i < 16; i++) { const a = R() * Math.PI * 2, d = 380 + R() * 620; giot.push([cx + Math.cos(a) * d, cy + Math.sin(a) * d * .7, 30 + R() * 110]); }
  return `    <div id="muc-${k}" class="clip muc" data-start="${r3(t - .7)}" data-duration="1.45" data-track-index="2" style="z-index:${30 + k}" data-layout-ignore>
      <svg id="muc-${k}-svg" viewBox="0 0 1920 1080" width="1920" height="1080"><g id="muc-${k}-g" fill="#0b0806">
        <path id="muc-${k}-loi" d="${blob(cx, cy, 1750, 36, .2)}" style="transform-origin:${cx.toFixed(0)}px ${cy.toFixed(0)}px"/>
${giot.map(([x, y, r], i) => `        <path id="muc-${k}-giot${i}" class="muc-${k}-giot" d="${blob(x, y, r, 14, .45)}" style="transform-origin:${x.toFixed(0)}px ${y.toFixed(0)}px"/>`).join('\n')}
      </g></svg>
    </div>`;
};
const index = `<!doctype html>
<html lang="vi">
<head>
  <meta charset="utf-8">
  <title>${esc(B.name)} – bản đồ chiến dịch</title>
  <script src="assets/gsap.min.js"></script>
  <script src="assets/three.min.js"></script>
  <script src="assets/bando3d.js"></script>
  <script src="assets/du-lieu.js"></script>
  <style>
    #root{background:#0b0907}
    .muc{position:absolute;inset:0;pointer-events:none}
    .muc svg{position:absolute;left:0;top:0}
  </style>
</head>
<body>
  <div id="root" data-composition-id="main" data-start="0" data-duration="${TOTAL}" data-width="1920" data-height="1080">
${CANH.map(([cid, k], i) => `    <div id="${cid}" data-composition-id="${cid}" data-composition-src="compositions/${cid}.html" data-start="${k.start}" data-duration="${k.dur}" data-track-index="0" data-track-kind="graphics" data-width="1920" data-height="1080" style="z-index:${i + 1}"></div>`).join('\n')}
    <div id="phu-de" data-composition-id="phu-de" data-composition-src="compositions/phu-de.html" data-start="0" data-duration="${TOTAL}" data-track-index="3" data-track-kind="captions" data-width="1920" data-height="1080" style="z-index:20"></div>
${CAT.map((t, k) => muc(k, t)).join('\n')}
${vd.map((d, i) => `    <audio id="giong-${String(i + 1).padStart(2, '0')}" class="clip" src="assets/giong-${String(i + 1).padStart(2, '0')}.mp3" data-start="${r3(S[i] + .4)}" data-duration="${r3(d)}" data-track-index="4" data-volume="1"></audio>`).join('\n')}
    <audio id="nhac" class="clip" src="assets/nhac.mp3" data-start="0" data-duration="${TOTAL}" data-track-index="5" data-volume="0.32" data-fade-in="1.5" data-fade-out="3"></audio>
  </div>
  <script>
    const tl = gsap.timeline({ paused: true });
${CAT.map((t, k) => `    tl.fromTo(".muc-${k}-giot", { scale: 0 }, { scale: 1, duration: .35, ease: "back.out(2)", stagger: .015 }, ${r3(t - .7)});
    tl.fromTo("#muc-${k}-loi", { scale: 0 }, { scale: 1, duration: .62, ease: "power2.in" }, ${r3(t - .66)});
    tl.fromTo("#muc-${k}-g", { opacity: 1 }, { opacity: 0, duration: .7, ease: "sine.inOut" }, ${r3(t + .02)});
    tl.fromTo("#muc-${k}-loi", { scale: 1 }, { scale: 1.25, duration: .7, ease: "sine.out", immediateRender: false }, ${r3(t + .02)});`).join('\n')}
    window.__timelines["main"] = tl;
  </script>
</body>
</html>
`;
fs.writeFileSync(path.join(OUT, 'index.html'), index);
fs.writeFileSync(path.join(OUT, 'NGUON.md'), `# Nguồn – ${B.name}\n\n- Lời dẫn: battles.js (biên tập theo skill viet-su-ke-chuyen); giọng: Manus (loi-dan/${id}).\n- Ảnh tư liệu: xem anh/${id}/nguon.json.\n- Bản đồ: © OpenStreetMap contributors (ODbL); địa hình: Terrain Tiles trên AWS (SRTM, GMTED, ETOPO1…).\n- Nhạc nền: bộ tổng hợp Hùng ca của app.\n`);
console.log(`✔ hyperframes/${id}/ · ${TOTAL.toFixed(1)} giây · ${CANH.length} cảnh + phụ đề + ${CAT.length} chuyển cảnh mực bắn`);
