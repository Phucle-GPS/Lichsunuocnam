/* =========================================================================
   PROMPT PHIM NGƯỜI QUE LỊCH SỬ – Style A5 Historical Cartoon
   Theo quy trình skill "directing-stickman-videos" (kaomei/stickman-video-director, MIT):
   Phase A = đề xuất đạo diễn (era pack, cast card, giọng, nhịp) → Phase B = prompt độc lập từng clip,
   lặp NGUYÊN VĂN khối vẽ A5 + cast card đầy đủ + nhịp hành động có mốc giây + cấm kỵ.
   Giọng: lời dẫn Manus là bản thu ngoài (external VO master) – KHÔNG yêu cầu mô hình video nói.
   ========================================================================= */
(function () {
  'use strict';
  const CLIP = 8; // giây mỗi clip nguồn (Veo/Flow); cảnh dài ⇒ nhiều clip nối tiếp

  /* trang phục chỉ huy theo thời kỳ (mô tả minh họa, không khẳng định là trang phục chính xác) */
  const ERA_KIND = b => { const y = parseInt(b.year, 10); return y < 900 ? 'bac' : y < 1000 ? 'ngo' : y < 1200 ? 'ly' : y < 1400 ? 'tran' : y < 1700 ? 'le' : y < 1850 ? 'tayson' : 'nguyen'; };
  const LEAD = {
    bac: 'a Vietnamese leader of ancient Giao Chỉ: long black hair tied up, a red cloth headscarf, a brown wrap tunic with bronze plates, a red sash, bare feet, a bronze sword',
    nguyen: 'a 19th-century Vietnamese mandarin general: short black beard, a black turban, a red tunic with a blue sash over loose white trousers, black boots, a curved sabre',
    nu: 'a Vietnamese woman general: long black hair in a high bun with a golden hairpin, determined eyebrows, ornate red-and-gold armor over a yellow tunic, a red cape, holding a sword',
    ngo: 'a Vietnamese general of the 10th century in his forties: short black beard and moustache drawn as a few cel-shaded locks, determined thick eyebrows, a dark red cloth headscarf tied at the back, a brown lamellar leather cuirass over a long indigo robe, a red sash, black boots, a straight bronze sword at the hip',
    ly: 'a Vietnamese Lý-dynasty grand general in his late fifties: neat grey beard, calm wise eyebrows, a black gauze official hat with two short side wings, red-and-gold lacquered lamellar armor over a crimson robe, a red cape, black boots, a long sword at the hip',
    tran: 'a Vietnamese Trần-dynasty commander in his fifties: short black beard with a little grey, firm straight eyebrows, a red cloth headband, red-and-gold lacquered lamellar armor over a deep crimson robe, a short red cape, black boots, a straight sword at the hip',
    le: 'a Vietnamese Lam Sơn commander in his forties: short black beard, alert eyebrows, a black cloth turban, dark brown quilted armor with leather plates, a red sash, straw sandals, a curved saber at the hip',
    tayson: 'a Vietnamese Tây Sơn commander in his thirties: clean-shaven determined face with bold eyebrows, a red turban, a red tunic with a gold-trimmed leather breastplate, a wide black sash, black boots, a long saber at the hip'
  };
  const PALETTE = { bac: 'earth brown, bronze, jungle green, river grey, vermilion red', nguyen: 'royal red, indigo, khaki, gunsmoke grey, tropical green', ngo: 'deep river blue, earth brown, vermilion red, bamboo green, misty grey', ly: 'crimson, bronze gold, forest green, river grey, warm tan', tran: 'vermilion red, bronze gold, earth brown, indigo, moss green, river grey', le: 'forest green, dark brown, ochre, mist grey, blood-orange sunset', tayson: 'bright red, gold, peach-blossom pink, dark earth, winter grey' };
  const MUSIC = { bac: 'bronze drums, bamboo flutes, deep gongs', nguyen: 'war drums, đàn nguyệt, mournful horns', ngo: 'deep war drums, low bamboo flute, plucked zither', ly: 'war drums, horns, đàn tranh zither', tran: 'thunderous war drums, buffalo horns, bamboo flute, bronze gongs', le: 'forest percussion, low drums, đàn bầu monochord', tayson: 'fast war drums, bronze gongs, horns, festive cymbals' };

  /* nhịp hành động người que (tiếng Anh cho mô hình video) */
  const ACT = {
    hanhquan: ['wide lateral tracking shot: a column of soldiers marches left to right along the riverbank, spears upright, the flag bearer at the front', 'medium shot: feet stamp in rhythm, dust rises, the commander rides alongside and raises a hand', 'the column crests a low hill and the camera rises to reveal the landscape ahead'],
    cheo: ['wide shot: a long war boat with a curved prow cuts across the water, five rowers pulling oars in unison', 'medium shot: oars dip and splash in rhythm, the steersman at the stern points forward', 'the boat surges past the camera, spray flying, flag snapping in the wind'],
    ban: ['medium shot: a line of archers kneels behind rattan shields and nocks arrows', 'they draw their bows together and release on the commander\'s gesture', 'wide shot: a volley of arrows arcs across the sky toward the enemy side of the frame'],
    cuoingua: ['wide shot: a rider gallops across an open field, spear lowered, dust trailing', 'tracking shot beside the horse: mane and cape flying, hooves pounding', 'the rider charges toward the right of frame where enemy shields scatter'],
    danh: ['medium shot: a Vietnamese soldier with a sword faces an enemy soldier with a spear, both in guard stance', 'they clash: sword parries the spear, a bright spark flash, the enemy stumbles back', 'the Vietnamese soldier holds his ground as comrades rush in from the left'],
    phatco: ['low-angle shot: the commander stands on a rock and lifts a large red flag (no text)', 'he waves the flag in wide arcs; soldiers below raise spears and swords and cheer', 'the camera pulls back to show the whole army answering the signal'],
    vui: ['medium shot: soldiers leap and raise their weapons in victory', 'they embrace and throw their conical hats into the air', 'wide shot: banners wave over the riverbank at golden hour'],
    noi: ['medium shot: the commander stands beside a wooden table with a painted map scroll (abstract brush strokes, no text)', 'he traces the river route with his palm while two officers lean in', 'he looks up with a confident nod'],
    nghi: ['close shot: the commander stands alone at the riverbank, chin resting on his palm, thinking', 'the tide moves slowly; he studies the water and the wooden stakes', 'his eyes widen with an idea, he turns toward his officers'],
    chay: ['tracking shot: enemy soldiers flee in disorder to the right, dropping helmets and spears', 'they stumble across mud and reeds as their boats burn behind them', 'wide shot: the fleeing figures grow small against the smoke'],
    di: ['tracking shot: the commander walks through a quiet village with two officers', 'villagers bow and offer rice baskets; he returns the bow', 'they continue down a bamboo-lined path toward the camp']
  };
  /* gợi ý hành động mặc định theo loại cảnh của trận mẫu (giống cloneStick trong app) */
  const BY_TYPE = { title: 'hanhquan', hero: 'phatco', map: 'noi', forces: 'hanhquan', diagram: 'cheo', timeline: 'noi', quote: 'phatco', points: 'vui', end: 'vui' };

  function eraPack(b) {
    const E = (window.AIPrompt && (AIPrompt.ERA[b.id] || (AIPrompt.eraOf && AIPrompt.eraOf(b)))) || {}, k = ERA_KIND(b);
    return { E, k, lead: /Bà /.test(b.who) || /^Bà/.test(b.who) ? LEAD.nu : LEAD[k], palette: PALETTE[k], music: MUSIC[k] };
  }
  const castCards = (b, P) => [
    `COMMANDER (${b.who}): ${P.lead}. Same white round head and short white neck as the drawing anchor, thin black limbs, compact black mitten palms.`,
    `ĐẠI VIỆT SOLDIERS (uniform group): ${P.E.ours || 'Vietnamese soldiers in brown tunics and conical hats with spears'}. Drawn with the same white heads, short white necks, thin black limbs and black mitten palms; no readable tattoo letters (only abstract ink marks).`,
    `ENEMY SOLDIERS – ${b.vs} (uniform group): ${P.E.enemy || 'invading soldiers in foreign armor'}. Same drawing grammar; cartoon depiction, not a caricature of any ethnicity.`
  ];

  function clipsFor(b, sc, i, dur, P) {
    const g = window.Xuong ? Xuong.guessAction(sc.say || '') : 'noi';
    const act = ['title', 'hero', 'forces', 'points', 'end'].includes(sc.type) || g === 'noi' ? BY_TYPE[sc.type] || g : g, beats = ACT[act] || ACT.noi;
    const seq = [...beats, 'close-up reaction: the commander watches the action, jaw set, eyes narrowed with resolve', 'wide aerial shot: the same action continues across the landscape, many small figures in uniform ranks', 'medium shot from a new angle: the action reaches its peak and holds for a beat'];
    const n = Math.max(1, Math.ceil((dur || 8) / CLIP)), out = [];
    for (let k = 0; k < n; k++) {
      const part = [0, 1, 2].map(j => seq[(k * 3 + j) % seq.length]);
      out.push({ act, k, n, txt: [
        `stickman animated video, 16:9, ${CLIP} seconds, 24 fps.`,
        A5_ANCHOR,
        `STYLE: polished 2D cel-shaded historical cartoon, full-color painted backgrounds. ERA: ${P.E.era || 'historical Vietnam'}. SETTING: ${P.E.place || 'Vietnamese landscape'}; ${P.E.time || 'golden hour'}. PALETTE: ${P.palette}.`,
        'CAST: ' + castCards(b, P).join(' '),
        `OPENING: ${k === 0 ? 'establish the location and screen direction (Đại Việt on the left moving right, enemy on the right)' : 'continue directly from the previous clip\'s last action and screen direction'}.`,
        `ACTION: [0–3s] ${part[0]}. [3–6s] ${part[1]}. [6–8s] ${part[2]}.`,
        `SOUND: no speech from characters; external narration is added in editing. Era score: ${P.music}. Timed SFX that match the action.`,
        A5_NEG
      ].join('\n\n') });
    }
    return out;
  }

  /* b: trận (battles.js); durs: thời lượng giọng Manus từng cảnh (giây, có thể thiếu) */
  function pack(b, durs = []) {
    const P = eraPack(b), dur = i => durs[i] || (window.Studio ? Studio.sceneDur(b.scenes[i]) : 8);
    const total = b.scenes.reduce((a, _, i) => a + dur(i), 0);
    let t = `PHIM NGƯỜI QUE LỊCH SỬ – ${b.name.toUpperCase()} (${b.who} · quân ${b.vs})\n` +
      `Phong cách A5 Historical Cartoon – quy trình skill directing-stickman-videos (kaomei/stickman-video-director, MIT).\n` +
      `Dán từng PROMPT CLIP vào Veo / Google Flow (chế độ text-to-video, 16:9, ${CLIP} giây). Nên tạo trước ảnh tham chiếu nhân vật (chính diện / nghiêng / sau lưng) và đính kèm mỗi lần tạo để giữ nhân vật nhất quán.\n\n`;
    t += `═══════════ PHASE A – ĐỀ XUẤT ĐẠO DIỄN ═══════════\n` +
      `• Tựa: ${b.name} – ${b.who}  |  EN: The Battle of ${b.name.replace(/\s(\d{3,4})$/, ' ($1)')}\n` +
      `• Khung hình 16:9 (bản 9:16 dựng lại bố cục dọc, không cắt xén) · Thời lượng ≈ ${Math.round(total)} giây theo giọng đọc\n` +
      `• Giọng: lời dẫn Manus (nam trầm, ấm, kể chậm) là BẢN THU NGOÀI – dựng hình theo giọng, không cho mô hình video nói\n` +
      `• Era pack: ${P.E.era || ''} · Bối cảnh: ${P.E.place || ''} · Màu: ${P.palette} · Nhạc: ${P.music}\n` +
      `• Sự thật & minh họa: lời dẫn bám nguồn (${(b.sources || []).join(', ')}); cảnh người que là minh họa, không bịa thêm câu nói hay số liệu.\n` +
      `• Cast card (lặp ĐẦY ĐỦ trong mọi prompt):\n  - ${castCards(b, P).join('\n  - ')}\n\n`;
    t += `═══════════ PHASE B – PROMPT TỪNG CLIP ═══════════\n`;
    let at = 0, clipNo = 0;
    b.scenes.forEach((sc, i) => {
      const d = dur(i), cl = clipsFor(b, sc, i, d, P);
      t += `\n━━━━ CẢNH ${i + 1} (${sc.type}) · ${at.toFixed(1)}–${(at + d).toFixed(1)}s · hành động: ${cl[0].act} ━━━━\nLời dẫn Manus (gốc giờ dựng, KHÔNG đưa vào prompt): "${sc.say}"\n`;
      cl.forEach(c => { clipNo++; t += `\n▶ CLIP ${clipNo}${c.n > 1 ? ` (phần ${c.k + 1}/${c.n})` : ''}\n${c.txt}\n`; });
      at += d;
    });
    t += `\n═══════════ HẬU KỲ ═══════════\n• Ghép clip theo thứ tự, cắt phần thừa đầu/đuôi; đặt giọng Manus làm trục thời gian.\n• Nhạc nền: phòng nhạc app (Hùng ca / Bi tráng) hoặc nhạc có giấy phép; nhạc tự hạ khi có giọng.\n• Phụ đề tiếng Việt thêm khi dựng (không để mô hình vẽ chữ).\n• Kiểm tra từng clip: đầu trắng nối cổ ngắn liền mạch, bàn tay đen hình găng không ngón, đúng số giáo/cờ, đúng hướng màn hình.\n`;
    return { text: t, clips: clipNo, total };
  }
  window.StickPrompt = { pack, ACT, LEAD };
})();
