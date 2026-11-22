/* =========================================================================
   YOUTUBE VIDEO DÀI – tự chia CHƯƠNG (mốc thời gian) + soạn tiêu đề, mô tả, thẻ
   Quy tắc chương của YouTube: mốc đầu 00:00, ít nhất 3 chương, mỗi chương ≥ 10 giây.
   Mốc lấy đúng thời lượng thật của phim (đã tính giọng đọc) ⇒ khớp video xuất ra.
   ========================================================================= */
(function () {
  'use strict';
  const MIN = 10;
  const ts = (x, long) => { x = Math.floor(x); const h = Math.floor(x / 3600), m = Math.floor(x % 3600 / 60), s = x % 60, p = n => String(n).padStart(2, '0'); return long ? `${h}:${p(m)}:${p(s)}` : `${p(m)}:${p(s)}`; };
  const cap = t => t ? t.charAt(0).toUpperCase() + t.slice(1) : t;
  const short = (t, n = 7) => { const w = (t || '').replace(/[“”"]/g, '').split(/\s+/).filter(Boolean); return w.slice(0, n).join(' ').replace(/[,.;:!?…]+$/, '') + (w.length > n ? '…' : ''); };
  const TYPE_NAME = { title: 'Mở đầu', hero: 'Nhân vật', map: 'Bối cảnh & bản đồ', forces: 'Tương quan lực lượng', diagram: 'Diễn biến trận đánh', timeline: 'Các mốc thời gian', quote: 'Trích dẫn', points: 'Ý nghĩa', end: 'Lời kết', stat: 'Những con số', stick: '', card: '' };

  function label(sc) {
    if (sc.type === 'title') return 'Mở đầu';
    if (sc.type === 'end') return 'Lời kết';
    const head = sc.heading || sc.title || '';
    const tc = x => x === x.toUpperCase() ? x.toLowerCase().replace(/(^|\s)(\S)/g, (m, sp, c) => sp + c.toUpperCase()) : cap(x);
    if (head && !/^(DIỄN BIẾN|Ý CHÍNH)$/.test(head)) return tc(head);
    if (sc.kicker) return tc(sc.kicker);
    return TYPE_NAME[sc.type] || cap(short(sc.say, 6));
  }

  /* film: kết quả Studio.build (scenes có start, d, sc) */
  function chapters(film) {
    const total = film.total, S = film.scenes;
    const marked = S.map((x, i) => i === 0 || x.sc.type === 'end' || !!(x.sc.heading || x.sc.title || x.sc.kicker) || !['card', 'stat', 'stick'].includes(x.sc.type));
    let cand = S.map((x, i) => ({ t: x.start, name: label(x.sc), keep: marked[i] })).filter(c => c.keep);
    if (cand.length < 3) cand = S.map(x => ({ t: x.start, name: label(x.sc) }));
    cand[0].t = 0;
    // gộp chương ngắn hơn 10 giây vào chương trước (riêng chương cuối gộp ngược)
    const out = [];
    cand.forEach(c => { if (out.length && c.t - out[out.length - 1].t < MIN) return; if (out.length && out[out.length - 1].name === c.name) return; out.push({ t: c.t, name: c.name }); });
    while (out.length > 1 && total - out[out.length - 1].t < MIN) out.pop();
    const long = total >= 3600;
    return { list: out, ok: out.length >= 3 && total >= 30, text: out.map(c => `${ts(c.t, long)} ${c.name}`).join('\n'), total };
  }

  function tagsFor(b) {
    const base = b.custom ? [b.name, b.who, 'video kể chuyện', 'phim hoạt hình'] : [b.name, b.who, b.vs && 'quân ' + b.vs, 'lịch sử Việt Nam', 'sử Việt', 'trận đánh lừng danh', 'phim tài liệu lịch sử'];
    if (/Hưng Đạo/.test((b.series || '') + (b.who || ''))) base.push('Trần Hưng Đạo', 'kháng chiến chống Nguyên Mông');
    const out = []; let len = 0;
    base.filter(Boolean).forEach(t => { t = String(t).trim(); if (t && !out.includes(t) && len + t.length + 1 <= 480) { out.push(t); len += t.length + 1; } });
    return out;
  }

  function pack(b, film) {
    const ch = chapters(film), sc = b.scenes || [];
    const fb = window.FBPost ? FBPost.describe(b) : { title: b.name, description: '' };
    const hook = (sc.find(x => x.type !== 'title' && x.say) || {}).say || '';
    const pts = (sc.find(x => x.type === 'points') || {}).items || [];
    const tags = (fb.description.match(/#\S+/g) || []).slice(0, 5);
    const title = (b.custom ? b.name : `${b.name}${b.who ? ' – ' + b.who : ''} | Trận đánh lừng danh`).slice(0, 100);
    const desc = [hook,
      ch.ok ? '⏱ CHƯƠNG\n' + ch.text : '',
      pts.length ? '📌 Ý NGHĨA\n' + pts.map(p => '• ' + p).join('\n') : '',
      b.sources && b.sources.length ? '📚 Nguồn tham khảo: ' + b.sources.join(', ') + '.\nHình ảnh, sơ đồ mang tính minh họa; số liệu cổ là ước lượng theo sử sách.' : '',
      'Hình ảnh, nhạc nền do Xưởng Video tự dựng – không sử dụng tư liệu có bản quyền của bên thứ ba.',
      tags.join(' ')].filter(Boolean).join('\n\n').slice(0, 4900);
    return { title, desc, tags: tagsFor(b), chapters: ch };
  }
  window.YTLong = { chapters, pack, ts };
})();
