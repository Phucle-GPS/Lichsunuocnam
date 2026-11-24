/* =========================================================================
   NẠP GIỌNG – chỉ dùng cho Xưởng film Lịch sử Việt Nam
   - Nhận file giọng (mp3/mp4/m4a/wav/ogg/webm hoặc .zip chứa các file đó), dung lượng lớn.
   - Mỗi trận 1 file đọc liền 8 cảnh → tự cắt theo khoảng lặng + tỉ lệ số chữ của lời dẫn.
     Hoặc mỗi cảnh 1 file: <id-trận>_01.mp3 …
   - So từng đoạn với GIỌNG CHUẨN (cao độ, tốc độ đọc). Đoạn lệch → báo, không nạp.
   - "Lấy làm giọng chuẩn": hồ sơ giọng của các file vừa nạp thành giọng chuẩn cho mọi video sau.
   - Lưu trong IndexedDB của trình duyệt (Xuong.store) – không giới hạn như localStorage.
   ========================================================================= */
(function () {
  'use strict';
  const SR = 16000, IDX = 'xv-napgiong', STD = 'xv-giong-chuan';
  const ls = { get: (k, d) => { try { return JSON.parse(localStorage.getItem(k)) || d; } catch (e) { return d; } }, set: (k, v) => { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) {} } };
  let ctx = null; const AC = () => ctx || (ctx = new (window.AudioContext || window.webkitAudioContext)());

  /* ---------- giải mã & đo đạc ---------- */
  async function decode(blob) { return await AC().decodeAudioData(await blob.arrayBuffer()); }
  function mono16k(buf, a = 0, b = buf.duration) {
    const ch = buf.numberOfChannels, sr = buf.sampleRate, i0 = Math.floor(a * sr), i1 = Math.min(buf.length, Math.floor(b * sr)), step = sr / SR, n = Math.max(0, Math.floor((i1 - i0) / step)), out = new Float32Array(n);
    const C = []; for (let c = 0; c < ch; c++) C.push(buf.getChannelData(c));
    for (let k = 0; k < n; k++) { const i = i0 + Math.floor(k * step); let s = 0; for (let c = 0; c < ch; c++) s += C[c][i]; out[k] = s / ch; }
    return out;
  }
  /* cao độ trung vị (Hz) – cùng thuật toán với tools/phan-tich-giong.py (tự tương quan, cửa sổ 40 ms) */
  function pitch(x) {
    const win = 640, hop = 400, lo = Math.floor(SR / 260), hi = Math.floor(SR / 60), han = new Float32Array(win);
    for (let i = 0; i < win; i++) han[i] = .5 - .5 * Math.cos(2 * Math.PI * i / (win - 1));
    let all = 0; for (let i = 0; i < x.length; i++) all += x[i] * x[i]; all = Math.sqrt(all / Math.max(1, x.length)) + 1e-9;
    const f = new Float32Array(win), out = [];
    for (let s = 0; s + win < x.length; s += hop) {
      let e = 0; for (let i = 0; i < win; i++) { f[i] = x[s + i] * han[i]; e += f[i] * f[i]; }
      if (Math.sqrt(e / win) < all * .6 || e <= 0) continue;
      let bk = lo, bv = -1; for (let L = lo; L < hi; L++) { let v = 0; for (let i = 0; i + L < win; i++) v += f[i] * f[i + L]; if (v > bv) { bv = v; bk = L; } }
      if (bv / e > .45) out.push(SR / bk);
    }
    out.sort((p, q) => p - q); return out.length ? out[out.length >> 1] : 0;
  }
  /* các khoảng lặng ≥ 0,25 s (ngưỡng −38 dB so với đỉnh) */
  function silences(buf) {
    const x = mono16k(buf), hop = 320, E = []; let pk = 1e-9;
    for (let s = 0; s + hop <= x.length; s += hop) { let e = 0; for (let i = 0; i < hop; i++) e += x[s + i] * x[s + i]; e = Math.sqrt(e / hop); E.push(e); if (e > pk) pk = e; }
    const thr = pk * Math.pow(10, -38 / 20), out = []; let st = -1;
    E.forEach((e, i) => { if (e < thr) { if (st < 0) st = i; } else if (st >= 0) { if ((i - st) * .02 >= .25) out.push([st * .02, i * .02]); st = -1; } });
    return out;
  }
  const words = s => (s || '').trim().split(/\s+/).filter(Boolean).length;
  /* cắt 1 file đọc liền n cảnh → n đoạn [a,b] (giây) */
  function splitBattle(buf, says) {
    const dur = buf.duration, n = says.length, w = says.map(words), W = w.reduce((a, b) => a + b, 0) || 1;
    const S = silences(buf).filter(([a, b]) => a > .3 && b < dur - .2), m = S.length;
    if (m < n - 1) return null;
    const exp = []; for (let k = 0, c = 0; k < n - 1; k++) { c += w[k]; exp.push(c / W); }
    function run(PW, GW) {
      const INF = 1e18, best = Array.from({ length: n }, () => new Float64Array(m + 1).fill(INF)), prv = Array.from({ length: n }, () => new Int32Array(m + 1).fill(-1)); best[0][0] = 0;
      for (let k = 1; k < n; k++) for (let j = 1; j <= m; j++) {
        const [a, b] = S[j - 1], cost = Math.pow((a + b) / 2 / dur - exp[k - 1], 2) * PW - Math.min(b - a, 2.5) * GW;
        for (let i = 0; i < j; i++) if (best[k - 1][i] < INF && best[k - 1][i] + cost < best[k][j]) { best[k][j] = best[k - 1][i] + cost; prv[k][j] = i; }
      }
      let j = 1; for (let x = 2; x <= m; x++) if (best[n - 1][x] < best[n - 1][j]) j = x;
      const cuts = []; for (let k = n - 1; k > 0; k--) { cuts.unshift(S[j - 1]); j = prv[k][j]; }
      const e = [0, ...cuts.map(([a, b]) => (a + b) / 2), dur], r = w.map((x, i) => x / Math.max(.1, e[i + 1] - e[i] - .3));
      const bad = r.filter((x, i) => !(x >= 2 && x <= (i === n - 1 ? 4.9 : 4.4))).length, mu = r.reduce((a, b) => a + b, 0) / n, sd = Math.sqrt(r.reduce((a, b) => a + (b - mu) ** 2, 0) / n);
      return { score: bad * 100 + sd, e };
    }
    let best = null; for (const pw of [100, 250, 400, 800]) for (const gw of [1, 3, 5, 8]) { const r = run(pw, gw); if (!best || r.score < best.score) best = r; }
    return best.e.slice(0, -1).map((a, i) => [a, best.e[i + 1]]);
  }
  /* cắt bớt lặng đầu/cuối của đoạn [a,b] */
  function trim(buf, a, b) {
    const sr = buf.sampleRate, d = buf.getChannelData(0), win = Math.floor(sr * .02); let pk = 1e-9;
    for (let i = Math.floor(a * sr); i < Math.floor(b * sr); i++) pk = Math.max(pk, Math.abs(d[i] || 0));
    const thr = pk * .03, loud = i => { let m = 0; for (let k = i; k < i + win && k < d.length; k++) m = Math.max(m, Math.abs(d[k])); return m > thr; };
    let s = Math.floor(a * sr), t = Math.floor(b * sr);
    while (s < t - win && !loud(s)) s += win; while (t > s + win && !loud(t - win)) t -= win;
    return [Math.max(a, s / sr - .08), Math.min(b, t / sr + .12)];
  }
  /* đoạn → WAV 16 bit mono 24 kHz, chuẩn âm lượng ~ −16 LUFS (xấp xỉ theo RMS) */
  function wav(buf, a, b) {
    const sr = 24000, ch = buf.numberOfChannels, src = buf.sampleRate, n = Math.floor((b - a) * sr), x = new Float32Array(n), C = [];
    for (let c = 0; c < ch; c++) C.push(buf.getChannelData(c));
    let rms = 0; for (let k = 0; k < n; k++) { const i = Math.floor(a * src + k * src / sr); let s = 0; for (let c = 0; c < ch; c++) s += C[c][i] || 0; x[k] = s / ch; rms += x[k] * x[k]; }
    rms = Math.sqrt(rms / Math.max(1, n)); const g = Math.min(8, (0.11) / (rms + 1e-6));
    const ab = new ArrayBuffer(44 + n * 2), v = new DataView(ab), ws = (o, t) => [...t].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); ws(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true); v.setUint32(24, sr, true); v.setUint32(28, sr * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 2, true);
    for (let k = 0; k < n; k++) v.setInt16(44 + k * 2, Math.max(-1, Math.min(1, x[k] * g)) * 32767, true);
    return new Blob([ab], { type: 'audio/wav' });
  }

  /* ---------- giọng chuẩn ---------- */
  async function standard() {
    const s = ls.get(STD, null); if (s) return s;
    let d = {}; try { d = (await (await fetch('loi-dan/GIONG.json', { cache: 'no-cache' })).json()).dac_tinh || {}; } catch (e) {}
    return { ten: 'Giọng Manus gốc (6 trận đầu)', f0: d.f0_trung_vi || 119.4, dung_sai: d.f0_dung_sai || 12, cmg: d.chu_moi_giay || [2.28, 4.12], mau: 'loi-dan/giong-mau.mp3' };
  }
  async function setStandard(f0s, wps, name, sampleBlob) {
    f0s = f0s.filter(Boolean).sort((a, b) => a - b); wps = wps.filter(Boolean).sort((a, b) => a - b);
    const med = f0s[f0s.length >> 1], sd = Math.sqrt(f0s.reduce((a, b) => a + (b - med) ** 2, 0) / f0s.length), q = p => wps[Math.min(wps.length - 1, Math.floor(p * wps.length))];
    const mauId = sampleBlob ? await Xuong.store.putAsset(sampleBlob) : '';
    const s = { ten: name, f0: Math.round(med * 10) / 10, dung_sai: Math.round(Math.max(12, 2 * sd) * 10) / 10, cmg: [Math.round(q(.05) * .9 * 100) / 100, Math.round(q(.95) * 1.1 * 100) / 100], mauId, ngay: new Date().toISOString().slice(0, 10) };
    ls.set(STD, s); return s;
  }
  function resetStandard() { try { localStorage.removeItem(STD); } catch (e) {} }

  /* ---------- kho giọng đã nạp: { idTrận: { ngay, ten, doan: [assetId…] } } ---------- */
  const index = () => ls.get(IDX, {});
  async function clips(id) { const r = index()[id]; if (!r) return null; return Promise.all(r.doan.map(a => Xuong.store.getAsset(a))); }
  async function remove(id) { const I = index(); if (I[id]) { I[id].doan.forEach(a => Xuong.store.delAsset(a)); delete I[id]; ls.set(IDX, I); } }

  /* ---------- đọc danh sách file (giải nén .zip) → [{name, blob}] ---------- */
  const AUD = /\.(mp3|mp4|m4a|aac|wav|ogg|oga|opus|webm|mov|flac)$/i;
  async function expand(files) {
    const out = [];
    for (const f of files) {
      if (/\.zip$/i.test(f.name)) {
        if (!window.JSZip) await new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'lib/jszip.min.js'; s.onload = ok; s.onerror = no; document.head.appendChild(s); });
        const z = await JSZip.loadAsync(f);
        for (const [n, e] of Object.entries(z.files)) if (!e.dir && AUD.test(n)) out.push({ name: n.split('/').pop(), blob: await e.async('blob') });
      } else if (AUD.test(f.name)) out.push({ name: f.name, blob: f });
      else out.push({ name: f.name, blob: null, err: /\.rar$/i.test(f.name) ? 'File .rar: hãy nén lại dạng .zip (trình duyệt không mở được .rar)' : 'Không phải file âm thanh' });
    }
    return out;
  }
  /* gom theo trận: tên file chứa id trận; "_NN" = file theo cảnh */
  const slug = t => (t || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
  const BO = new Set(['tran', 'khoi', 'nghia', 'thanh', 'dai', 'don', 'va', 'giong', 'doc', 'loi', 'dan', 'mp3', 'mp4', 'file', 'phan', 'canh']);
  /* tên file → trận: ưu tiên mã trận (ha-noi-1882), rồi tên trận (Thành Hà Nội 1882), rồi năm + từ khóa tên trận */
  function matchName(name, battles) {
    const base = slug(name.replace(/\.[^.]+$/, '')), tok = base.split('-');
    for (const b of [...battles].sort((x, y) => y.id.length - x.id.length)) if (('-' + base + '-').includes('-' + b.id + '-')) return { b, key: b.id };
    for (const b of battles) { const k = slug(b.name); if (base.includes(k)) return { b, key: k }; }
    let best = null, bs = 0, tie = false;
    battles.forEach(b => {
      const yr = String(b.year || '').split(/\D+/).filter(Boolean), words = [...new Set(slug(b.name).split('-').filter(w => !/^\d+$/.test(w) && !BO.has(w)))];
      const hitYear = yr.some(y => tok.includes(y)), hit = words.filter(w => tok.includes(w)).length, who = slug(b.who).split('-').filter(Boolean);
      const hitWho = who.length && who.every(w => tok.includes(w));   // tên người chỉ huy (vd: Quang Trung 1789)
      const sc = (hitYear ? 2 : 0) + hit / Math.max(1, words.length) * 3 + (hitWho ? 1 : 0) + (hit >= 2 ? 1 : 0);
      if (sc > bs) { bs = sc; best = b; tie = false; } else if (sc === bs && sc > 0) tie = true;
    });
    return best && bs >= 2.5 && !tie ? { b: best, key: '' } : null;
  }
  function group(list, battles) {
    const G = {}, lost = [];
    list.forEach(it => {
      if (!it.blob) return lost.push(it);
      const m = matchName(it.name, battles);
      if (!m) return lost.push(Object.assign(it, { err: 'Không nhận ra trận từ tên file – đặt tên có mã hoặc tên trận, vd: ha-noi-1882.mp3 hoặc "Thành Hà Nội 1882.mp4"' }));
      const id = m.b.id, base = slug(it.name.replace(/\.[^.]+$/, '')), tail = base.match(/(?:^|-)0?(\d{1,2})$/);
      const n = tail && +tail[1] >= 1 && +tail[1] <= m.b.scenes.length && !String(m.b.year).endsWith(tail[1]) ? +tail[1] : 0;   // đuôi _01…_08 = từng cảnh
      (G[id] = G[id] || { whole: null, parts: {} });
      if (n) G[id].parts[n] = it; else G[id].whole = it;
    });
    return { G, lost };
  }

  /* ---------- xử lý 1 trận → báo cáo từng cảnh ---------- */
  async function analyzeBattle(b, g, std, onStep) {
    const says = b.scenes.map(s => s.say || ''), rows = [];
    if (g.whole) {
      onStep && onStep('Đang giải mã ' + g.whole.name + '…');
      const buf = await decode(g.whole.blob); onStep && onStep('Đang cắt cảnh ' + b.name + '…');
      const seg = splitBattle(buf, says);
      if (!seg) return { err: 'Không tìm đủ ' + (says.length - 1) + ' quãng lặng giữa các cảnh – hãy đọc nghỉ ~2 giây giữa các cảnh.' };
      seg.forEach(([a, c], i) => { const [s, t] = trim(buf, a, c); rows.push({ i, buf, a: s, b: t }); });
    } else {
      for (let i = 0; i < says.length; i++) { const it = g.parts[i + 1]; if (!it) { rows.push({ i, miss: true }); continue; } const buf = await decode(it.blob); const [s, t] = trim(buf, 0, buf.duration); rows.push({ i, buf, a: s, b: t }); }
    }
    rows.forEach(r => {
      if (r.miss) { r.ok = false; r.why = 'thiếu file'; return; }
      r.d = r.b - r.a; r.wps = words(says[r.i]) / Math.max(.1, r.d);
      const why = [];   // chỉ kiểm tra cắt lệch lời (tốc độ bất thường); KHÔNG so cao độ – giọng thay đổi theo tình tiết trận
      if (r.wps < 1.8 || r.wps > (r.i === says.length - 1 ? 5.6 : 5.2)) why.push(`tốc độ ${r.wps.toFixed(1)} chữ/giây – có thể cắt lệch lời`);
      r.ok = !why.length; r.why = why.join(' · ');
    });
    return { rows };
  }
  /* ---------- SKILL GIỌNG của người dùng: lưu trong app, chọn làm giọng cho các trận sau ----------
     Nhận: .zip skill (có SKILL.md, có thể kèm file giọng mẫu) · .md/.txt · hoặc file giọng mẫu mp3/mp4/wav */
  const SK = 'xv-skill-giong', SKA = 'xv-skill-giong-dung';
  const skills = () => ls.get(SK, []), activeSkill = () => { const id = ls.get(SKA, ''); return skills().find(x => x.id === id) || null; };
  const setActive = id => ls.set(SKA, id || '');
  function front(md) {   // đọc name/description ở phần đầu SKILL.md
    const m = (md || '').match(/^---\s*([\s\S]*?)\n---/), g = k => { const r = m && m[1].match(new RegExp('^' + k + ':\\s*(.+)$', 'm')); return r ? r[1].trim().replace(/^["']|["']$/g, '') : ''; };
    return { ten: g('name'), mota: g('description') };
  }
  async function addSkill(file) {
    let ten = file.name.replace(/\.[^.]+$/, ''), mota = '', noidung = '', mau = null;
    if (/\.(zip|skill)$/i.test(file.name)) {
      if (!window.JSZip) await new Promise((ok, no) => { const sc = document.createElement('script'); sc.src = 'lib/jszip.min.js'; sc.onload = ok; sc.onerror = no; document.head.appendChild(sc); });
      const z = await JSZip.loadAsync(file), ents = Object.values(z.files).filter(e => !e.dir);
      const md = ents.find(e => /(^|\/)SKILL\.md$/i.test(e.name)) || ents.find(e => /\.md$/i.test(e.name));
      if (md) { noidung = await md.async('string'); const f = front(noidung); ten = f.ten || ten; mota = f.mota; }
      const au = ents.find(e => AUD.test(e.name)); if (au) mau = await au.async('blob');
    } else if (/\.(md|txt)$/i.test(file.name)) { noidung = await file.text(); const f = front(noidung); ten = f.ten || ten; mota = f.mota; }
    else if (AUD.test(file.name)) { mau = file; mota = 'Giọng mẫu: ' + file.name; }
    else throw new Error('Chưa nhận dạng được file skill (dùng .zip, .md, .txt hoặc file giọng mẫu mp3/mp4).');
    const sk = { id: 'sk-' + Date.now().toString(36), ten, mota, noidung: noidung.slice(0, 20000), tep: file.name, ngay: new Date().toISOString().slice(0, 10),
      goc: await Xuong.store.putAsset(file), mauId: mau ? await Xuong.store.putAsset(mau) : '' };
    ls.set(SK, [...skills(), sk]); setActive(sk.id); try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
    return sk;
  }
  async function removeSkill(id) { const L = skills(), k = L.find(x => x.id === id); if (!k) return; if (k.goc) Xuong.store.delAsset(k.goc); if (k.mauId) Xuong.store.delAsset(k.mauId); ls.set(SK, L.filter(x => x.id !== id)); if (ls.get(SKA, '') === id) setActive(''); }

  async function save(b, rows, name) {
    await remove(b.id); const doan = [];
    for (const r of rows) doan.push(await Xuong.store.putAsset(wav(r.buf, r.a, r.b)));
    const sk = activeSkill(), I = index(); I[b.id] = { ngay: new Date().toISOString().slice(0, 10), ten: name, doan, skill: sk ? sk.ten : '' }; ls.set(IDX, I);
    try { navigator.storage && navigator.storage.persist && navigator.storage.persist(); } catch (e) {}
  }
  window.NapGiong = { skills, activeSkill, setActive, addSkill, removeSkill, matchName, expand, group, analyzeBattle, save, clips, remove, index, standard, setStandard, resetStandard, wav, decode, pitch, mono16k };
})();
