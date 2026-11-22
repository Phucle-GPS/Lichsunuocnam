/* =========================================================================
   PHÒNG NHẠC – sáng tác nhạc nền MỚI theo phong cách xưa (không dùng bài có sẵn)
   Mỗi bài = bộ tham số {style, key, tempo, seed, lead, layers}. Cùng tham số ⇒ cùng bài.
   Phong cách: bolero · valse (tiền chiến) · ngucung (dân ca ngũ cung) · lofi (hoài niệm)
   ========================================================================= */
(function () {
  'use strict';
  const STYLES = {
    bolero: { name: 'Bolero xưa', desc: 'Nhịp bolero chậm, guitar rải, giọng thứ buồn', tempo: 68, beats: 4, lead: 'violin' },
    valse: { name: 'Valse tiền chiến', desc: 'Nhịp 3/4 lãng mạn kiểu thập niên 50', tempo: 96, beats: 3, lead: 'piano' },
    ngucung: { name: 'Dân ca ngũ cung', desc: 'Đàn tranh, sáo trúc, âm giai ngũ cung', tempo: 72, beats: 4, lead: 'sao' },
    lofi: { name: 'Lofi hoài niệm', desc: 'Hợp âm jazz, tiếng đĩa than, trống nhẹ', tempo: 76, beats: 4, lead: 'piano' },
    hungca: { name: 'Hùng ca chiến trận', desc: 'Trống trận dồn dập, kèn hiệu, hành khúc giọng thứ', tempo: 104, beats: 4, lead: 'ken', su: 1 },
    bitrang: { name: 'Bi tráng', desc: 'Đàn bầu ngân dài, nền dây trầm, nhịp chậm', tempo: 60, beats: 4, lead: 'bau', su: 1 },
    edm: { name: 'EDM bắt tai', desc: 'Kick 4/4, supersaw nhún nhịp, pluck, build-up & drop', tempo: 124, beats: 4, lead: 'pluck' },
    cungdinh: { name: 'Nhã nhạc cung đình', desc: 'Đàn tranh, sáo, trống chầu, mõ – trang nghiêm', tempo: 78, beats: 4, lead: 'sao', su: 1 }
  };
  const LEADS = { pluck: 'Pluck điện tử', violin: 'Vĩ cầm', sao: 'Sáo trúc', bau: 'Đàn bầu', piano: 'Piano', guitar: 'Guitar', ken: 'Kèn hiệu' };
  const KEYS = ['Đô', 'Đô#', 'Rê', 'Mi♭', 'Mi', 'Fa', 'Fa#', 'Sol', 'La♭', 'La', 'Si♭', 'Si'];
  function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
  const mtof = m => 440 * Math.pow(2, (m - 69) / 12);
  const pick = (r, a) => a[Math.floor(r() * a.length)];

  /* âm giai (tính từ chủ âm) */
  const SC = { minorH: [0, 2, 3, 5, 7, 8, 11], minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], penta: [0, 2, 5, 7, 9], dorian: [0, 2, 3, 5, 7, 9, 10] };
  /* hợp âm: [bậc gốc (bán cung từ chủ âm), loại] */
  const CH = { m: [0, 3, 7], M: [0, 4, 7], '7': [0, 4, 7, 10], m7: [0, 3, 7, 10], M7: [0, 4, 7, 11], m9: [0, 3, 7, 10, 14], '5': [0, 7, 12], sus: [0, 5, 7] };
  const PROG = {
    bolero: [[[0, 'm'], [5, 'm'], [7, '7'], [0, 'm']], [[0, 'm'], [8, 'M'], [5, 'm'], [7, '7']], [[0, 'm'], [10, 'M'], [3, 'M'], [7, '7']], [[5, 'm'], [0, 'm'], [7, '7'], [0, 'm']]],
    valse: [[[0, 'M'], [9, 'm'], [2, 'm'], [7, '7']], [[0, 'M'], [5, 'M'], [7, '7'], [0, 'M']], [[0, 'M'], [4, 'm'], [5, 'M'], [7, '7']], [[9, 'm'], [2, 'm'], [7, '7'], [0, 'M']]],
    ngucung: [[[0, '5'], [7, '5'], [5, 'sus'], [0, '5']], [[0, '5'], [9, '5'], [7, 'sus'], [0, '5']], [[5, '5'], [0, '5'], [7, '5'], [0, 'sus']]],
    lofi: [[[2, 'm9'], [7, '7'], [0, 'M7'], [9, 'm7']], [[5, 'M7'], [4, 'm7'], [2, 'm7'], [7, '7']], [[0, 'M7'], [9, 'm7'], [2, 'm9'], [7, '7']]],
    hungca: [[[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], [[0, 'm'], [5, 'm'], [8, 'M'], [7, 'M']], [[0, '5'], [10, '5'], [8, '5'], [7, '5']]],
    bitrang: [[[0, 'm'], [5, 'm'], [0, 'm'], [7, 'm']], [[0, 'm'], [8, 'M'], [5, 'm'], [7, 'sus']], [[3, 'M'], [10, 'M'], [0, 'm'], [0, 'sus']]],
    cungdinh: [[[0, '5'], [5, 'sus'], [7, '5'], [0, '5']], [[0, '5'], [2, 'sus'], [7, '5'], [5, '5']]]
  };
  const SCALE_OF = { bolero: 'minorH', valse: 'major', ngucung: 'penta', lofi: 'dorian', hungca: 'minor', bitrang: 'penta', cungdinh: 'penta' };

  function newSong(style, seed) {
    const st = STYLES[style] || STYLES.bolero, r = rng(seed || Date.now());
    return { id: 's-' + Math.random().toString(36).slice(2, 9), name: '', style, key: Math.floor(r() * 12), tempo: st.tempo, seed: Math.floor(r() * 1e9), lead: st.lead, layers: { melody: true, chords: true, bass: true, drums: !['ngucung', 'bitrang'].includes(style) } };
  }

  /* ---------- EDM: intro → build → drop → break → build → drop → outro ---------- */
  function arrangeEDM(song, total) {
    const r = rng(song.seed), bd = 60 / song.tempo, barDur = bd * 4, root = 45 + (song.key % 12), scale = [0, 2, 3, 5, 7, 8, 10];
    const progs = [[[0, 'm'], [8, 'M'], [3, 'M'], [10, 'M']], [[0, 'm'], [5, 'm'], [8, 'M'], [10, 'M']], [[8, 'M'], [10, 'M'], [0, 'm'], [0, 'm']], [[0, 'm'], [10, 'M'], [8, 'M'], [7, 'm']]];
    const prog = pick(r, progs), ev = [];
    const add = (t, inst, note, dur, vel) => { if (t < total - .05) ev.push({ t, inst, note, dur: Math.min(dur, total - t), vel }); };
    // mô-típ pluck 2 ô nhịp (nốt móc đơn, bám hợp âm) – lặp lại ⇒ bắt tai
    const mot = []; for (let i = 0; i < 16; i++) if (i === 0 || r() < .62) mot.push({ s: i, deg: Math.floor(r() * 7) + (i % 4 === 0 ? 0 : Math.floor(r() * 3) - 1), len: r() < .25 ? 2 : 1 });
    const d2m = (d, ch) => { const n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n; let m = root + 24 + o * 12 + scale[i]; return m; };
    const plan = []; const need = Math.ceil(total / barDur);
    const base = [['intro', 8], ['build', 8], ['drop', 16], ['break', 8], ['build', 8], ['drop', 16]];
    let bars = 0; for (let k = 0; bars < need - 4; k++) { const [n, l] = k < base.length ? base[k] : (k % 2 ? ['drop', 16] : ['break', 8]); plan.push([n, l]); bars += l; }
    plan.push(['outro', 4]);
    let bar = 0;
    plan.forEach(([sec, len]) => {
      for (let k = 0; k < len; k++, bar++) {
        const t0 = bar * barDur; if (t0 >= total) return;
        const [cr, ct] = prog[k % 4], chord = CH[ct].map(x => x + cr), drop = sec === 'drop', build = sec === 'build', prog01 = k / len;
        if (sec === 'intro' || sec === 'break' || sec === 'outro') chord.forEach(n => add(t0, 'pad', root + 12 + n, barDur, sec === 'break' ? .5 : .35));
        if (drop) for (let b = 0; b < 4; b++) chord.forEach(n => add(t0 + b * bd, 'supersaw', root + 12 + n, bd * .92, .9));
        if (build) for (let b = 0; b < 8; b++) chord.forEach(n => add(t0 + b * bd / 2, 'supersaw', root + 12 + n, bd * .4, .25 + .5 * prog01));
        if (drop || (sec === 'break' && k >= 4)) for (let b = 0; b < 4; b++) add(t0 + b * bd + bd / 2, 'sub', root - 12 + cr, bd * .45, .9);
        if (drop) { for (let b = 0; b < 4; b++) { add(t0 + b * bd, 'kick', 0, .2, 1); add(t0 + b * bd + bd / 2, 'hat', 0, .05, .45); } [1, 3].forEach(b => add(t0 + b * bd, 'clap', 0, .2, .8)); }
        if (build) { for (let b = 0; b < 4; b++) add(t0 + b * bd, 'kick', 0, .2, .7); const step = k >= len - 2 ? .25 : k >= len - 4 ? .5 : 1; for (let x = 0; x < 4; x += step) add(t0 + x * bd, 'snare', 0, .1, .25 + .55 * prog01); if (k === len - 4) add(t0, 'riser', 0, barDur * 4, .8); }
        if (sec === 'intro') { for (let b = 0; b < 4; b++) add(t0 + b * bd + bd / 2, 'hat', 0, .05, .3); if (k >= 4) for (let b = 0; b < 4; b++) add(t0 + b * bd, 'kick', 0, .2, .55); }
        if (sec === 'outro') for (let b = 0; b < 4; b++) add(t0 + b * bd, 'kick', 0, .2, .6 * (1 - prog01));
        if (k === 0 && drop) add(t0, 'chieng', 0, 2, .25);
        if ((drop || build || (sec === 'break' && k >= 4)) && song.layers.melody) {
          const half = k % 2;
          mot.filter(m => (m.s >= 8) === !!half).forEach(m => { let d = m.deg; const pc = ((scale[((d % 7) + 7) % 7]) % 12); if (m.s % 4 === 0 && !chord.some(c => ((c - pc) % 12 + 12) % 12 === 0)) d += 1; add(t0 + (m.s % 8) * bd / 2, 'pluck', d2m(d) + (sec === 'break' ? -12 : 0), bd / 2 * m.len * .95, drop ? .85 : .55); });
        }
      }
    });
    return { events: ev.sort((a, b) => a.t - b.t), barDur, bars: bar };
  }

  /* ---------- phối khí: tham số ⇒ danh sách nốt ---------- */
  function arrange(song, total) {
    if (song.style === 'edm') return arrangeEDM(song, total);
    const st = STYLES[song.style] || STYLES.bolero, r = rng(song.seed), beats = st.beats;
    const bd = 60 / song.tempo, barDur = bd * beats;
    const root = 48 + song.key;                       // chủ âm quãng 3
    const scale = SC[SCALE_OF[song.style]];
    const progs = PROG[song.style];
    const progA = pick(r, progs), progB = pick(r, progs.filter(p => p !== progA)) || progA;
    const ev = [];
    const add = (t, inst, note, dur, vel) => { if (t < total - .05) ev.push({ t, inst, note, dur: Math.min(dur, total - t), vel }); };
    // nhịp điệu giai điệu theo phong cách (đơn vị: phách)
    const RHY = {
      bolero: [[0, 1.5, 2, 3], [0, 1, 2, 2.5, 3], [0, 2, 3], [0, .5, 1, 2]],
      valse: [[0, 1, 2], [0, 2], [0, 1.5, 2], [0]],
      ngucung: [[0, 2], [0, 1.5, 2, 3], [0, 3], [0, 1, 1.5, 2]],
      lofi: [[0, 1.5, 2.5], [.5, 1, 2, 3], [0, 2], [0, .75, 1.5, 3]],
      hungca: [[0, 1, 1.5, 2, 3], [0, .5, 1, 2], [0, 2, 3, 3.5], [0, 1, 2, 3]],
      bitrang: [[0], [0, 2], [0, 3], [0, 1.5]],
      cungdinh: [[0, 2], [0, 1, 2], [0, 3], [0, 1.5, 2]]
    }[song.style];
    // tạo một mô-típ 2 ô nhịp rồi lặp lại có biến tấu ⇒ giai điệu có hình, dễ nhớ
    function motif(seedOff) {
      const rr = rng(song.seed + seedOff); const m = [];
      for (let b = 0; b < 2; b++) { const rh = pick(rr, RHY); rh.forEach((x, k) => m.push({ bar: b, beat: x, step: Math.floor(rr() * 5) - 2 + (k === 0 ? 0 : 0) })); }
      return m;
    }
    const motA = motif(11), motB = motif(29);
    let degree = 4;                                   // vị trí trong âm giai (tính theo bậc)
    const deg2midi = d => { const n = scale.length, o = Math.floor(d / n), i = ((d % n) + n) % n; return root + 12 + o * 12 + scale[i]; };
    const nearestChordTone = (d, ch) => { let best = d, bd2 = 99; for (let x = d - 3; x <= d + 3; x++) { const pc = ((deg2midi(x) - root) % 12 + 12) % 12; if (ch.some(c => (c % 12) === pc) && Math.abs(x - d) < bd2) { best = x; bd2 = Math.abs(x - d); } } return best; };

    // bố cục: dạo đầu 4 ô · A 8 · A' 8 · B 8 · A 8 · (lặp) · kết 2 ô
    const plan = [['intro', 4]]; let bars = 4; const need = Math.ceil(total / barDur);
    const cycle = [['A', 8], ['A2', 8], ['B', 8], ['A', 8]];
    let ci = 0; while (bars < need - 2) { const [n, l] = cycle[ci % cycle.length]; plan.push([n, l]); bars += l; ci++; }
    plan.push(['outro', 2]);
    let bar = 0;
    plan.forEach(([sec, len]) => {
      const prog = sec === 'B' ? progB : progA, mot = sec === 'B' ? motB : motA;
      for (let k = 0; k < len; k++, bar++) {
        const t0 = bar * barDur; if (t0 >= total) return;
        const [cr, ct] = prog[k % prog.length], chord = CH[ct].map(x => x + cr);
        const last = sec === 'outro';
        // hòa âm
        if (song.layers.chords) {
          if (song.style === 'bolero') { [0, 1, 1.5, 2, 3].forEach((b, j) => chord.slice(0, 3).forEach((n, q) => add(t0 + b * bd + q * .03, 'guitar', root + 12 + n, bd * 1.2, j === 0 ? .55 : .4))); }
          else if (song.style === 'valse') { [1, 2].forEach(b => chord.slice(0, 3).forEach(n => add(t0 + b * bd, 'piano', root + 12 + n, bd * .8, .35))); }
          else if (song.style === 'hungca') { [0, 2].forEach(b => chord.slice(0, 3).forEach(n => add(t0 + b * bd, 'brass', root + n, bd * 1.6, .45))); chord.slice(0, 3).forEach(n => add(t0, 'pad', root + 12 + n, barDur, .3)); }
          else if (song.style === 'bitrang') { chord.slice(0, 3).forEach(n => add(t0, 'pad', root + n, barDur * 1.05, .45)); chord.slice(0, 3).forEach((n, q) => add(t0 + bd * 2 + q * .12, 'tranh', root + 12 + n, 2, .25)); }
          else if (song.style === 'cungdinh') { chord.forEach((n, q) => add(t0 + q * .11, 'tranh', root + 12 + n, barDur, .45)); add(t0, 'pad', root + chord[0], barDur, .2); }
          else if (song.style === 'ngucung') { chord.forEach((n, q) => add(t0 + q * .09, 'tranh', root + 12 + n, barDur, .5)); if (r() < .35) [0, 2, 4, 5, 7].forEach((d, q) => add(t0 + barDur * .5 + q * .07, 'tranh', deg2midi(d + 2), 1.2, .3)); }
          else { chord.forEach((n, q) => add(t0 + q * .02 + (k % 2 ? bd * .5 : 0), 'epiano', root + 12 + n, barDur * .9, .3)); }
          if (!['ngucung', 'hungca', 'bitrang', 'cungdinh'].includes(song.style)) chord.slice(0, 3).forEach(n => add(t0, 'pad', root + 12 + n, barDur, .18));
        }
        // bass
        if (song.layers.bass) {
          if (song.style === 'valse') add(t0, 'bass', root - 12 + cr, bd * .9, .7);
          else if (song.style === 'ngucung' || song.style === 'cungdinh' || song.style === 'bitrang') { if (k % 2 === 0) add(t0, 'bass', root - 12 + (song.style === 'ngucung' ? 0 : cr), barDur * 2, .45); }
          else if (song.style === 'hungca') { [0, 1, 2, 3].forEach(b => add(t0 + b * bd, 'bass', root - 12 + cr, bd * .8, b % 2 ? .55 : .75)); }
          else { add(t0, 'bass', root - 12 + cr, bd * 1.4, .7); add(t0 + bd * 2, 'bass', root - 12 + cr + (song.style === 'bolero' ? 7 : 0), bd * 1.4, .6); }
        }
        // nhịp
        if (song.layers.drums && !last) {
          if (song.style === 'bolero') { [[0, 'conga', .9], [1, 'conga', .5], [1.5, 'conga', .6], [2, 'conga2', .8], [3, 'conga', .55]].forEach(([b, n, v]) => add(t0 + b * bd, n, 0, .2, v)); for (let x = 0; x < 4; x += .5) add(t0 + x * bd, 'shaker', 0, .1, x % 1 ? .25 : .4); }
          else if (song.style === 'valse') { add(t0, 'kick', 0, .2, .4); [1, 2].forEach(b => add(t0 + b * bd, 'brush', 0, .15, .3)); }
          else if (song.style === 'lofi') { add(t0, 'kick', 0, .2, .8); add(t0 + bd * 2.5, 'kick', 0, .2, .6); [1, 3].forEach(b => add(t0 + b * bd, 'snare', 0, .2, .55)); for (let x = 0; x < 4; x += .5) add(t0 + (x + (x % 1 ? .08 : 0)) * bd, 'hat', 0, .05, x % 1 ? .2 : .32); }
          else if (song.style === 'hungca') { [0, 1, 2, 2.5, 3].forEach(b => add(t0 + b * bd, 'tronglon', 0, .5, b === 0 ? 1 : b === 2 ? .85 : .55)); if (k % 2) for (let x = 3; x < 4; x += .25) add(t0 + x * bd, 'snare', 0, .1, .35 + (x - 3)); if (k % 8 === 0) add(t0, 'chieng', 0, 3, .6); }
          else if (song.style === 'cungdinh') { add(t0, 'tronglon', 0, .5, .55); add(t0 + bd * 2, 'mo', 0, .1, .45); add(t0 + bd * 3, 'mo', 0, .1, .35); if (k % 4 === 0) add(t0, 'chieng', 0, 3, .4); }
          else if (k % 4 === 3) add(t0 + bd * 3, 'mo', 0, .1, .5);
        }
        // giai điệu
        if (song.layers.melody && sec !== 'intro') {
          if (last) { add(t0, 'lead', deg2midi(nearestChordTone(0 + 7 * Math.round(degree / 7), chord)), barDur * 1.8, .7); continue; }
          const notes = mot.filter(m => m.bar === k % 2);
          const lift = sec === 'B' ? 2 : 0, vary = sec === 'A2' && k >= 4;
          notes.forEach((m, j) => {
            degree += m.step + (vary && j === 0 ? 1 : 0);
            degree = Math.max(-1 + lift, Math.min(9 + lift, degree));
            let d = degree;
            if (m.beat === 0 || m.beat === 2) d = nearestChordTone(d + lift, chord) - lift;
            if (k % 8 === 7 && j === notes.length - 1) d = nearestChordTone(7 * Math.round((d + lift) / 7), chord) - lift;
            const next = notes[j + 1] ? notes[j + 1].beat : beats;
            add(t0 + m.beat * bd, 'lead', deg2midi(d + lift), (next - m.beat) * bd * .95, m.beat === 0 ? .75 : .6);
          });
        }
      }
    });
    return { events: ev.sort((a, b) => a.t - b.t), barDur, bars: bar };
  }

  /* ---------- nhạc cụ tổng hợp ---------- */
  function makeVoices(ctx, out) {
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate); const nd = noise.getChannelData(0); const rr = rng(5); for (let i = 0; i < nd.length; i++) nd[i] = rr() * 2 - 1;
    // vang
    const conv = ctx.createConvolver(); const L = Math.floor(ctx.sampleRate * 2.6), ir = ctx.createBuffer(2, L, ctx.sampleRate);
    for (let c = 0; c < 2; c++) { const d = ir.getChannelData(c); const r2 = rng(9 + c); for (let i = 0; i < L; i++) d[i] = (r2() * 2 - 1) * Math.pow(1 - i / L, 3); }
    conv.buffer = ir; const wet = ctx.createGain(); wet.gain.value = .32; conv.connect(wet); wet.connect(out);
    const dry = ctx.createGain(); dry.gain.value = .85; dry.connect(out);
    const send = n => { n.connect(dry); n.connect(conv); };
    const env = (g, t, a, peak, dec, end) => { g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.setTargetAtTime(.0001, t + a, dec); return end; };
    const osc = (type, f, t, stop) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = f; o.start(t); o.stop(stop); return o; };
    function noiseHit(t, freq, q, vel, len, type = 'bandpass') { const s = ctx.createBufferSource(); s.buffer = noise; const f = ctx.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q; const g = ctx.createGain(); env(g, t, .002, vel, len / 3); s.connect(f); f.connect(g); send(g); s.start(t, rr() * .5); s.stop(t + len + .1); }
    return {
      lead(lead, t, m, dur, vel) {
        const f = mtof(m), g = ctx.createGain(), stop = t + dur + .6;
        if (lead === 'piano') { [['triangle', 1, .6], ['sine', 2, .25], ['sine', 3, .08]].forEach(([ty, h, a]) => osc(ty, f * h, t, stop).connect(g)); env(g, t, .005, .22 * vel, .55); g.gain.setTargetAtTime(.0001, t + dur, .15); }
        else if (lead === 'guitar') { const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(3500, t); lp.frequency.exponentialRampToValueAtTime(700, t + .6); osc('sawtooth', f, t, stop).connect(lp); osc('triangle', f, t, stop).connect(lp); lp.connect(g); env(g, t, .004, .16 * vel, .45); }
        else if (lead === 'bau') {
          // đàn bầu: tiếng sine trong, luyến lên từ dưới và rung sâu
          const o = osc('sine', f * .94, t, stop); o.frequency.exponentialRampToValueAtTime(f, t + .18);
          const lfo = osc('sine', 4.6, t, stop), lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .022, t + Math.min(.6, dur * .7)); lfo.connect(lg); lg.connect(o.frequency);
          const h2 = osc('sine', f * 2, t, stop), hg = ctx.createGain(); hg.gain.value = .18; h2.connect(hg); hg.connect(g); o.connect(g);
          g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.22 * vel, t + .03); g.gain.setTargetAtTime(.08 * vel, t + .1, .5); g.gain.setValueAtTime(.08 * vel, t + dur); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .5);
        }
        else {
          // sáo, vĩ cầm, kèn: nốt kéo dài có rung (vibrato)
          const ty = lead === 'violin' ? 'sawtooth' : lead === 'ken' ? 'square' : 'sine';
          const o = osc(ty, f, t, stop), lfo = osc('sine', 5.2, t, stop), lg = ctx.createGain(); lg.gain.setValueAtTime(0, t); lg.gain.linearRampToValueAtTime(f * .012, t + Math.min(.35, dur * .6)); lfo.connect(lg); lg.connect(o.frequency);
          const lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = lead === 'violin' ? 2600 : lead === 'ken' ? 1800 : 5000; o.connect(lp); lp.connect(g);
          if (lead === 'sao') { const s = ctx.createBufferSource(); s.buffer = noise; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = f * 2; bp.Q.value = 3; const ng = ctx.createGain(); ng.gain.value = .05; s.connect(bp); bp.connect(ng); ng.connect(g); s.start(t, rr() * .5); s.stop(stop); }
          const pk = (lead === 'violin' ? .11 : lead === 'ken' ? .06 : .2) * vel;
          g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(pk, t + (lead === 'violin' ? .12 : .06)); g.gain.setValueAtTime(pk, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .25);
        }
        send(g);
      },
      guitar(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(2800, t); lp.frequency.exponentialRampToValueAtTime(500, t + .5); osc('triangle', f, t, t + dur + .4).connect(lp); osc('sawtooth', f * 1.002, t, t + dur + .4).connect(lp); lp.connect(g); env(g, t, .003, .06 * vel, .35); send(g); },
      piano(t, m, dur, vel) { this.lead('piano', t, m, dur, vel * .6); },
      epiano(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(); osc('sine', f, t, t + dur + .5).connect(g); const tr = osc('sine', f * 4, t, t + .3), tg = ctx.createGain(); tg.gain.value = .15; tr.connect(tg); tg.connect(g); env(g, t, .01, .12 * vel, .8); g.gain.setTargetAtTime(.0001, t + dur, .2); send(g); },
      tranh(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 4000; const o = osc('triangle', f, t, t + 2.2); o.frequency.setValueAtTime(f * .985, t); o.frequency.exponentialRampToValueAtTime(f, t + .08); o.connect(lp); osc('sine', f * 2, t, t + 1).connect(lp); lp.connect(g); env(g, t, .002, .16 * vel, .5); send(g); },
      pad(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 900; [-7, 7].forEach(d => { const o = osc('sawtooth', f, t, t + dur + 1); o.detune.value = d; o.connect(lp); }); lp.connect(g); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.025 * vel * 2, t + .6); g.gain.setValueAtTime(.025 * vel * 2, t + dur); g.gain.linearRampToValueAtTime(.0001, t + dur + .8); send(g); },
      bass(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(); osc('sine', f, t, t + dur + .3).connect(g); const o2 = osc('triangle', f * 2, t, t + dur + .3), g2 = ctx.createGain(); g2.gain.value = .25; o2.connect(g2); g2.connect(g); env(g, t, .01, .32 * vel, dur * .6); g.connect(dry); },
      kick(t, vel) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(120, t); o.frequency.exponentialRampToValueAtTime(45, t + .15); env(g, t, .003, .6 * vel, .09); o.connect(g); g.connect(dry); o.start(t); o.stop(t + .5); },
      conga(t, vel, hi) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(hi ? 330 : 220, t); o.frequency.exponentialRampToValueAtTime(hi ? 260 : 170, t + .12); env(g, t, .002, .35 * vel, .07); o.connect(g); send(g); o.start(t); o.stop(t + .4); },
      snare(t, vel) { noiseHit(t, 1800, .8, .28 * vel, .18); },
      hat(t, vel) { noiseHit(t, 8000, 1, .12 * vel, .05, 'highpass'); },
      shaker(t, vel) { noiseHit(t, 6500, 2, .08 * vel, .07); },
      brush(t, vel) { noiseHit(t, 4000, .6, .1 * vel, .2); },
      brass(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.setValueAtTime(600, t); lp.frequency.linearRampToValueAtTime(2200, t + .08); lp.frequency.setTargetAtTime(1100, t + .1, .3); [-5, 5].forEach(d => { const o = osc('sawtooth', f, t, t + dur + .4); o.detune.value = d; o.connect(lp); }); lp.connect(g); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.07 * vel, t + .05); g.gain.setValueAtTime(.07 * vel, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur + .3); send(g); },
      tronglon(t, vel) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.setValueAtTime(95, t); o.frequency.exponentialRampToValueAtTime(48, t + .3); env(g, t, .003, .8 * vel, .16); o.connect(g); send(g); o.start(t); o.stop(t + .9); noiseHit(t, 700, 1, .18 * vel, .12); },
      chieng(t, vel) { [110, 165.4, 221.7, 294].forEach((fq, j) => { const o = osc('sine', fq * (1 + j * .004), t, t + 4), g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12 * vel / (j + 1), t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + 3.8); o.connect(g); send(g); }); },
      supersaw(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.frequency.value = 3200; [-14, -6, 0, 7, 15].forEach(d => { const o = osc('sawtooth', f, t, t + dur + .1); o.detune.value = d; o.connect(lp); }); lp.connect(g); g.gain.setValueAtTime(.0001, t); g.gain.linearRampToValueAtTime(.035 * vel, t + dur * .35); g.gain.linearRampToValueAtTime(.03 * vel, t + dur * .85); g.gain.linearRampToValueAtTime(.0001, t + dur); send(g); },
      pluck(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(), lp = ctx.createBiquadFilter(); lp.type = 'lowpass'; lp.Q.value = 4; lp.frequency.setValueAtTime(5200, t); lp.frequency.exponentialRampToValueAtTime(500, t + .22); osc('sawtooth', f, t, t + dur + .3).connect(lp); osc('square', f * 2, t, t + dur + .3).connect(lp); lp.connect(g); env(g, t, .002, .13 * vel, .12); send(g); },
      sub(t, m, dur, vel) { const f = mtof(m), g = ctx.createGain(); osc('sine', f, t, t + dur + .05).connect(g); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.38 * vel, t + .02); g.gain.setValueAtTime(.38 * vel, t + dur * .8); g.gain.exponentialRampToValueAtTime(.0001, t + dur); g.connect(dry); },
      clap(t, vel) { [0, .012, .025].forEach(d => noiseHit(t + d, 1400, .9, .22 * vel, .16)); },
      riser(t, m, dur, vel) { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.Q.value = 2; bp.frequency.setValueAtTime(300, t); bp.frequency.exponentialRampToValueAtTime(9000, t + dur); const g = ctx.createGain(); g.gain.setValueAtTime(.0001, t); g.gain.exponentialRampToValueAtTime(.12 * vel, t + dur * .97); g.gain.linearRampToValueAtTime(.0001, t + dur); s.connect(bp); bp.connect(g); send(g); s.start(t); s.stop(t + dur + .05); },
      mo(t, vel) { const o = ctx.createOscillator(), g = ctx.createGain(); o.frequency.value = 900; env(g, t, .001, .25 * vel, .03); o.connect(g); send(g); o.start(t); o.stop(t + .2); },
      vinyl(t0, t1) { const s = ctx.createBufferSource(); s.buffer = noise; s.loop = true; const hp = ctx.createBiquadFilter(); hp.type = 'highpass'; hp.frequency.value = 3000; const g = ctx.createGain(); g.gain.value = .012; s.connect(hp); hp.connect(g); g.connect(dry); s.start(t0); s.stop(t1); }
    };
  }

  /* lên lịch phát (dùng cho cả nghe trực tiếp, nhạc nền video, xuất WAV) */
  function schedule(ctx, dest, song, total, offset = 0) {
    const master = ctx.createGain(); master.connect(dest);
    const t0 = ctx.currentTime, at = x => Math.max(t0, t0 + x - offset);
    master.gain.setValueAtTime(0, at(Math.max(offset, 0))); master.gain.linearRampToValueAtTime(.9, at(Math.max(offset + .05, 1.2)));
    master.gain.setValueAtTime(.9, at(Math.max(offset + .1, total - 3))); master.gain.linearRampToValueAtTime(0, at(total));
    const V = makeVoices(ctx, master), { events } = arrange(song, total);
    if (song.style === 'lofi') V.vinyl(at(Math.max(offset, 0)), at(total));
    events.forEach(e => {
      if (e.t < offset - .05) return; const t = at(e.t);
      if (e.inst === 'lead') V.lead(song.lead, t, e.note, e.dur, e.vel);
      else if (['kick', 'snare', 'hat', 'shaker', 'brush', 'mo', 'tronglon', 'chieng', 'clap'].includes(e.inst)) V[e.inst](t, e.vel);
      else if (e.inst === 'conga' || e.inst === 'conga2') V.conga(t, e.vel, e.inst === 'conga2');
      else V[e.inst](t, e.note, e.dur, e.vel);
    });
    return master;
  }

  async function renderWav(song, seconds) {
    const sr = 44100, ctx = new OfflineAudioContext(2, Math.ceil(sr * seconds), sr);
    schedule(ctx, ctx.destination, song, seconds, 0);
    const buf = await ctx.startRendering();
    const Lc = buf.getChannelData(0), Rc = buf.getChannelData(1), n = Lc.length;
    const ab = new ArrayBuffer(44 + n * 4), v = new DataView(ab);
    const ws = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    ws(0, 'RIFF'); v.setUint32(4, 36 + n * 4, true); ws(8, 'WAVE'); ws(12, 'fmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 2, true);
    v.setUint32(24, sr, true); v.setUint32(28, sr * 4, true); v.setUint16(32, 4, true); v.setUint16(34, 16, true); ws(36, 'data'); v.setUint32(40, n * 4, true);
    for (let i = 0, o = 44; i < n; i++, o += 4) { v.setInt16(o, Math.max(-1, Math.min(1, Lc[i])) * 32767, true); v.setInt16(o + 2, Math.max(-1, Math.min(1, Rc[i])) * 32767, true); }
    return new Blob([ab], { type: 'audio/wav' });
  }

  /* thư viện bài nhạc (lưu trong trình duyệt) */
  const lib = {
    list() { try { return JSON.parse(localStorage.getItem('xv-songs') || '[]'); } catch (e) { return []; } },
    save(s) { const a = lib.list().filter(x => x.id !== s.id); a.unshift(s); try { localStorage.setItem('xv-songs', JSON.stringify(a)); } catch (e) {} },
    remove(id) { try { localStorage.setItem('xv-songs', JSON.stringify(lib.list().filter(x => x.id !== id))); } catch (e) {} },
    get(id) { return lib.list().find(x => x.id === id) || null; }
  };

  window.Nhac = { STYLES, LEADS, KEYS, newSong, arrange, schedule, renderWav, lib };
})();
