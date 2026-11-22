/* =========================================================================
   ĐĂNG YOUTUBE – tải video lên kênh của bạn qua YouTube Data API v3
   - Đăng nhập Google (Google Identity Services) bằng OAuth Client ID của chính bạn.
   - Mã truy cập chỉ nằm trong bộ nhớ trang (hết hạn sau ~1 giờ), không gửi đi đâu khác.
   - Tải kiểu "resumable" (có tiến độ); hẹn giờ bằng status.publishAt (YouTube tự đăng đúng giờ).
   ========================================================================= */
(function () {
  'use strict';
  const SCOPE = 'https://www.googleapis.com/auth/youtube.upload https://www.googleapis.com/auth/youtube.readonly';
  let gis = null, token = null, tokenExp = 0;

  function loadGIS() {
    if (!gis) gis = new Promise((ok, no) => { const s = document.createElement('script'); s.src = 'https://accounts.google.com/gsi/client'; s.async = true; s.onload = () => ok(window.google); s.onerror = () => { gis = null; no(new Error('Không tải được thư viện đăng nhập Google (kiểm tra mạng).')); }; document.head.appendChild(s); });
    return gis;
  }
  async function connect(clientId) {
    if (!/\.apps\.googleusercontent\.com$/.test(String(clientId || '').trim())) throw new Error('Client ID phải có dạng …apps.googleusercontent.com');
    const g = await loadGIS();
    const r = await new Promise((ok, no) => {
      const c = g.accounts.oauth2.initTokenClient({ client_id: clientId.trim(), scope: SCOPE, callback: x => x && x.access_token ? ok(x) : no(new Error((x && x.error) || 'Bạn đã hủy đăng nhập Google.')), error_callback: e => no(new Error(e && e.message || 'Bạn đã hủy đăng nhập Google.')) });
      c.requestAccessToken({ prompt: token ? '' : 'consent' });
    });
    token = r.access_token; tokenExp = Date.now() + (r.expires_in || 3600) * 1000;
    const ch = await api('https://www.googleapis.com/youtube/v3/channels?part=snippet&mine=true');
    const c = ch.items && ch.items[0]; if (!c) throw new Error('Tài khoản này chưa có kênh YouTube.');
    return { id: c.id, title: c.snippet.title, thumb: c.snippet.thumbnails && c.snippet.thumbnails.default && c.snippet.thumbnails.default.url };
  }
  const ready = () => token && Date.now() < tokenExp - 60000;
  async function api(url, opt = {}) {
    const r = await fetch(url, Object.assign({}, opt, { headers: Object.assign({ Authorization: 'Bearer ' + token }, opt.headers || {}) }));
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error((j.error && j.error.message) || ('HTTP ' + r.status));
    return j;
  }

  /* meta: { title, description, tags[], privacy, when(Date|null), category, kids, synthetic } */
  async function upload(file, meta, onProgress) {
    if (!ready()) throw new Error('Phiên đăng nhập Google đã hết hạn – bấm Kết nối lại.');
    const status = { privacyStatus: meta.when ? 'private' : (meta.privacy || 'public'), selfDeclaredMadeForKids: !!meta.kids, containsSyntheticMedia: !!meta.synthetic };
    if (meta.when) status.publishAt = meta.when.toISOString();
    const body = { snippet: { title: (meta.title || 'Video').slice(0, 100), description: (meta.description || '').slice(0, 5000), tags: (meta.tags || []).slice(0, 30), categoryId: String(meta.category || 27), defaultLanguage: 'vi', defaultAudioLanguage: 'vi' }, status };
    const init = await fetch('https://www.googleapis.com/upload/youtube/v3/videos?uploadType=resumable&part=snippet,status', {
      method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': 'application/json; charset=UTF-8', 'X-Upload-Content-Type': file.type || 'video/mp4', 'X-Upload-Content-Length': String(file.size) }, body: JSON.stringify(body) });
    if (!init.ok) { const j = await init.json().catch(() => ({})); throw new Error((j.error && j.error.message) || 'Không khởi tạo được phiên tải lên (HTTP ' + init.status + ').'); }
    const loc = init.headers.get('Location'); if (!loc) throw new Error('YouTube không trả về địa chỉ tải lên.');
    const res = await new Promise((ok, no) => {
      const x = new XMLHttpRequest(); x.open('PUT', loc); x.setRequestHeader('Content-Type', file.type || 'video/mp4');
      x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => { let j = {}; try { j = JSON.parse(x.responseText); } catch (e) {} x.status < 300 && j.id ? ok(j) : no(new Error((j.error && j.error.message) || 'Tải lên thất bại (HTTP ' + x.status + ').')); };
      x.onerror = () => no(new Error('Mất kết nối khi tải lên YouTube.')); x.send(file);
    });
    if (meta.thumb) { try { await fetch(`https://www.googleapis.com/upload/youtube/v3/thumbnails/set?videoId=${res.id}`, { method: 'POST', headers: { Authorization: 'Bearer ' + token, 'Content-Type': meta.thumb.type || 'image/jpeg' }, body: meta.thumb }); } catch (e) {} }
    return { id: res.id, url: 'https://youtu.be/' + res.id };
  }
  const history = {
    list() { try { return JSON.parse(localStorage.getItem('xv-yt-history') || '[]'); } catch (e) { return []; } },
    add(x) { const a = history.list(); a.unshift(x); try { localStorage.setItem('xv-yt-history', JSON.stringify(a.slice(0, 100))); } catch (e) {} }
  };
  window.YTUp = { connect, ready, upload, history };
})();
