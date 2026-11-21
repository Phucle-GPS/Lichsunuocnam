/* =========================================================================
   ĐĂNG FACEBOOK – kết nối Fanpage và đăng / hẹn giờ video qua Graph API
   - Đăng nhập bằng Facebook Login (JS SDK) với App ID của chính bạn.
   - Mã truy cập chỉ nằm trong trình duyệt này (sessionStorage), không gửi đi đâu khác.
   - Hẹn giờ do Facebook thực hiện (scheduled_publish_time) ⇒ máy tắt vẫn đăng đúng giờ.
   Lưu ý: Graph API chỉ đăng được lên Fanpage, KHÔNG đăng được lên trang cá nhân.
   ========================================================================= */
(function () {
  'use strict';
  const VER = 'v23.0';
  const SCOPES = 'pages_show_list,pages_read_engagement,pages_manage_posts,business_management';
  let sdkReady = null;

  function loadSDK(appId) {
    if (!sdkReady) sdkReady = new Promise((ok, no) => {
      window.fbAsyncInit = () => { FB.init({ appId, cookie: false, xfbml: false, version: VER }); ok(window.FB); };
      const s = document.createElement('script'); s.src = 'https://connect.facebook.net/vi_VN/sdk.js'; s.async = true; s.crossOrigin = 'anonymous';
      s.onerror = () => { sdkReady = null; no(new Error('Không tải được Facebook SDK (kiểm tra mạng hoặc trình chặn quảng cáo).')); };
      document.head.appendChild(s);
    });
    return sdkReady;
  }
  const api = (path, params = {}) => new Promise((ok, no) => FB.api(path, 'GET', params, r => (!r || r.error) ? no(new Error((r && r.error && r.error.message) || 'Lỗi Graph API')) : ok(r)));

  async function connect(appId) {
    if (!/^\d{6,20}$/.test(String(appId || ''))) throw new Error('App ID không hợp lệ (dãy số trong developers.facebook.com).');
    await loadSDK(appId);
    const res = await new Promise(ok => FB.login(ok, { scope: SCOPES, return_scopes: true }));
    if (!res || !res.authResponse) throw new Error('Bạn đã hủy đăng nhập Facebook.');
    const r = await api('/me/accounts', { fields: 'id,name,access_token,picture{url},tasks', limit: 100 });
    const pages = (r.data || []).filter(p => !p.tasks || p.tasks.includes('CREATE_CONTENT') || p.tasks.includes('MANAGE'));
    try { sessionStorage.setItem('xv-fb-pages', JSON.stringify(pages)); } catch (e) {}
    return pages;
  }
  function cachedPages() { try { return JSON.parse(sessionStorage.getItem('xv-fb-pages') || '[]'); } catch (e) { return []; } }

  /* Đăng video thường lên Fanpage (có tiến độ) */
  function uploadVideo(page, file, { title, description, when, onProgress }) {
    return new Promise((ok, no) => {
      const fd = new FormData();
      fd.append('access_token', page.access_token);
      fd.append('title', title || ''); fd.append('description', description || '');
      if (when) { fd.append('published', 'false'); fd.append('scheduled_publish_time', String(Math.floor(when.getTime() / 1000))); }
      fd.append('source', file, file.name || 'video.mp4');
      const x = new XMLHttpRequest();
      x.open('POST', `https://graph-video.facebook.com/${VER}/${page.id}/videos`);
      x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => { let r = {}; try { r = JSON.parse(x.responseText); } catch (e) {} if (x.status >= 200 && x.status < 300 && r.id) ok({ id: r.id, url: `https://www.facebook.com/${page.id}/videos/${r.id}` }); else no(new Error((r.error && r.error.message) || ('HTTP ' + x.status))); };
      x.onerror = () => no(new Error('Mất kết nối khi tải lên Facebook.'));
      x.send(fd);
    });
  }
  /* Đăng Reels (video dọc 9:16, 3–90 giây) – 3 bước: start → tải lên rupload → finish */
  async function uploadReel(page, file, { description, when, onProgress }) {
    const base = `https://graph.facebook.com/${VER}/${page.id}/video_reels`;
    const st = await (await fetch(`${base}?upload_phase=start&access_token=${encodeURIComponent(page.access_token)}`, { method: 'POST' })).json();
    if (!st.video_id) throw new Error((st.error && st.error.message) || 'Không khởi tạo được Reels.');
    await new Promise((ok, no) => {
      const x = new XMLHttpRequest(); x.open('POST', st.upload_url || `https://rupload.facebook.com/video-upload/${VER}/${st.video_id}`);
      x.setRequestHeader('Authorization', 'OAuth ' + page.access_token); x.setRequestHeader('offset', '0'); x.setRequestHeader('file_size', String(file.size));
      x.upload.onprogress = e => e.lengthComputable && onProgress && onProgress(e.loaded / e.total);
      x.onload = () => x.status < 300 ? ok() : no(new Error('Tải Reels thất bại (HTTP ' + x.status + ').')); x.onerror = () => no(new Error('Trình duyệt chặn tải Reels trực tiếp.')); x.send(file);
    });
    const q = new URLSearchParams({ upload_phase: 'finish', video_id: st.video_id, description: description || '', access_token: page.access_token, video_state: when ? 'SCHEDULED' : 'PUBLISHED' });
    if (when) q.set('scheduled_publish_time', String(Math.floor(when.getTime() / 1000)));
    const fin = await (await fetch(`${base}?${q}`, { method: 'POST' })).json();
    if (!fin.success) throw new Error((fin.error && fin.error.message) || 'Không hoàn tất được Reels.');
    return { id: st.video_id, url: `https://www.facebook.com/reel/${st.video_id}` };
  }

  /* Tự soạn mô tả từ kịch bản trận đánh */
  function describe(b) {
    if (!b) return { title: '', description: '' };
    const sc = b.scenes || [], first = (sc[0] && sc[0].say) || '', pts = (sc.find(s => s.type === 'points') || {}).items || [];
    const tags = ['#LichSuVietNam', '#SuViet', '#TranDanhLungDanh', '#' + (b.name || '').normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^A-Za-z0-9]/g, '')];
    if (/Hưng Đạo|HƯNG ĐẠO/.test(b.series || '') || /Trần Hưng Đạo/.test(b.who || '')) tags.push('#HungDaoVuong');
    return {
      title: `${b.name}${b.who ? ' – ' + b.who : ''}`.slice(0, 250),
      description: [first, pts.length ? 'Ý nghĩa lịch sử:\n' + pts.map(p => '• ' + p).join('\n') : '', b.sources && b.sources.length ? 'Nguồn tham khảo: ' + b.sources.join(', ') + '. Hình ảnh, sơ đồ mang tính minh họa.' : '', tags.join(' ')].filter(Boolean).join('\n\n')
    };
  }
  /* lịch sử đăng (chỉ lưu trong trình duyệt) */
  const history = {
    list() { try { return JSON.parse(localStorage.getItem('xv-fb-history') || '[]'); } catch (e) { return []; } },
    add(x) { const a = history.list(); a.unshift(x); try { localStorage.setItem('xv-fb-history', JSON.stringify(a.slice(0, 100))); } catch (e) {} }
  };
  window.FBPost = { connect, cachedPages, uploadVideo, uploadReel, describe, history, VER };
})();
