/* =========================================================================
   PROMPT AI – sinh prompt cho công cụ tạo video/ảnh AI (Google Veo 3.1 / Flow,
   Gemini, Kling, Runway…) từ dữ liệu từng cảnh, đúng thời đại & trang phục.
   Cấu trúc theo hướng dẫn Veo: khung hình → chủ thể & hành động → bối cảnh →
   chuyển động máy quay → phong cách & ánh sáng (100–150 từ, tiếng Anh).
   ========================================================================= */
(function () {
  'use strict';
  const LOOK = 'Photorealistic cinematic historical epic, shot on ARRI Alexa with anamorphic lenses, natural film grain, volumetric light and atmospheric haze, muted earthy palette with warm ember highlights, shallow depth of field.';
  const NEG = 'modern objects, electricity, text, letters, subtitles, watermark, logo, Japanese samurai armor, European ships or soldiers, firearms, anachronistic flags, gore, blood splatter, deformed hands, extra limbs, distorted faces, cartoon, anime, video game look, oversaturated colors';

  /* Bối cảnh từng trận (theo sử liệu phổ thông; trang phục là tái hiện ước lượng) */
  const ERA = {
    'bach-dang-938': { era: '10th-century Vietnam (year 938), Ngô Quyền era', ours: 'Vietnamese soldiers of Ngô Quyền in plain brown hemp tunics and loincloths, conical palm-leaf hats, round rattan shields, bronze-tipped spears and bows', enemy: 'Southern Han (Nam Hán) Chinese marines in red-lacquered leather armor and iron helmets aboard tall multi-deck war junks', place: 'the tidal Bạch Đằng estuary in northern Vietnam with limestone karst islands, mangrove banks and misty brown water', time: 'winter dusk, cold grey light' },
    'nhu-nguyet-1077': { era: '11th-century Đại Việt, Lý dynasty (year 1077)', ours: 'Lý dynasty Vietnamese soldiers in indigo cotton tunics with leather lamellar vests, conical hats, long spears and crossbows, the characters "Thiên tử binh" inked on their foreheads', enemy: 'Song dynasty Chinese infantry in heavy iron lamellar armor with red tassels and crossbowmen, siege rafts', place: 'the Như Nguyệt (Cầu) river in northern Vietnam with a long bamboo-stake palisade and earthen ramparts on the southern bank, rice fields and low hills', time: 'early spring, drizzle and fog' },
    'bach-dang-1288': { era: '13th-century Đại Việt, Trần dynasty (April 1288)', ours: 'Trần dynasty Vietnamese soldiers in brown and indigo cotton tunics with leather lamellar vests, conical bamboo hats, round rattan shields, long spears and crossbows, the two characters "Sát Thát" tattooed on their arms; commanders in red-and-gold lacquered lamellar armor', enemy: 'Yuan-Mongol troops in iron-studded leather armor and fur-trimmed helmets aboard large wooden Yuan war junks with ribbed batten sails and blue banners', place: 'the Bạch Đằng river estuary in northern Vietnam among limestone karst islands and mangroves, with a field of sharpened iron-tipped wooden stakes hidden under the tidal water', time: 'spring morning with low golden sun and river mist' },
    'chi-lang-1427': { era: '15th-century Đại Việt, Lam Sơn uprising (autumn 1427)', ours: 'Lam Sơn insurgent soldiers in dark brown and black cotton clothes, conical hats, bamboo shields, spears, crossbows and war elephants hidden in the forest', enemy: 'Ming dynasty Chinese cavalry and infantry in red cloth-covered brigandine armor and iron helmets with plumes, carrying yellow Ming banners', place: 'the narrow Chi Lăng mountain pass in Lạng Sơn, northern Vietnam, a muddy road between jagged forested limestone cliffs', time: 'autumn, overcast sky, mist in the valley' },
    'rach-gam-1785': { era: '18th-century Vietnam, Tây Sơn army (January 1785)', ours: 'Tây Sơn soldiers in red tunics and turbans with spears, swords and bows, small fast war boats with oars', enemy: 'Siamese (Thai) army of the 1780s in white and red uniforms with pointed helmets aboard large river war boats', place: 'the wide Mekong (Tiền Giang) river in southern Vietnam near Mỹ Tho, with coconut palms, nipa palms and river islets', time: 'pre-dawn blue hour turning to sunrise' },
    'dong-da-1789': { era: '18th-century Vietnam, Tây Sơn army of Emperor Quang Trung (Lunar New Year 1789)', ours: 'Tây Sơn soldiers in red tunics and red turbans advancing behind large wooden shields wrapped in wet straw, with spears, swords and war elephants', enemy: 'Qing dynasty Chinese soldiers in padded quilted armor and conical hats with red tassels, earthen forts with wooden palisades', place: 'the countryside south of Thăng Long (Hanoi) in winter with bare trees, peach blossoms and smoke over earthen forts', time: 'cold misty dawn of Tết, pink peach blossoms' }
  };
  function eraOf(b) { return ERA[b.id] || { era: b.era || 'historical Vietnam', ours: 'Vietnamese soldiers', enemy: 'invading army', place: 'Vietnamese landscape', time: 'golden hour' }; }

  function wrap(shot, subject, set, cam, mood) { return { shot, subject, set, cam, mood: mood || '' }; }

  /* prompt cho từng cảnh (trả về danh sách – cảnh dài như diễn biến sẽ có nhiều clip 8 giây) */
  function forScene(b, sc, i) {
    const E = eraOf(b), out = [];
    const add = (label, P) => out.push({ label, seconds: 8,
      video: [P.shot, P.subject, P.set, P.cam, LOOK, P.mood].join(' ').replace(/\s+/g, ' ').trim(),
      image: ['Photorealistic historical film still.', P.subject, P.set, LOOK.replace('Photorealistic cinematic historical epic, ', ''), (P.mood || '').replace(/,? *no gore\.?/, '')].join(' ').replace(/\s+/g, ' ').trim() });
    const set = `Setting: ${E.place}, ${E.era}, ${E.time}.`;
    switch (sc.type) {
      case 'title': add('Mở đầu – toàn cảnh', wrap('Extreme wide aerial establishing shot.', `A vast ${E.place.split(',')[0]} at the edge of a historic battle, with ${E.enemy.split(' in ')[0]} visible far away as tiny silhouettes.`, set, 'Slow drone push-in over the water, rising gently to reveal the horizon.', 'Epic, solemn, awe-inspiring mood; no people in close-up.')); break;
      case 'hero': add(`Nhân vật – ${sc.name}`, wrap('Medium shot, low angle, then slow push-in to a heroic close-up from the side.', `${sc.name}, the Vietnamese commander (${sc.role || 'military leader'}), a dignified middle-aged general in red-and-gold lacquered lamellar armor and helmet, holding a sword, standing on a hilltop beside a large red command banner rippling in the wind, gazing toward the battlefield. Face partly in shadow, respectful and noble portrayal.`, set, 'Slow dolly in with slight upward tilt; banner flapping.', 'Heroic, determined, reverent mood.')); break;
      case 'map': add('Bối cảnh – nhìn từ trên cao', wrap('High aerial top-down drone shot.', `The ${E.place.split(',')[0]} seen from above, a winding river among mountains, with a long column of ${E.enemy.split(' in ')[0]} moving along it like an armada.`, set, 'Slow overhead drift following the river, gradually tilting toward the horizon.', 'Strategic, documentary mood, like a historical map coming to life.')); break;
      case 'forces': add('Tương quan lực lượng', wrap('Tracking shot alongside, medium-wide.', `A massive force of ${E.enemy}, banners and weapons gleaming, moving forward in great numbers; intercut feeling with small, agile groups of ${E.ours} watching silently from cover.`, set, 'Smooth lateral tracking shot, then slow rack focus from the enemy to the hidden Vietnamese soldiers in the foreground.', 'Tense, ominous mood; contrast between a huge invader and a determined defender.')); break;
      case 'diagram': (sc.phases || [[0, sc.title]]).forEach(([f, ph], k) => {
        const text = ph.replace(/^\d+\s*·\s*/, '');
        add(`Diễn biến ${k + 1}: ${text}`, wrap(['Wide shot at water level.', 'Dynamic tracking shot.', 'Over-the-shoulder shot from the riverbank.', 'Wide aerial shot.'][k % 4], `${phaseAction(b, text, E)}`, set, ['Slow push-in, low near the water surface.', 'Fast handheld tracking with the action, slight camera shake.', 'Camera rises from behind the soldiers to reveal the battle.', 'Slow orbiting drone shot over the scene.'][k % 4], 'Intense epic battle atmosphere, smoke, embers drifting, no gore.'));
      }); break;
      case 'quote': add('Trích dẫn – không khí', wrap('Slow-motion medium close-up.', `${E.ours.split(',')[0]} standing in silence at dusk, fists clenched, embers and smoke drifting across the frame, a red banner behind them.`, set, 'Very slow dolly in, 48fps slow-motion feel.', `Solemn, emotional mood matching the words: "${(sc.quote || '').slice(0, 120)}".`)); break;
      case 'points': add('Ý nghĩa – chiến thắng', wrap('Wide shot at sunrise.', `Victorious ${E.ours.split(',')[0]} raising red banners on the riverbank and boats, the morning sun breaking through mist over the battlefield, calm water reflecting the light.`, set, 'Slow crane up revealing the landscape and the victorious army.', 'Triumphant, proud, hopeful mood.')); break;
      case 'end': add('Kết – tĩnh lặng', wrap('Extreme wide shot.', `The peaceful ${E.place.split(',')[0]} today-like calm after the battle, mist over the water, a lone small boat drifting.`, set, 'Very slow pull-back and rise of the drone.', 'Peaceful, reflective, memorial mood.')); break;
      case 'stat': case 'card': case 'timeline': default:
        add(`Cảnh ${i + 1}`, wrap('Cinematic medium-wide shot.', `${(sc.heading || sc.title || '')} – ${(sc.say || '').slice(0, 220)}`, set, 'Slow dolly in.', 'Documentary mood.'));
    }
    out.forEach(o => o.negative = NEG);
    return out;
  }
  function phaseAction(b, text, E) {
    const t = text.toLowerCase();
    if (/cọc/.test(t) && /(đóng|bố trí|bãi)/.test(t)) return `At low tide, ${E.ours.split(',')[0]} drive rows of sharpened iron-tipped wooden stakes into the muddy riverbed, the stakes slanting toward the sea.`;
    if (/nước lên|nhử/.test(t)) return `At high tide the stakes disappear under the water; small Vietnamese boats with red flags provoke the ${E.enemy.split(' in ')[0]} and then flee, luring the huge enemy fleet deeper into the river.`;
    if (/nước rút|phản công|phục binh|đổ ra|tấn công/.test(t)) return `As the tide falls, hundreds of ${E.ours.split(',')[0]} rise from the reeds on both riverbanks and shoot volleys of flaming arrows, while Vietnamese war boats charge out from side channels.`;
    if (/cọc|đắm|cháy|vỡ/.test(t)) return `Enemy war junks are impaled on the emerging stakes, tilting and sinking, burning with tall flames and black smoke as Vietnamese boats surround them.`;
    if (/giả thua|nhử địch vào ải/.test(t)) return `A small Vietnamese unit pretends to retreat into a narrow mountain pass, chased by ${E.enemy.split(' in ')[0]}.`;
    if (/phục binh hai bên núi|chém/.test(t)) return `Ambushers burst from the forested cliffs on both sides of the pass and crash into the enemy column; banners fall in the mud.`;
    if (/vượt sông/.test(t)) return `Waves of ${E.enemy.split(' in ')[0]} try to cross the river on rafts while defenders on the palisade shoot crossbows.`;
    if (/đánh úp|bất ngờ/.test(t)) return `At night Vietnamese troops silently cross the river by boat and storm the enemy camp, torches igniting tents.`;
    if (/tháo chạy|cầu phao|rút về/.test(t)) return `The defeated ${E.enemy.split(' in ')[0]} flee in panic across a crowded pontoon bridge that collapses into the river.`;
    if (/mộc|ngọc hồi|hà hồi|khương thượng/.test(t)) return `Tây Sơn soldiers advance in tight formation behind wooden shields wrapped in wet straw toward a smoking earthen fort, war elephants beside them.`;
    if (/mai phục|thủy binh|xuôi dòng/.test(t)) return `A large enemy river fleet sails into a stretch of river where Tây Sơn boats and soldiers lie hidden among palms and islets.`;
    return `${E.ours.split(',')[0]} fight ${E.enemy.split(' in ')[0]}: ${text}.`;
  }
  /* meta-prompt: nhờ Gemini viết prompt Veo từ lời dẫn */
  function geminiMeta(b, sc) {
    const E = eraOf(b);
    return `Bạn là đạo diễn hình ảnh phim lịch sử. Hãy viết 1–3 prompt tiếng Anh cho Google Veo 3.1 (mỗi prompt cho một clip 8 giây, 100–150 từ, theo cấu trúc: khung hình → chủ thể & hành động → bối cảnh → chuyển động máy quay → phong cách & ánh sáng) minh họa lời dẫn sau, KHÔNG có chữ, KHÔNG có lời thoại, KHÔNG có cảnh máu me.
Thời đại: ${E.era}. Quân ta: ${E.ours}. Quân địch: ${E.enemy}. Bối cảnh: ${E.place}; ${E.time}.
Phong cách chung: ${LOOK}
Lời dẫn của cảnh: "${sc.say || ''}"
Cuối mỗi prompt, thêm dòng "Negative: ${NEG}".`;
  }
  function filmPack(b) {
    let txt = `BỘ PROMPT AI – ${b.name}\nDùng cho Google Flow / Veo 3.1 (clip 8 giây, khung 16:9 hoặc 9:16), Gemini, Kling, Runway…\n\nHƯỚNG DẪN NHANH\n1. Tạo ảnh khung đầu bằng "Image prompt" (Gemini / Imagen) để giữ nhất quán nhân vật, rồi dùng Frames to Video.\n2. Hoặc dán thẳng "Video prompt" vào Flow (Text to Video). Tắt âm thanh của clip (app đã có giọng đọc & nhạc).\n3. Tải clip về, gắn vào đúng cảnh trong Xưởng Video (Dùng mẫu này làm dự án của bạn → bấm cảnh → Thêm ảnh/video).\n\nPHONG CÁCH CHUNG: ${LOOK}\nNEGATIVE: ${NEG}\n`;
    b.scenes.forEach((sc, i) => {
      txt += `\n════════ CẢNH ${i + 1} · ${sc.type.toUpperCase()} ════════\nLời dẫn: ${sc.say}\n`;
      forScene(b, sc, i).forEach(p => { txt += `\n▶ ${p.label} (${p.seconds}s)\nVIDEO PROMPT:\n${p.video}\n\nIMAGE PROMPT (khung đầu):\n${p.image}\n`; });
    });
    return txt;
  }
  window.AIPrompt = { forScene, geminiMeta, filmPack, NEG, LOOK, ERA };
})();
