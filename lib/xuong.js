/* =========================================================================
   XƯỞNG PHIM – nhập kịch bản, tạo dự án, chia tập, lưu trữ trong máy
   Đọc: .txt .md (văn bản), .srt (phụ đề), .docx (Word), .pdf
   ========================================================================= */
(function () {
  'use strict';
  const STYLES = { tailieu: 'Tài liệu', vientuong: 'Viễn tưởng', hoathinh: 'Hoạt hình', cotich: 'Cổ tích', langque: 'Làng quê', vutru: 'Vũ trụ' };
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
    if (/:$/.test(l) && l.length <= 50) return true;
    // dòng ngắn (≤ 6 chữ), viết hoa chữ đầu, không có dấu câu cuối ⇒ tiêu đề
    return l.split(/\s+/).length <= 6 && l.length <= 45 && /^[A-ZÀ-Ỹ0-9]/.test(l) && !/[.!?,;…"”]$/.test(l);
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
  /* kịch bản chia khối "=== AVATAR 01 ===" / "=== SLIDE 01 ===" (mỗi khối = 1 file giọng) */
  const RX_BLK = /^\s*={2,}\s*([A-Za-zÀ-ỹ]+)[\s_-]*(\d{1,3})\s*={2,}\s*$/;
  function blockScript(text) {
    const out = {}, order = []; let cur = null;
    text.replace(/\r/g, '').split('\n').forEach(l => {
      const m = l.match(RX_BLK);
      if (m) { cur = m[1].toUpperCase() + '-' + m[2].padStart(2, '0'); order.push(cur); out[cur] = []; return; }
      if (cur && l.trim()) out[cur].push(l.trim());
    });
    return order.length ? order.map(code => ({ kind: 'para', code, text: clean(out[code].join(' ')) })).filter(b => b.text) : null;
  }
  function parseText(text) { return blockScript(text) || blocksFromLines(text.split('\n')); }

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


  /* ---------- NHẬN DIỆN SỐ LIỆU ---------- */
  const DIG = { 'không': 0, 'một': 1, 'mốt': 1, 'hai': 2, 'ba': 3, 'bốn': 4, 'tư': 4, 'năm': 5, 'lăm': 5, 'nhăm': 5, 'sáu': 6, 'bảy': 7, 'bẩy': 7, 'tám': 8, 'chín': 9 };
  const MUL = { 'nghìn': 1e3, 'ngàn': 1e3, 'vạn': 1e4, 'triệu': 1e6, 'tỷ': 1e9, 'tỉ': 1e9 };
  const PRE = ['hơn', 'khoảng', 'gần', 'trên', 'tới', 'đến', 'hàng', 'chừng', 'dưới', 'ngót', 'tầm', 'gồm', 'có'];
  const STOP = new Set(['và', 'của', 'đã', 'được', 'với', 'trong', 'tại', 'để', 'thì', 'mà', 'nhưng', 'rồi', 'cho', 'là', 'bị', 'từ', 'sang', 'theo', 'khi', 'nên', 'vì', 'do', 'này', 'đó', 'kéo', 'tiến', 'đánh', 'so', 'lên', 'xuống', 'ra', 'vào']);
  const isNumWord = w => w in DIG || w === 'mười' || w === 'mươi' || w === 'trăm' || w === 'linh' || w === 'lẻ' || w in MUL;
  const isDigits = w => /^\d+([.,]\d+)*%?$/.test(w);
  function numFromDigits(w) {
    w = w.replace(/%$/, '');
    if (/^\d{1,3}([.,]\d{3})+$/.test(w)) return +w.replace(/[.,]/g, '');
    return +w.replace(',', '.');
  }
  /* "hai mươi chín vạn" → {value: 290000, shown: 29, scale: 'vạn'} */
  function numFromWords(ws) {
    let total = 0, group = 0, last = 0, scale = '', shown = 0, after = '';
    for (const w of ws) {
      if (w in DIG) { group += DIG[w]; last = DIG[w]; after = 'd'; }
      else if (w === 'mười') { group += 10; last = 10; after = 'm'; }
      else if (w === 'mươi') { group = group - last + last * 10; last *= 10; }
      else if (w === 'trăm') { group = group - last + (last || 1) * 100; last = 0; }
      else if (w === 'linh' || w === 'lẻ') { }
      else if (w in MUL) { shown = group || 1; total += (group || 1) * MUL[w]; group = 0; last = 0; scale = w; }
    }
    if (!scale) return { value: total + group, shown: total + group, scale: '' };
    if (group) shown = shown + group / MUL[scale] * 0;   // "hai vạn năm nghìn": giữ phần lớn
    return { value: total + group, shown, scale };
  }
  function extractStats(text) {
    const toks = text.replace(/([,.;:!?…])(?=\s|$)/g, ' $1 ').replace(/([()“”"])/g, ' $1 ').split(/\s+/).filter(Boolean);
    const out = [];
    for (let i = 0; i < toks.length; i++) {
      const low = toks[i].toLowerCase();
      let j = i, value = null, shown = null, scale = '', pct = false, raw = [];
      if (isDigits(toks[i])) {
        // năm 1077 → mốc thời gian, không phải số liệu
        if (i > 0 && toks[i - 1].toLowerCase() === 'năm' && /^\d{3,4}$/.test(toks[i])) continue;
        if (/^(1\d{3}|20\d{2})$/.test(toks[i]) && !(toks[i + 1] && (toks[i + 1].toLowerCase() in MUL))) continue;
        value = numFromDigits(toks[i]); shown = value; pct = /%$/.test(toks[i]); raw.push(toks[i]); j = i + 1;
        if (toks[j] && toks[j].toLowerCase() in MUL) { scale = toks[j].toLowerCase(); value *= MUL[scale]; j++; }
      } else if (isNumWord(low) && !(low === 'năm' && !(toks[i + 1] && isNumWord(toks[i + 1].toLowerCase()) && toks[i + 1].toLowerCase() !== 'năm'))) {
        const ws = [];
        while (j < toks.length) {
          const w = toks[j].toLowerCase();
          if (!isNumWord(w)) break;
          if (w === 'năm' && ws.length && !['trăm', 'linh', 'lẻ'].includes(ws[ws.length - 1]) && !(toks[j + 1] && isNumWord(toks[j + 1].toLowerCase()))) break;
          ws.push(w); j++;
        }
        const big = ws.some(w => w === 'mười' || w === 'mươi' || w === 'trăm' || w in MUL);
        if (!big) continue;
        const r = numFromWords(ws); value = r.value; shown = r.shown; scale = r.scale; raw = ws;
      } else continue;
      if (toks[j] && /^(phần)$/i.test(toks[j]) && toks[j + 1] && /^trăm$/i.test(toks[j + 1])) { pct = true; j += 2; }
      // đơn vị: tối đa 4 chữ sau con số
      const unit = [];
      while (j < toks.length && unit.length < 4) {
        const w = toks[j];
        if (/^[,.;:!?…()“”"]$/.test(w) || STOP.has(w.toLowerCase()) || isDigits(w)) break;
        unit.push(w); j++;
      }
      if (pct && !unit.length) { while (j < toks.length && unit.length < 5 && !/^[,.;:!?…()“”"]$/.test(toks[j])) unit.push(toks[j++]); }
      if (!pct && !unit.length) continue;
      const prev = i > 0 ? toks[i - 1].toLowerCase() : '';
      out.push({ pre: PRE.includes(prev) && !['có', 'gồm'].includes(prev) ? prev : '', value, shown: shown == null ? value : shown, scale, pct, unit: unit.join(' ') });
      i = j - 1;
    }
    // bỏ trùng, tối đa 3
    const seen = new Set();
    return out.filter(x => { const k = x.value + x.unit; if (seen.has(k)) return false; seen.add(k); return true; }).slice(0, 3);
  }
  function extractYears(text) {
    const ys = []; const re = /(?:năm\s+)?\b(\d{3,4})\b/gi; let m;
    while ((m = re.exec(text))) { const y = +m[1]; const isYear = /năm/i.test(m[0]) || (y >= 1000 && y <= 2200); if (isYear && y >= 40 && y <= 2200 && !ys.includes(y)) ys.push(y); }
    return ys;
  }
  function timelineFrom(text) {
    const sents = text.split(/(?<=[.!?…;])\s+/), items = [];
    sents.forEach(sn => {
      const ys = extractYears(sn); if (!ys.length) return;
      let what = sn.replace(/(?:vào\s+)?(?:cuối|đầu|giữa)?\s*(?:mùa\s+\S+\s+)?năm\s+\d{3,4}\s*,?\s*/i, '').replace(/^[,\s]+/, '').replace(/[.!?…;]+$/, '');
      const w = what.split(/\s+/); if (w.length > 9) what = w.slice(0, 9).join(' ') + '…';
      items.push([String(ys[0]), what.charAt(0).toUpperCase() + what.slice(1)]);
    });
    return items.slice(0, 5);
  }

  /* ---------- người que: đoán hành động từ lời dẫn ---------- */
  const W_ = list => new RegExp('(?:^|[\\s,.;:!?"“”(…-])(?:' + list + ')(?=$|[\\s,.;:!?"“”)…-])', 'i');
  const ACT_RX = [
    ['cheo', W_('chèo thuyền|chèo|thuyền chiến|chiến thuyền|thuyền nhẹ|thủy quân|thủy binh|đoàn thuyền|thuyền bè|ra khơi|xuôi dòng|ngược dòng')],
    ['cuoingua', W_('cưỡi ngựa|phi ngựa|kỵ binh|thiết kỵ|ngựa chiến|vó ngựa|voi chiến|cưỡi voi')],
    ['ban', W_('bắn cung|bắn tên|cung tên|cung thủ|nỏ|mũi tên|bắn')],
    ['danh', W_('đánh nhau|đánh|đấm|đá|chiến đấu|giao chiến|giao tranh|tấn công|xông vào|ẩu đả|so tài|tỉ thí|chém|quyết đấu')],
    ['chay', W_('chạy|phi nước đại|tháo chạy|đuổi theo|rượt|chạy trốn|truy đuổi|lao đi|chạy vụt')],
    ['vui', W_('chiến thắng|thắng lợi|ăn mừng|reo hò|vui mừng|hân hoan|nhảy cẫng|thành công|hạnh phúc|reo vui')],
    ['nghi', /\?|(?:^|[\s,.;:!"“”(…-])(?:suy nghĩ|nghĩ ngợi|tự hỏi|băn khoăn|thắc mắc|tại sao|vì sao|bí ẩn|trăn trở|phân vân|nghĩ)(?=$|[\s,.;:!?"“”)…-])/i],
    ['hanhquan', W_('hành quân|tiến quân|kéo quân|xuất quân|đoàn quân|đại quân|tiến binh|dẫn quân|đem quân|thống lĩnh|vạn quân|binh lính')],
    ['phatco', W_('phất cờ|hiệu lệnh|ra lệnh|truyền lệnh|hịch|tuyên thệ|thề|chỉ huy|khích lệ|cổ vũ tinh thần|duyệt binh')],
    ['di', W_('đi bộ|bước đi|lên đường|hành trình|rong ruổi|dạo bước|băng qua|tiến về')]
  ];
  function guessAction(text) { const t = text || ''; for (const [a, rx] of ACT_RX) if (rx.test(t)) return a; return 'noi'; }

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
      if (b.code) { scenes.push({ uid: uid(), type: 'card', heading: '', code: b.code, say: b.text }); return; }
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
      // đoạn có từ 2 mốc năm trở lên ⇒ cảnh dòng thời gian
      const ys = extractYears(b.text);
      if (ys.length >= 2 && words(b.text) <= 90) {
        const items = timelineFrom(b.text);
        if (items.length >= 2) { scenes.push({ uid: uid(), type: 'timeline', title: (heading || 'DIỄN BIẾN').toUpperCase(), items, say: b.text }); heading = null; kicker = ''; return; }
      }
      splitSentences(b.text, maxW).forEach(chunk => {
        const stats = extractStats(chunk);
        if (stats.length) scenes.push({ uid: uid(), type: 'stat', heading: heading || '', kicker: kicker || '', stats, say: chunk });
        else scenes.push({ uid: uid(), type: 'card', heading: heading || '', kicker: kicker || '', say: chunk });
        heading = null; kicker = '';
      });
    });
    return scenes;
  }

  function newProject({ name, style, epLen, blocks, stick }) {
    const firstHead = blocks.find(b => b.kind === 'heading');
    let nm = clean(name) || (firstHead && firstHead.text) || 'Dự án mới';
    if (firstHead && blocks[0] === firstHead && !name) blocks = blocks.slice(1);
    const scenes = scenesFromBlocks(blocks);
    // minh họa bằng người que: cảnh thẻ chữ có hành động rõ ⇒ đổi sang cảnh người que; cứ 3 thẻ liên tiếp thì 1 thẻ thành người que thuyết trình
    if (stick) { let run = 0; scenes.forEach(sc => { if (sc.type !== 'card') { run = 0; return; } const a = guessAction(sc.say); if (a !== 'noi' || ++run % 3 === 2) { sc.type = 'stick'; sc.action = a; run = a !== 'noi' ? 0 : run; } }); }
    return { id: 'u-' + uid(), custom: true, name: nm, style: style || 'tailieu', epLen: epLen || 0, created: Date.now(), updated: Date.now(), scenes };
  }

  /* ---------- nhập timeline.json (định dạng khối + thẻ kiểu podcast) ----------
     Mỗi khối (block) có 1 file giọng; các thẻ (segments) chia thời lượng khối theo tỉ trọng w. */
  function splitByWeights(text, ws) {
    const sents = (text || '').split(/(?<=[.!?…])\s+/).filter(Boolean), total = words(text) || 1, W = ws.reduce((a, b) => a + b, 0) || 1;
    const out = ws.map(() => []); let acc = 0, k = 0, cum = ws[0] / W;
    sents.forEach(sn => { const mid = (acc + words(sn) / 2) / total; while (k < ws.length - 1 && mid > cum) { k++; cum += ws[k] / W; } out[k].push(sn); acc += words(sn); });
    return out.map(a => a.join(' '));
  }
  function segToScene(g, blockId) {
    const ttl = g.title || '', sub = g.sub || '';
    const media = g.media || g.file || (g.type === 'avatar_full' ? blockId + '.mp4' : '');
    const base = { uid: uid(), w: +g.w || 10 };
    if (media) base._mediaName = media;
    switch (g.type) {
      case 'avatar_full': return Object.assign(base, { type: 'card', full: true, heading: '', pull: '' }, g.card ? { lower: { title: g.card.title || '', label: g.card.label || '', cols: g.card.cols || [] } } : {});
      case 'stock_full': return Object.assign(base, { type: 'card', full: true, kicker: g.kicker || '', heading: ttl.replace(/\*/g, ''), pull: '' });
      case 'image': case 'split': case 'keyword': return Object.assign(base, { type: 'card', heading: ttl.replace(/\*/g, ''), pull: sub || '' });
      case 'number': case 'stat': case 'bigword': return Object.assign(base, { type: 'bigword', big: g.big || ttl, caption: g.caption || g.unit || (g.type === 'stat' ? ttl : ''), sub });
      case 'list': return Object.assign(base, { type: 'points', title: ttl.replace(/\*/g, '').toUpperCase(), items: g.items || [] });
      case 'checklist': return Object.assign(base, { type: 'checklist', title: ttl, items: g.items || [], note: g.note || '', icon: g.icon });
      case 'steps': return Object.assign(base, { type: 'steps', title: ttl, steps: g.steps || [] });
      case 'timeline': return Object.assign(base, { type: 'timeline', title: ttl.replace(/\*/g, '').toUpperCase(), items: (g.points || []).map(p => [String(p[0]), p[1] || '']) });
      case 'vs': return Object.assign(base, { type: 'vs', title: ttl, a: g.a || ['', ''], b: g.b || ['', ''] });
      case 'warning': return Object.assign(base, { type: 'warning', kicker: g.kicker || '', title: ttl, sub });
      case 'chapter': return Object.assign(base, { type: 'chapter', kicker: g.kicker || '', title: ttl, sub });
      case 'quote': return Object.assign(base, { type: 'quote', quote: g.text || ttl, by: g.by || '' });
      default: return Object.assign(base, { type: 'card', heading: ttl.replace(/\*/g, ''), pull: sub });
    }
  }
  /* texts: { 'AVATAR-01': 'lời đọc của khối' } (từ file kịch bản khối, nếu có) */
  function scenesFromTimeline(tl, texts = {}) {
    const scenes = [];
    (tl.blocks || []).forEach(bl => {
      const segs = (bl.segments || []).length ? bl.segments : [{ type: 'keyword', w: 10 }];
      const parts = splitByWeights(texts[bl.id] || '', segs.map(g => +g.w || 10));
      segs.forEach((g, i) => { const sc = segToScene(g, bl.id); sc.blk = bl.id; sc.code = bl.id; if (!i) sc.blkFirst = true; sc.say = parts[i] || ''; scenes.push(sc); });
    });
    return scenes;
  }

  /* ---------- PHIM NGƯỜI QUE từ một trận mẫu ----------
     Áp quy trình skill directing-stickman-videos (A5): mở bằng câu hỏi móc (golden hook), giữ nhân vật cố định,
     hành động vật lý rõ ràng theo lời dẫn, xen bản đồ/sơ đồ gốc. Mỗi cảnh gốc = 1 khối giọng Manus (blk) chia theo w. */
  const HOOKQ = {
    'bach-dang-938': 'VÌ SAO CHIẾN THUYỀN NAM HÁN MẮC KẸT GIỮA SÔNG?', 'nhu-nguyet-1077': '"NAM QUỐC SƠN HÀ" VANG LÊN BÊN BỜ NHƯ NGUYỆT',
    'dong-bo-dau-1258': '"ĐẦU THẦN CHƯA RƠI XUỐNG ĐẤT…"', 'ham-tu-1285': 'TRẬN THỦY CHIẾN NÀO MỞ ĐƯỜNG GIÀNH LẠI THĂNG LONG?',
    'tay-ket-1285': 'VÌ SAO TƯỚNG GIẶC PHẢI THÁO CHẠY TRONG HỖN LOẠN?', 'van-don-1288': 'ĐOÀN THUYỀN LƯƠNG CỦA GIẶC BIẾN MẤT THẾ NÀO?',
    'bach-dang-1288': 'BÃI CỌC GỖ NÀO NHẤN CHÌM CẢ HẠM ĐỘI NGUYÊN?', 'chi-lang-1427': 'VÌ SAO LIỄU THĂNG BỎ MẠNG Ở ẢI CHI LĂNG?',
    'rach-gam-1785': 'LÀM SAO THỦY QUÂN XIÊM TAN TRONG MỘT BUỔI SÁNG?', 'dong-da-1789': 'TẾT KỶ DẬU 1789 – ĐẠI QUÂN THANH ĐI ĐÂU?'
  };
  // [loại, tỉ trọng, hành động mặc định, '!' = luôn dùng hành động này]
  const STICK_PLAN = { title: [['stick', 4, 'hanhquan', '!', 'hook'], ['orig', 6]], hero: [['stick', 6, 'phatco', '!'], ['stick', 5, 'cuoingua']], map: [['orig', 6], ['stick', 5]], forces: [['orig', 5], ['stick', 5, 'hanhquan', '!']],
    diagram: [['stick', 4, 'cheo'], ['orig', 7], ['stick', 4, 'danh', '!']], timeline: [['orig', 6], ['stick', 4]], quote: [['stick', 4, 'phatco'], ['orig', 6]], points: [['orig', 7], ['stick', 3, 'vui', '!']], end: [['orig', 1]] };
  /* PHIM TÀI LIỆU (khi trận có ảnh tư liệu T.anh): ảnh thật + người que A5 + bản đồ/sơ đồ, cùng giọng Manus */
  const DOC_PLAN = { title: [['photo', 4, 'hook'], ['orig', 6]], hero: [['photo', 5, 'hero'], ['stick', 5, 'phatco', '!']], map: [['orig', 6], ['photo', 4, 'map']], forces: [['orig', 5], ['stick', 5, 'hanhquan', '!']],
    diagram: [['stick', 3, 'cheo'], ['orig', 7], ['photo', 3, 'dienbien'], ['photo', 3, 'dienbien2'], ['stick', 3, 'danh', '!']], timeline: [['orig', 6], ['photo', 4, 'moc']], quote: [['orig', 6], ['photo', 4, 'moc']], points: [['orig', 6], ['photo', 4, 'ynghia']], end: [['photo', 3, 'ket'], ['orig', 5]] };
  function stickFilm(T) {
    const scenes = [], anh = {}; (T.anh || []).forEach(a => anh[a.slot] = a);
    T.scenes.forEach((sc, i) => {
      const plan = (T.anh ? (DOC_PLAN[sc.type] || [['orig', 1]]).filter(x => x[0] !== 'photo' || anh[x[2]]) : STICK_PLAN[sc.type]) || [['orig', 1]], parts = splitByWeights(sc.say, plan.map(x => x[1])), blk = 'K' + (i + 1);
      plan.forEach(([kind, w, act, force, extra], k) => {
        const say = parts[k] || '';
        const A = kind === 'photo' ? anh[act] : null;
        const o = kind === 'orig' ? Object.assign(JSON.parse(JSON.stringify(sc)), { uid: uid(), srcIdx: i })
          : A ? { uid: uid(), type: 'card', full: true, media: { url: `anh/${T.id}/${A.file}`, kind: 'image' }, kicker: '', heading: '', pull: '', caption: A.caption, credit: A.credit }
          : { uid: uid(), type: 'stick', heading: '', kicker: '' };
        if (A && act === 'hook') { o.heading = HOOKQ[T.id] || T.hookQ || ''; o.kicker = T.series || 'SỬ VIỆT'; }
        if (A && act === 'hero') o.lower = { title: sc.name, label: sc.kicker || '', cols: [['Năm sinh – mất', sc.alt || ''], ['Vai trò', (sc.role || '').split(',')[0]]] };
        if (kind === 'stick') { const g = guessAction(say); o.action = force ? act : g !== 'noi' ? g : act || (i % 2 ? 'hanhquan' : 'noi'); }
        if (extra === 'hook') { o.heading = HOOKQ[T.id] || T.hookQ || ''; o.kicker = T.series || 'SỬ VIỆT'; }
        if (kind === 'stick' && k === 0 && sc.type === 'hero' && !T.anh) o.lower = { title: sc.name, label: sc.kicker || '', cols: [['Năm sinh – mất', sc.alt || ''], ['Vai trò', (sc.role || '').split(',')[0]]] };
        Object.assign(o, { say, w, blk, code: blk }); if (k === 0) o.blkFirst = true;
        scenes.push(o);
      });
    });
    return scenes;
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
    const body = eps[i].map(sc => {
      const o = Object.assign({}, sc, { _uid: sc.uid });
      if (sc.type === 'quote') o.by = sc.by || '';
      if (sc.mediaId && mediaUrl) { const u = mediaUrl(sc.mediaId); if (u) o.media = { url: u, kind: sc.mediaKind || 'image' }; }
      if (sc.animId && mediaUrl) { const u = mediaUrl(sc.animId); if (u) o.anim = { url: u, kind: sc.animKind || 'lottie', pos: sc.animPos || 'center' }; }
      return o;
    });
    const scenes = p.noAuto ? body : [title, ...body, end];
    return { id: p.id, custom: true, xuong: p.from ? 'ls' : p.xuong || (['hoathinh', 'cotich', 'langque', 'vutru'].includes(p.style) ? 'hh' : 'ls'), name, year: '', who: STYLES[p.style], vs: '', style: p.style, seed: (p.created % 97) + 3, series: up.length > 42 ? up.slice(0, 40) + '…' : up, scenes, epCount: n, ep: i };
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

  window.Xuong = { stickFilm, splitByWeights, scenesFromTimeline, blockScript, guessAction, extractStats, extractYears, timelineFrom, STYLES, parseFile, parseText, newProject, scenesFromBlocks, episodes, filmSource, store, uid };
})();
