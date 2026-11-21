/* =========================================================================
   XƯỞNG PHIM – nhập kịch bản, tạo dự án, chia tập, lưu trữ trong máy
   Đọc: .txt .md (văn bản), .srt (phụ đề), .docx (Word), .pdf
   ========================================================================= */
(function () {
  'use strict';
  const STYLES = { tailieu: 'Tài liệu', vientuong: 'Viễn tưởng', hoathinh: 'Hoạt hình' };
  const uid = () => Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4);
  const words = t => (t || '').trim().split(/\s+/).filter(Boolean).length;
  const clean = t => (t || '').replace(/ /g, ' ').replace(/[ \t]+/g, ' ').trim();

  function loadScript(src) {
    return new Promise((ok, no) => { if (document.querySelector(`script[src="${src}"]`)) return ok(); const e = document.createElement('script'); e.src = src; e.onload = ok; e.onerror = () => no(new Error('Không tải được ' + src)); document.head.appendChild(e); });
  }

  /* ---------- nhận diện dòng ---------- */
  const RX_HEAD = /^(#{1,6}\s+|(cảnh|phần|chương|tập|hồi|màn|scene|part|chapter)\s*[\dIVXLC]+\b[\s.:–-]*)/i;
  const RX_BULLET = /^\s*([-•*+–]|\d{1,2}[.)])\s+/;
  function isHeading(line) {
    const l = line.trim();
    if (!l || l.length > 90) return false;
    if (RX_HEAD.test(l)) return true;
    const letters = l.replace(/[^A-Za-zÀ-ỹ]/g, '');
    if (letters.length >= 3 && l.length <= 70 && letters === letters.toUpperCase() && !/[.!?,;]$/.test(l)) return true;
    return /:$/.test(l) && l.length <= 50;
  }
  const stripHead = l => l.trim().replace(/^#{1,6}\s+/, '').replace(/:$/, '').trim();

  /* văn bản thuần → các khối {kind: heading|para|list|quote, text, items} */
  function blocksFromLines(lines) {
    const out = []; let para = [], list = null;
    const flushP = () => { if (para.length) { const t = clean(para.join(' ')); if (t) out.push(/^[“"«>]/.test(t) ? { kind: 'quote', text: t.replace(/^>\s*/, '') } : { kind: 'para', text: t }); } para = []; };
    const flushL = () => { if (list && list.length) out.push({ kind: 'list', items: list }); list = null; };
    for (const raw of lines) {
      const line = raw.replace(/\r/g, '');
      if (!line.trim()) { flushP(); flushL(); continue; }
      if (RX_BULLET.test(line)) { flushP(); (list = list || []).push(clean(line.replace(RX_BULLET, ''))); continue; }
      if (isHeading(line)) { flushP(); flushL(); out.push({ kind: 'heading', text: stripHead(line) }); continue; }
      flushL(); if (/^\s*[“"«>]/.test(line)) flushP(); para.push(line.trim()); if (/[”"»]\s*([—–-].*)?$/.test(line.trim()) && /^[“"«]/.test(para[0] || '')) flushP();
    }
    flushP(); flushL();
    return out;
  }
  function parseText(text) { return blocksFromLines(text.split('\n')); }

  function parseSRT(text) {
    const cues = text.replace(/\r/g, '').split(/\n\s*\n/).map(b => {
      const ls = b.split('\n').filter(Boolean); const ti = ls.findIndex(l => /-->/.test(l)); if (ti < 0) return null;
      const m = ls[ti].match(/(\d+):(\d+):(\d+)[,.](\d+)\s*-->\s*(\d+):(\d+):(\d+)[,.](\d+)/); if (!m) return null;
      const s = (+m[1]) * 3600 + (+m[2]) * 60 + (+m[3]) + (+m[4]) / 1000, e = (+m[5]) * 3600 + (+m[6]) * 60 + (+m[7]) + (+m[8]) / 1000;
      return { s, e, text: clean(ls.slice(ti + 1).join(' ').replace(/<[^>]+>/g, '')) };
    }).filter(c => c && c.text);
    const out = []; let cur = [], lastE = 0;
    cues.forEach(c => {
      if (cur.length && (c.s - lastE > 1.5 || words(cur.join(' ')) > 40)) { out.push({ kind: 'para', text: cur.join(' ') }); cur = []; }
      cur.push(c.text); lastE = c.e;
    });
    if (cur.length) out.push({ kind: 'para', text: cur.join(' ') });
    return out;
  }

  async function parseDOCX(buf) {
    await loadScript('lib/jszip.min.js');
    const zip = await JSZip.loadAsync(buf);
    const xml = await zip.file('word/document.xml').async('string');
    const doc = new DOMParser().parseFromString(xml, 'application/xml');
    const W = 'http://schemas.openxmlformats.org/wordprocessingml/2006/main';
    const lines = [];
    for (const p of doc.getElementsByTagNameNS(W, 'p')) {
      let t = '';
      for (const n of p.getElementsByTagNameNS(W, '*')) { if (n.localName === 't') t += n.textContent; else if (n.localName === 'tab') t += ' '; else if (n.localName === 'br') t += ' '; }
      const st = p.getElementsByTagNameNS(W, 'pStyle')[0], sv = st ? (st.getAttributeNS(W, 'val') || st.getAttribute('w:val') || '') : '';
      const isList = p.getElementsByTagNameNS(W, 'numPr').length > 0;
      if (!t.trim()) { lines.push(''); continue; }
      if (/heading|title|tieude|tiêu/i.test(sv)) lines.push('', '# ' + t.trim(), '');
      else if (isList) lines.push('- ' + t.trim());
      else lines.push(t.trim(), '');
    }
    return blocksFromLines(lines);
  }

  async function parsePDF(buf) {
    await loadScript('lib/pdf.min.js');
    pdfjsLib.GlobalWorkerOptions.workerSrc = 'lib/pdf.worker.min.js';
    const pdf = await pdfjsLib.getDocument({ data: buf }).promise;
    const rows = [];
    for (let i = 1; i <= pdf.numPages; i++) {
      const tc = await (await pdf.getPage(i)).getTextContent();
      let line = null;
      tc.items.forEach(it => {
        const y = Math.round(it.transform[5]), hgt = Math.abs(it.transform[3]) || it.height || 10;
        if (!line || Math.abs(line.y - y) > hgt * .5) { if (line) rows.push(line); line = { y, h: hgt, text: '' }; }
        line.text += it.str; line.h = Math.max(line.h, hgt);
      });
      if (line) rows.push(line);
      rows.push({ y: -1, h: 0, text: '' });
    }
    const hs = rows.filter(r => r.text.trim()).map(r => r.h).sort((a, b) => a - b), med = hs[Math.floor(hs.length / 2)] || 10;
    const lines = []; let prevY = null, prevH = med;
    rows.forEach(r => {
      if (!r.text.trim()) { lines.push(''); prevY = null; return; }
      if (prevY != null && prevY - r.y > prevH * 1.9) lines.push('');
      if (r.h > med * 1.25 && r.text.length < 90) lines.push('', '# ' + r.text.trim(), '');
      else lines.push(r.text.trim());
      prevY = r.y; prevH = r.h;
    });
    return blocksFromLines(lines);
  }

  async function parseFile(file) {
    const name = file.name.replace(/\.[^.]+$/, '');
    const ext = (file.name.split('.').pop() || '').toLowerCase();
    let blocks;
    if (ext === 'docx') blocks = await parseDOCX(await file.arrayBuffer());
    else if (ext === 'pdf') blocks = await parsePDF(await file.arrayBuffer());
    else if (ext === 'srt' || ext === 'vtt') blocks = parseSRT(await file.text());
    else if (ext === 'doc') throw new Error('File .doc (Word cũ) chưa hỗ trợ. Hãy mở bằng Word rồi Lưu thành .docx.');
    else blocks = parseText(await file.text());
    return { name, blocks };
  }

  /* ---------- khối → cảnh ---------- */
  function splitSentences(text, maxW) {
    const sents = text.split(/(?<=[.!?…])\s+/); const out = []; let cur = '';
    sents.forEach(s => { if (cur && words(cur + ' ' + s) > maxW) { out.push(cur); cur = s; } else cur = cur ? cur + ' ' + s : s; });
    if (cur) out.push(cur);
    return out.flatMap(c => { if (words(c) <= maxW * 1.6) return [c]; const ws = c.split(' '), r = []; for (let i = 0; i < ws.length; i += maxW) r.push(ws.slice(i, i + maxW).join(' ')); return r; });
  }
  function scenesFromBlocks(blocks, maxW = 42) {
    const scenes = []; let heading = null, part = 0, kicker = '';
    blocks.forEach(b => {
      if (b.kind === 'heading') {
        part++; heading = b.text; kicker = `PHẦN ${part}`;
        const m = b.text.match(/^((?:cảnh|phần|chương|tập|hồi|màn|scene|part|chapter)\s*[\dIVXLC]+)\s*[:.–-]?\s*(.*)$/i);
        if (m) { kicker = m[1].toUpperCase(); heading = m[2] || ''; }
        return;
      }
      if (b.kind === 'list') {
        const items = b.items.slice(0, 5).map(x => x.length > 80 ? x.slice(0, 77) + '…' : x);
        scenes.push({ uid: uid(), type: 'points', title: (heading || kicker || 'Ý chính').toUpperCase(), items, say: b.items.join('. ').replace(/\.\./g, '.') });
        heading = null; kicker = ''; return;
      }
      if (b.kind === 'quote') {
        const m = b.text.match(/^[“"«]?(.*?)[”"»]?\s*(?:[—–-]\s*(.+))?$/);
        const q = (m ? m[1] : b.text).slice(0, 240);
        scenes.push({ uid: uid(), type: 'quote', quote: q, by: m && m[2] ? m[2] : '', say: b.text.replace(/[“”"«»]/g, '') });
        return;
      }
      splitSentences(b.text, maxW).forEach(chunk => {
        scenes.push({ uid: uid(), type: 'card', heading: heading || '', kicker: kicker || '', say: chunk });
        heading = null; kicker = '';
      });
    });
    return scenes;
  }

  function newProject({ name, style, epLen, blocks }) {
    const firstHead = blocks.find(b => b.kind === 'heading');
    let nm = clean(name) || (firstHead && firstHead.text) || 'Dự án mới';
    if (firstHead && blocks[0] === firstHead && !name) blocks = blocks.slice(1);
    const scenes = scenesFromBlocks(blocks);
    return { id: 'u-' + uid(), custom: true, name: nm, style: style || 'tailieu', epLen: epLen || 0, created: Date.now(), updated: Date.now(), scenes };
  }

  /* ---------- chia tập & dựng nguồn phim ---------- */
  function episodes(p) {
    const content = p.scenes, max = +p.epLen || 0;
    if (!max) return [content];
    const eps = []; let cur = [], acc = 0, budget = Math.max(20, max - 12);
    content.forEach(sc => {
      const d = (sc._dur || Studio.sceneDur(sc));
      if (cur.length && acc + d > budget) { eps.push(cur); cur = []; acc = 0; }
      cur.push(sc); acc += d;
    });
    if (cur.length) eps.push(cur);
    return eps;
  }
  function filmSource(p, epIndex, mediaUrl) {
    const eps = episodes(p), n = eps.length, i = Math.min(epIndex || 0, n - 1);
    const name = p.name.trim(), up = name.toUpperCase();
    const size = up.length <= 10 ? 220 : up.length <= 16 ? 170 : up.length <= 24 ? 128 : up.length <= 36 ? 96 : 74;
    const title = { type: 'title', _auto: 'title', title: up, size, sub: n > 1 ? `TẬP ${i + 1} / ${n}` : STYLES[p.style].toUpperCase(), line: '', say: n > 1 ? `${name}. Tập ${i + 1}.` : name + '.', min: 4.5 };
    const end = { type: 'end', _auto: 'end', title: i < n - 1 ? 'CÒN TIẾP…' : 'CẢM ƠN ĐÃ THEO DÕI', sub: name, next: i < n - 1 ? `Tập ${i + 2}` : '', say: i < n - 1 ? 'Hẹn gặp lại bạn ở tập tiếp theo.' : 'Cảm ơn bạn đã theo dõi.', min: 4 };
    const scenes = [title, ...eps[i].map(sc => {
      const o = Object.assign({}, sc, { _uid: sc.uid });
      if (sc.type === 'quote') o.by = sc.by || '';
      if (sc.mediaId && mediaUrl) { const u = mediaUrl(sc.mediaId); if (u) o.media = { url: u, kind: sc.mediaKind || 'image' }; }
      return o;
    }), end];
    return { id: p.id, custom: true, name, year: '', who: STYLES[p.style], vs: '', style: p.style, seed: (p.created % 97) + 3, series: up.length > 42 ? up.slice(0, 40) + '…' : up, scenes, epCount: n, ep: i };
  }

  /* ---------- lưu trữ: IndexedDB ---------- */
  let dbp = null;
  function db() {
    if (!dbp) dbp = new Promise((ok, no) => {
      const r = indexedDB.open('xuong-phim', 1);
      r.onupgradeneeded = () => { r.result.createObjectStore('projects', { keyPath: 'id' }); r.result.createObjectStore('assets'); };
      r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error);
    });
    return dbp;
  }
  async function tx(store, mode, fn) {
    const d = await db();
    return new Promise((ok, no) => { const t = d.transaction(store, mode), st = t.objectStore(store); const r = fn(st); t.oncomplete = () => ok(r && r.result); t.onerror = () => no(t.error); });
  }
  const store = {
    list: async () => (await tx('projects', 'readonly', s => s.getAll()) || []).sort((a, b) => b.updated - a.updated),
    save: p => { p.updated = Date.now(); const c = JSON.parse(JSON.stringify(p, (k, v) => k.startsWith('_') ? undefined : v)); return tx('projects', 'readwrite', s => s.put(c)); },
    remove: async p => { for (const sc of p.scenes) { if (sc.mediaId) await store.delAsset(sc.mediaId); if (sc.voiceId) await store.delAsset(sc.voiceId); } return tx('projects', 'readwrite', s => s.delete(p.id)); },
    putAsset: async blob => { const id = 'a-' + uid(); await tx('assets', 'readwrite', s => s.put(blob, id)); return id; },
    getAsset: id => tx('assets', 'readonly', s => s.get(id)),
    delAsset: id => tx('assets', 'readwrite', s => s.delete(id))
  };

  window.Xuong = { STYLES, parseFile, parseText, newProject, scenesFromBlocks, episodes, filmSource, store, uid };
})();
