/* =========================================================================
   GIỌNG MANUS ĐÃ LƯU – đọc lời dẫn ngay trong app (cấu hình: loi-dan/GIONG.json)
   - Mã truy cập (API key) chỉ lưu trong trình duyệt của máy này (localStorage).
   - voice_id lấy từ GIONG.json; nếu repo chưa có thì dùng voice_id nhập trong app.
   ========================================================================= */
(function () {
  'use strict';
  let cfg = null;
  const ls = { get: k => { try { return localStorage.getItem(k) || ''; } catch (e) { return ''; } }, set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch (e) {} } };

  async function config() {
    if (!cfg) { try { cfg = await (await fetch('loi-dan/GIONG.json', { cache: 'no-cache' })).json(); } catch (e) { cfg = { nha_cung_cap: 'elevenlabs', voice_id: '', elevenlabs: {} }; } }
    return cfg;
  }
  const settings = () => ({ provider: ls.get('xv-giong-ncc') || (cfg && cfg.nha_cung_cap) || 'elevenlabs', key: ls.get('xv-giong-key'), voiceId: ls.get('xv-giong-id') || (cfg && cfg.voice_id) || '' });
  function save({ provider, key, voiceId }) {
    if (provider != null) ls.set('xv-giong-ncc', provider === (cfg && cfg.nha_cung_cap) ? '' : provider);
    if (key != null) ls.set('xv-giong-key', key.trim());
    if (voiceId != null) ls.set('xv-giong-id', voiceId.trim() === ((cfg && cfg.voice_id) || '') ? '' : voiceId.trim());
  }
  const ready = () => { const s = settings(); return !!s.key && (s.provider === 'gemini' || !!s.voiceId); };

  function pcmToWav(b64, rate = 24000) {
    const pcm = Uint8Array.from(atob(b64), c => c.charCodeAt(0)), buf = new ArrayBuffer(44 + pcm.length), v = new DataView(buf);
    const w = (o, s) => [...s].forEach((c, i) => v.setUint8(o + i, c.charCodeAt(0)));
    w(0, 'RIFF'); v.setUint32(4, 36 + pcm.length, true); w(8, 'WAVEfmt '); v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
    v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true); w(36, 'data'); v.setUint32(40, pcm.length, true);
    new Uint8Array(buf, 44).set(pcm); return new Blob([buf], { type: 'audio/wav' });
  }

  /* đọc một đoạn văn → Blob âm thanh */
  async function speak(text) {
    await config(); const s = settings();
    if (!s.key) throw new Error('Chưa nhập mã truy cập (API key) của giọng Manus.');
    if (s.provider === 'gemini') {
      const g = cfg.gemini || {};
      const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${g.model}:generateContent`, { method: 'POST', headers: { 'x-goog-api-key': s.key, 'Content-Type': 'application/json' },
        body: JSON.stringify({ contents: [{ parts: [{ text: (g.phong_cach || '') + text }] }], generationConfig: { responseModalities: ['AUDIO'], speechConfig: { voiceConfig: { prebuiltVoiceConfig: { voiceName: g.voice || 'Charon' } } } } }) });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) throw new Error('Gemini: ' + ((j.error && j.error.message) || 'HTTP ' + r.status));
      const part = (((j.candidates || [])[0] || {}).content || {}).parts || [], d = (part.find(p => p.inlineData) || {}).inlineData;
      if (!d) throw new Error('Gemini không trả về âm thanh.');
      return pcmToWav(d.data, +((d.mimeType || '').match(/rate=(\d+)/) || [0, 24000])[1]);
    }
    if (!s.voiceId) throw new Error('Chưa có voice_id của giọng Manus.');
    const e = cfg.elevenlabs || {};
    const r = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${encodeURIComponent(s.voiceId)}?output_format=${e.output_format || 'mp3_44100_128'}`, {
      method: 'POST', headers: { 'xi-api-key': s.key, 'Content-Type': 'application/json', Accept: 'audio/mpeg' },
      body: JSON.stringify({ text, model_id: e.model_id || 'eleven_multilingual_v2', language_code: 'vi', voice_settings: e.voice_settings })
    });
    if (!r.ok) { let m = 'HTTP ' + r.status; try { const j = await r.json(); m = (j.detail && (j.detail.message || j.detail)) || m; } catch (x) {} throw new Error('ElevenLabs: ' + (typeof m === 'string' ? m : JSON.stringify(m))); }
    return new Blob([await r.arrayBuffer()], { type: 'audio/mpeg' });
  }
  /* NHÂN BẢN giọng Manus từ các đoạn lời dẫn gốc trong loi-dan/ (ElevenLabs Instant Voice Clone) → voice_id lưu trên máy này */
  async function clone(onStep) {
    await config(); const s = settings();
    if (!s.key) throw new Error('Nhập mã truy cập ElevenLabs trước.');
    const list = (await (await fetch('loi-dan/nhan-ban/thu-tu-mau.json', { cache: 'no-cache' })).json()).slice(0, 20), fd = new FormData();
    fd.append('name', 'Giọng Manus – Sử Việt'); fd.append('description', 'Giọng nam trầm, ấm, kể chuyện phim tài liệu – nhân bản từ lời dẫn Manus'); fd.append('remove_background_noise', 'false');
    for (let i = 0; i < list.length; i++) { onStep && onStep(`Đang gom mẫu giọng ${i + 1}/${list.length}…`); fd.append('files', await (await fetch(list[i])).blob(), list[i].replace(/^loi-dan\//, '').replace(/\//g, '-')); }
    onStep && onStep('Đang nhân bản giọng…');
    const r = await fetch('https://api.elevenlabs.io/v1/voices/add', { method: 'POST', headers: { 'xi-api-key': s.key }, body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok || !j.voice_id) throw new Error('ElevenLabs: ' + ((j.detail && (j.detail.message || JSON.stringify(j.detail))) || 'HTTP ' + r.status));
    save({ provider: 'elevenlabs', voiceId: j.voice_id }); return j.voice_id;
  }
  window.Giong = { config, settings, save, ready, speak, clone };
})();
